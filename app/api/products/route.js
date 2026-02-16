import pool from "@/lib/db";

export async function GET() {

    /* Fix this part */
    try {
        const [rows] = await pool.query("SELECT 1 + 1 AS result");
        return Response.json(rows);

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { product_name, product_stockQty, product_unitOfMeasure} = body;

        await pool.query(
            "INSERT INTO tbl_product (product_name, product_stockQty, product_unitOfMeasure) VALUES (?, ?, ?)",
            [product_name, product_stockQty, product_unitOfMeasure]
        );


        return Response.json({message: "Product created successfully"});
    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}