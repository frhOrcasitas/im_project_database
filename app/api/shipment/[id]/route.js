import pool from "../../../lib/db";

// GET - single shipment

export async function GET(request, { params }) {
    try {
        const { id } = params;

        const [shipment] = await pool.query(
            `SELECT
                sh.shipment_ID,
                sh.sales_ID,
                sh.shipment_date,
                sh.vehicle_id,
                sh.manager_id,
                s.sales_status,
                v.vehicle_model,
                v.vehicle_number
            FROM tbl_shipment sh
            JOIN tbl_sales s ON sh.sales_ID = s.sales_ID
            JOIN tbl_vehicle v ON sh.vehicle_id = v.vehicle_ID
            WHERE sh.shipment_ID = ?`,
            [id]
        );

        if (shipment.length === 0) {
            return Response.json(
                {error: "Shipment not found."},
                { status: 404 }
            );
        }

        const [products] = await pool.query(
            `SELECT
                sp.productLine_ID,
                p.product_name,
                sp.product_quantity
            FROM tbl_shipment_productdetails sp
            JOIN tbl_product p
            ON sp.productLine_ID = p.product_ID
            WHERE sp.shipment_ID = ?`,
            [id]
        );

        const [employees] = await pool.query(
            `SELECT
                e.employee_ID,
                e.employee_name,
                sed.employee_role
            FROM tbl_shipment_employee_details sed
            JOIN tbl_employee e
            ON sed.employee_ID = e.employee_ID
            WHERE sed.shipment_ID = ?`,
            [id]
        );

        return Response.json({
            shipment: shipment[0],
            products,
            employees
        });

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// PATCH - update shipment

export async function PATCH(request, { params }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = params;
        const body = await request.json();
        const { manager_id, vehicle_id } = body;

        const [shipment] = await connection.query(
            `SELECT shipment_ID FROM tbl_shipment WHERE shipment_ID = ?`,
            [id]
        );

        if (shipment.length === 0) {
            throw new Error("Shipment not found.");
        }

        if (manager_id) {
            const [manager] = await connection.query(
                `SELECT manager_ID FROM tbl_manager WHERE manager_ID = ?`,
                [manager_id]
            );

            if (manager.length === 0) {
                throw new Error("Manager not found.");
            }

            await connection.query(
                `UPDATE tbl_shipment
                SET manager_id = ?
                WHERE shipment_ID = ?`,
                [manager_id, id]
            );
        }

        if (vehicle_id) {
            const [vehicle] = await connection.query(
                `SELECT vehicle_ID FROM tbl_vehicle WHERE vehicle_ID = ?`,
                [vehicle_id]
            );

            if (vehicle.length === 0) {
                throw new Error("Vehicle not found.");
            }

            await connection.query(
                `UPDATE tbl_shipment
                SET vehicle_id = ?
                WHERE shipment_ID = ?`,
                [vehicle_id, id]
            );
        }

        await connection.commit();

        return Response.json({
            message: "Shipment updated successfully."
        });

    } catch (error) {
        await connection.rollback();
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}