import pool from "../../lib/db";


// POST - CREATE SHIPMENTS

export async function POST(request) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const body = await request.json();
        const {sales_ID, manager_id, vehicle_id, items, employees} = body;

        if (!items || items.length === 0) {
            return Response.json(
                { error: "Shipment must contain at least one product." },
                { status: 400}
            );
        }

        const [sale] = await connection.query(
            `SELECT sales_status
            FROM tbl_sales
            WHERE sales_ID = ?`,
            [sales_ID]    
        );

        if (sale.length === 0) {
            throw new Error("Sale not found.");
        }

        if (sale[0].sales_status === "Cancelled") {
            throw new Error("Cannot create shipment for cancelled sale.");
        }

        const [manager] = await connection.query (
            `SELECT manager_ID FROM tbl_manager WHERE manager_ID = ?`,
            [manager_id]
        )

        if (manager.length === 0) {
            throw new Error("Manager not found.");
        }

        const [vehicle] = await connection.query(
            `SELECT vehicle_ID FROM tbl_vehicle WHERE vehicle_ID = ?`,
            [vehicle_id]
        );

        if (vehicle.length === 0) {
            throw new Error("Vehicle not found.");
        }

        const productSet = new Set();
        for (const item of items) {
            if (productSet.has(item.productLine_ID)) {
                return Response.json(
                    { error: "Duplicate product in shipment is not allowed. "},
                    { status: 400 }
                );
            }
            productSet.add(item.productLine_ID);

            if (item.quantity <= 0) {
                return Response.json(
                    {error: "Shipment quantity must be greater than zero."},
                    { status: 400 }
                );
            }
        }

        const [shipmentResult] = await connection.query(
            `INSERT INTO tbl_shipment
            (sales_ID, manager_id, shipment_date, vehicle_id)
            VALUES (?, ?, CURDATE(), ?)`,
            [sales_ID, manager_id, vehicle_id]
        );

        const shipment_ID = shipmentResult.insertId;

        for (const item of items) {
            const [sold] = await connection.query(
                `SELECT salesDetail_qty
                FROM tbl_sales_details
                WHERE sales_ID = ?
                AND productLine_ID = ?`,
                [sales_ID, item.productLine_ID]
            );

            if (sold.length === 0) {
                throw new Error("Product does not belong to this sale.");
            }

            const soldQty = sold[0].salesDetail_qty;

            const [shipped] = await connection.query(
                `SELECT IFNULL(SUM(sp.product_quantity), 0) as shipped_qty
                FROM tbl_shipment_productdetails sp
                JOIN tbl_shipment s
                ON sp.shipment_ID = s.shipment_ID
                WHERE s.sales_ID = ?
                AND sp.productLine_ID = ?`,
                [sales_ID, item.productLine_ID]
            );

            const shippedQty = shipped[0].shipped_qty;
            const remainingQty = soldQty - shippedQty;

            if (item.quantity > remainingQty) {
                throw new Error(
                    `Shipment quantity exceeds remaining quantity. Remaining: ${remainingQty}`
                );
            }

            await connection.query(
                `INSERT INTO tbl_shipment_productdetails
                (shipment_ID, productLine_ID, product_quantity)
                VALUES (?, ?, ?)`,
                [shipment_ID, item.productLine_ID, item.quantity]
            );
        }

        if (employees && employees.length > 0) {
            for (const emp of employees) {
                const [employee] = await connection.query(
                    `SELECT employee_ID FROM tbl_employee WHERE employee_ID = ?`,
                    [emp]
                );

                if (employee.length === 0) {
                    throw new Error(`Employee ${emp} not found.`);
                }

                await connection.query(
                    `INSERT INTO tbl_shipment_employee_details
                    (shipment_ID, employee_ID)
                    VALUES (?, ?)`,
                    [shipment_ID,  emp]
                );
            }
        }

        const [saleProducts] = await connection.query(
            `SELECT productLine_ID, salesDetail_qty
            FROM tbl_sales_details
            WHERE sales_ID = ?`,
            [sales_ID]
        );

        let fullyDelivered = true;

        for (const product of saleProducts) {
            const [totalShipped] = await connection.query(
                `SELECT IFNULL(SUM(sp.product_quantity), 0) as shipped_qty
                FROM tbl_shipment_productdetails sp
                JOIN tbl_shipment s
                ON sp.shipment_ID = s.shipment_ID
                WHERE s.sales_ID = ?
                AND sp.productLine_ID = ?`,
                [sales_ID, product.productLine_ID]
            );

            if (totalShipped[0].shipped_qty < product.salesDetail_qty) {
                fullyDelivered = false;
                break;
            }
        }

        if (fullyDelivered) {
            await connection.query(
                `UPDATE tbl_sales
                SET sales_status = 'Completed',
                    sales_dateCompleted = CURDATE()
                WHERE sales_ID = ?`,
                [sales_ID]
            );
        }

        await connection.commit();

        return Response.json({
            message: "Shipment created successfully.",
            shipment_ID
        });


    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, {status: 500});

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