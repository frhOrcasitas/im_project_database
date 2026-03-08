import pool from "../../../lib/db";

export async function POST(req) {
  const connection = await pool.getConnection();

  try {
    const { manager_ID, employee_ID, damage_date, items } = await req.json();

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
      const { product_ID, damage_quantity } = item;

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
        (product_ID, manager_ID, employee_ID, damage_quantity, damage_date, damage_subtotal)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          product_ID,
          manager_ID,
          employee_ID,
          damage_quantity,
          damage_date,
          subtotal
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
                d.damage_subtotal,
                d.damage_description,
                d.employee_id,
                d.manager_id
             FROM tbl_damage_withinwarehouse d
             JOIN tbl_product p
                ON d.product_id = p.product_ID
             ORDER BY d.damage_ID DESC`
        );

        return Response.json(rows);

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}