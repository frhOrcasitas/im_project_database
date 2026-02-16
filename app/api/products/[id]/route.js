import pool from "@/lib/db";

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { product_name, product_stockQty, product_unitOfMeasure} = body;

        await pool.query(
            "UPDATE tbl_product SET product_name = ?, product_stockQty = ?, product_unitOfMeasure = ? WHERE id = ?",
            [product_name, product_stockQty, product_unitOfMeasure, id]
        );

        return Response.json({message: "Product updated successfully"});
    } catch (error) {
        return Response.json({error: error.message }, {status: 500});   
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        await pool.query("DELETE FROM tbl_product WHERE id = ?", [id]);

        return Response.json({message: "Product deleted successfully"});
    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}