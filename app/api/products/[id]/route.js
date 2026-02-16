import pool from "../../../lib/db";

export async function PUT(request, { params }) {
    try {
        const {id} = await params;
        const productId = Number(id);

        if (!id || isNaN(id)) {
            return Response.json(
                { error: "Invalid product ID" }, 
                { status: 400 });
        }
        
        const body = await request.json();
        const { 
            product_name, 
            product_stockQty, 
            product_unitOfMeasure, 
            product_unitPrice, 
            product_reorderLevel, 
            product_description
        } = body;

        const [result] =await pool.query(
            `UPDATE tbl_product
            SET product_name = ?, 
                product_stockQty = ?, 
                product_unitOfMeasure = ?,
                product_unitPrice = ?,
                product_reorderLevel = ?,
                product_description = ? 
            WHERE product_ID = ?`,
            
            [
                product_name, 
                product_stockQty, 
                product_unitOfMeasure, 
                product_unitPrice, 
                product_reorderLevel, 
                product_description, 
                id
            ]
        );
        return Response.json({message: "Product updated successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});   
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