import pool from "../../../lib/db";

import pool from "../../../lib/db";

// GET - Fetch a single product's details
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const [rows] = await pool.query("SELECT * FROM tbl_product WHERE product_ID = ?", [id]);
        
        if (rows.length === 0) return Response.json({ error: "Product not found" }, { status: 404 });
        
        return Response.json(rows[0]);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update a specific product
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { product_name, product_unitOfMeasure, product_unitPrice, product_reorderLevel, product_description } = body;

        const [result] = await pool.query(
            `UPDATE tbl_product 
             SET product_name = ?, product_unitOfMeasure = ?, product_unitPrice = ?, 
                 product_reorderLevel = ?, product_description = ? 
             WHERE product_ID = ?`,
            [product_name, product_unitOfMeasure, product_unitPrice, product_reorderLevel, product_description, id]
        );

        return Response.json({ message: "Product updated successfully" });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const [result] = await pool.query("DELETE FROM tbl_product WHERE product_ID = ?", [id]);
        
        if (result.affectedRows === 0) {
            return Response.json({ error: "Product not found" }, { status: 404 });
        }

        return Response.json({message: "Product deleted successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}