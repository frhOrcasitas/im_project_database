import { NextResponse } from "next/server";
import pool from "../../lib/db"; 

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.client_ID                AS id,
        c.client_name              AS customer,
        cust.contactPerson         AS contact,
        COUNT(s.sales_ID)          AS invoices,

        SUM(s.sales_Balance)       AS totalDue,

        COALESCE(SUM(
          CASE WHEN DATEDIFF(NOW(), s.sales_createdAt) <= 30
          THEN s.sales_Balance ELSE 0 END
        ), 0) AS current_30,

        COALESCE(SUM(
          CASE WHEN DATEDIFF(NOW(), s.sales_createdAt) BETWEEN 31 AND 60
          THEN s.sales_Balance ELSE 0 END
        ), 0) AS days_60,

        COALESCE(SUM(
          CASE WHEN DATEDIFF(NOW(), s.sales_createdAt) > 60
          THEN s.sales_Balance ELSE 0 END
        ), 0) AS days_90

      FROM tbl_client c
      INNER JOIN tbl_customer cust ON c.client_contactPersonID = cust.client_contactPersonID
      INNER JOIN tbl_sales s
        ON c.client_ID = s.client_ID
        AND s.sales_paymentStatus != 'Paid'
        AND s.sales_status != 'Cancelled'
        AND s.sales_Balance > 0
      GROUP BY c.client_ID, c.client_name, cust.contactPerson
      HAVING SUM(s.sales_Balance) > 0
      ORDER BY totalDue DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("CRITICAL SQL ERROR:", error.message);
    return NextResponse.json({
      error: "Database query failed",
      details: error.message
    }, { status: 500 });
  }
}
