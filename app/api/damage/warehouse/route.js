import pool from "../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const connection = await pool.getConnection();

  try {
    const { manager_ID, employee_ID, damage_date, items } = await req.json();
    console.log("DAMAGE PAYLOAD:", { manager_ID, employee_ID, damage_date, items });

    if (!manager_ID || !employee_ID || !damage_date || !items?.length) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const productSet = new Set();

    for (const item of items) {
      if (productSet.has(item.product_ID)) {
        throw new Error("Duplicate product in damage list.");
      }
      productSet.add(item.product_ID);
    }

    for (const item of items) {
      const { product_ID, damage_quantity, damage_description } = item;

      const [product] = await connection.query(
        `SELECT product_stockQty, product_unitPrice 
         FROM tbl_product 
         WHERE product_ID = ?`,
        [product_ID]
      );

      if (product.length === 0) {
        throw new Error("Product not found.");
      }

      const currentStock = product[0].product_stockQty;
      const unitPrice = product[0].product_unitPrice;

      if (damage_quantity > currentStock) {
        throw new Error(
          `Damage exceeds available stock (${currentStock}).`
        );
      }

      const subtotal = damage_quantity * unitPrice;

      await connection.query(
        `INSERT INTO tbl_damage_withinwarehouse
        (product_id, manager_id, employee_id, damage_quantity, damage_amount, damage_date, damage_subtotal, damage_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product_ID,
          manager_ID,
          employee_ID,
          damage_quantity,
          subtotal,   // damage_amount
          damage_date,
          subtotal,   // damage_subtotal
          damage_description
        ]
      );

      await connection.query(
        `UPDATE tbl_product
         SET product_stockQty = product_stockQty - ?
         WHERE product_ID = ?`,
        [damage_quantity, product_ID]
      );
    }

    await connection.commit();

    return NextResponse.json({
      message: "Warehouse damage recorded successfully."
    });

  } catch (error) {
    await connection.rollback();

    return NextResponse.json(
      { error: error.message },
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
                d.damage_ID,
                d.product_id,
                p.product_name,
                d.damage_quantity,
                d.damage_amount,
                d.damage_subtotal,
                d.damage_description,
                d.damage_date,
                e.employee_name,
                me.employee_name AS manager_name
             FROM tbl_damage_withinwarehouse d
             JOIN tbl_product p ON d.product_id = p.product_ID
             LEFT JOIN tbl_employee e ON d.employee_id = e.employee_ID
             LEFT JOIN tbl_manager m ON d.manager_id = m.manager_ID
             LEFT JOIN tbl_employee me ON m.employee_ID = me.employee_ID
             ORDER BY d.damage_ID DESC`
        );
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}