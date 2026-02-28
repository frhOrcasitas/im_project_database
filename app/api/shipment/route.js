import pool from "../../lib/db";


// POST - CREATE SHIPMENTS

import pool from "../../lib/db";

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { sales_ID, manager_id, vehicle_id, items, employees } = await request.json();

        // 1. Validation: Check Sale status
        const [sale] = await connection.query(
            `SELECT sales_status FROM tbl_sales WHERE sales_ID = ?`, [sales_ID]
        );
        if (sale.length === 0) throw new Error("Sale not found.");
        if (sale[0].sales_status === "Cancelled" || sale[0].sales_status === "Completed") {
            throw new Error(`Cannot ship: Sale is ${sale[0].sales_status}`);
        }

        // 2. Create Shipment Header
        const [shipmentResult] = await connection.query(
            `INSERT INTO tbl_shipment (sales_ID, manager_id, shipment_date, vehicle_id) VALUES (?, ?, CURDATE(), ?)`,
            [sales_ID, manager_id, vehicle_id]
        );
        const shipment_ID = shipmentResult.insertId;

        // 3. Process Items & Deduct Stock
        for (const item of items) {
            // Check remaining quantity for this specific productLine
            const [sold] = await connection.query(
                `SELECT salesDetail_qty, product_ID FROM tbl_sales_details WHERE sales_ID = ? AND productLine_ID = ?`,
                [sales_ID, item.productLine_ID]
            );

            const [shipped] = await connection.query(
                `SELECT IFNULL(SUM(sp.product_quantity), 0) as shipped_qty
                 FROM tbl_shipment_productdetails sp
                 JOIN tbl_shipment s ON sp.shipment_ID = s.shipment_ID
                 WHERE s.sales_ID = ? AND sp.productLine_ID = ?`,
                [sales_ID, item.productLine_ID]
            );

            const remaining = sold[0].salesDetail_qty - shipped[0].shipped_qty;
            if (item.quantity > remaining) throw new Error(`Over-shipping item ${item.productLine_ID}. Max: ${remaining}`);

            // Insert details
            await connection.query(
                `INSERT INTO tbl_shipment_productdetails (shipment_ID, productLine_ID, product_quantity) VALUES (?, ?, ?)`,
                [shipment_ID, item.productLine_ID, item.quantity]
            );

            // ACTUAL INVENTORY DEDUCTION (Rule: "Recorded and deducted")
            await connection.query(
                `UPDATE tbl_product SET product_stockQty = product_stockQty - ? WHERE product_ID = ?`,
                [item.quantity, sold[0].product_ID]
            );
        }

        // 4. Assign Employees to Shipment
        if (employees?.length) {
            for (const empId of employees) {
                await connection.query(
                    `INSERT INTO tbl_shipment_employee_details (shipment_ID, employee_ID) VALUES (?, ?)`,
                    [shipment_ID, empId]
                );
            }
        }

        // 5. Final Check: Is the whole Sale now shipped?
        const [allRemaining] = await connection.query(
            `SELECT (sd.salesDetail_qty - IFNULL(SUM(sp.product_quantity), 0)) as diff
             FROM tbl_sales_details sd
             LEFT JOIN tbl_shipment sh ON sd.sales_ID = sh.sales_ID
             LEFT JOIN tbl_shipment_productdetails sp ON sh.shipment_ID = sp.shipment_ID AND sd.productLine_ID = sp.productLine_ID
             WHERE sd.sales_ID = ?
             GROUP BY sd.productLine_ID`, [sales_ID]
        );

        const isFullyShipped = allRemaining.every(row => row.diff <= 0);
        if (isFullyShipped) {
            await connection.query(
                `UPDATE tbl_sales SET sales_status = 'Completed', sales_dateCompleted = CURDATE() WHERE sales_ID = ?`,
                [sales_ID]
            );
        }

        await connection.commit();
        return Response.json({ message: "Shipment processed and stock deducted.", shipment_ID });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}

// GET - LIST SHIPMENTS

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT
                sh.shipment_ID,
                sh.sales_ID,
                sh.shipment_date,
                sh.vehicle_id,
                m.manager_ID,
                s.sales_status
            FROM tbl_shipment sh
            JOIN tbl_manager m ON sh.manager_id = m.manager_ID
            JOIN tbl_sales s ON sh.sales_ID = s.sales_ID
            ORDER BY sh.shipment_date DESC`
        );

        return Response.json(rows);


    } catch (error) {
        return Response.json({error: error.message}, {status: 500});
    }
}