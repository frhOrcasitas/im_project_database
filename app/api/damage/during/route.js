import pool from "../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  // Get a connection from the pool for the transaction
  const connection = await pool.getConnection();

  try {
    const body = await req.json();
    // Default damage_date to today if not provided by frontend
    const { shipment_ID, items, damage_date = new Date().toISOString().split('T')[0] } = body;

    if (!shipment_ID || !items?.length) {
      return NextResponse.json(
        { error: "Missing Shipment ID or items." },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    for (const item of items) {
      const { productLine_ID, damage_quantity, damage_description } = item;

      // 1. Validate the item exists in this specific shipment
      const [shipmentRows] = await connection.query(
        `SELECT product_ID, product_quantity 
         FROM tbl_shipment_productdetails 
         WHERE shipment_ID = ? AND productLine_ID = ?`,
        [shipment_ID, productLine_ID]
      );

      if (shipmentRows.length === 0) {
        throw new Error(`Item (Line: ${productLine_ID}) is not part of shipment ${shipment_ID}`);
      }

      const { product_ID, product_quantity: shippedQty } = shipmentRows[0];

      if (Number(damage_quantity) > shippedQty) {
        throw new Error(`Damage quantity for Line ${productLine_ID} exceeds shipped quantity.`);
      }

      // 2. Get Product Price and Current Stock
      const [productRows] = await connection.query(
        `SELECT product_stockQty, product_unitPrice 
         FROM tbl_product 
         WHERE product_ID = ?`,
        [product_ID]
      );

      if (productRows.length === 0) throw new Error("Product not found in inventory.");

      const unitPrice = productRows[0].product_unitPrice;
      const currentStock = productRows[0].product_stockQty;
      const subtotal = Number(damage_quantity) * unitPrice;

      // 3. Insert into tbl_damage_during (Matching your describe exactly)
      // Note: damage_amount is NOT NULL in your schema, we use unitPrice
      await connection.query(
        `INSERT INTO tbl_damage_during 
         (shipment_id, damage_date, productLine_id, damage_quantity, damage_amount, damage_subtotal, damage_description) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          shipment_ID,
          damage_date,
          productLine_ID,
          damage_quantity,
          unitPrice, // damage_amount
          subtotal,  // damage_subtotal
          damage_description || null
        ]
      );

      // 4. Update Product Stock (Deducting damaged items)
      await connection.query(
        `UPDATE tbl_product 
         SET product_stockQty = product_stockQty - ? 
         WHERE product_ID = ?`,
        [damage_quantity, product_ID]
      );
    }

    await connection.commit();
    return NextResponse.json({ message: "Damage recorded successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT 
          d.*, 
          p.product_name 
       FROM tbl_damage_during d
       JOIN tbl_shipment_productdetails spd ON d.productLine_id = spd.productLine_ID
       JOIN tbl_product p ON spd.product_ID = p.product_ID
       ORDER BY d.damage_ID DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}