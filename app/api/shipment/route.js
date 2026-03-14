import pool from "../../lib/db";

// POST - CREATE SHIPMENTS
export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { sales_ID, manager_id, vehicle_id, items, employees } = await request.json();
        console.log("SHIPMENT PAYLOAD:", JSON.stringify({ sales_ID, items }));

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
            const productID = item.productLine_ID; 

            // Check item exists in sale
            const [sold] = await connection.query(
                `SELECT salesDetail_qty FROM tbl_sales_details 
                 WHERE sales_ID = ? AND productLine_ID = ?`,
                [sales_ID, productID]
            );
            console.log("SOLD QUERY:", sales_ID, productID, sold);
            if (!sold.length) throw new Error(`Item not found in sale: product ${productID}`);

            // Check how much has already been shipped
            const [shipped] = await connection.query(
                `SELECT IFNULL(SUM(sp.product_quantity), 0) AS shipped_qty
                 FROM tbl_shipment_productdetails sp
                 JOIN tbl_shipment s ON sp.shipment_ID = s.shipment_ID
                 WHERE s.sales_ID = ? AND sp.productLine_ID = ?`,
                [sales_ID, productID]
            );

            const remaining = sold[0].salesDetail_qty - shipped[0].shipped_qty;
            if (item.quantity > remaining) {
                throw new Error(`Over-shipping item ${productID}. Max remaining: ${remaining}`);
            }

            // Insert shipment product detail
            await connection.query(
                `INSERT INTO tbl_shipment_productdetails (shipment_ID, productLine_ID, product_ID, product_quantity)
                 VALUES (?, ?, ?, ?)`,
                [shipment_ID, productID, productID, item.quantity]
            );

            // Deduct from inventory
            await connection.query(
                `UPDATE tbl_product SET product_stockQty = product_stockQty - ? WHERE product_ID = ?`,
                [item.quantity, productID]
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

        // 5. Update sale status to In Transit
        await connection.query(
            `UPDATE tbl_sales SET sales_status = 'In Transit' WHERE sales_ID = ?`,
            [sales_ID]
        );

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
    const [rows] = await pool.query(`
      SELECT
        sh.shipment_ID,
        sh.sales_ID,
        sh.shipment_date,
        sh.vehicle_id,
        v.vehicle_number,
        v.vehicle_model,
        m.manager_ID,
        e.employee_name  AS manager_name,
        s.sales_status,
        s.sales_paymentStatus,
        s.sales_totalAmount,
        s.sales_Balance,
        c.client_name
      FROM tbl_shipment sh
      JOIN tbl_manager m   ON sh.manager_id  = m.manager_ID
      JOIN tbl_employee e  ON m.employee_ID  = e.employee_ID
      JOIN tbl_sales s     ON sh.sales_ID    = s.sales_ID
      JOIN tbl_client c    ON s.client_ID    = c.client_ID
      JOIN tbl_vehicle v   ON sh.vehicle_id  = v.vehicle_ID
      ORDER BY sh.shipment_date DESC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
