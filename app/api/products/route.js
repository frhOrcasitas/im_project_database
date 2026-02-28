import pool from "../../lib/db";

// GET - All Products
export async function GET() {
    try {
        const [rows] = await pool.query("SELECT * FROM tbl_product ORDER BY product_name ASC");
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST - New Product
export async function POST(request) {
    try {
        const body = await request.json();
        const { product_name, product_stockQty, product_unitOfMeasure, product_unitPrice, product_reorderLevel, product_description } = body;

        await pool.query(
            `INSERT INTO tbl_product (product_name, product_stockQty, product_unitOfMeasure, 
            product_unitPrice, product_reorderLevel, product_description) VALUES (?, ?, ?, ?, ?, ?)`,
            [product_name, product_stockQty, product_unitOfMeasure, product_unitPrice, product_reorderLevel, product_description]
        );
        return Response.json({ message: "Product created successfully" });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}