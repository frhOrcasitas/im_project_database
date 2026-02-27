import { NextResponse } from "next/server";
import pool from "../../lib/db"; 

export async function GET() {
  try {
    const query = `
        SELECT 
            c.client_ID as id,
            c.client_name as customer,
            cust.contactPerson as contact, -- Now pulling from tbl_customer
            COUNT(s.sales_ID) as invoices,
            c.client_outstandingbalance as totalDue,
            COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), s.sales_createdAt) <= 30 THEN s.sales_Balance ELSE 0 END), 0) as current_30,
            COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), s.sales_createdAt) BETWEEN 31 AND 60 THEN s.sales_Balance ELSE 0 END), 0) as days_60,
            COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), s.sales_createdAt) > 60 THEN s.sales_Balance ELSE 0 END), 0) as days_90
        FROM tbl_client c
        INNER JOIN tbl_customer cust ON c.client_contactPersonID = cust.client_contactPersonID
        LEFT JOIN tbl_sales s ON c.client_ID = s.client_ID AND s.sales_paymentStatus != 'Paid'
        WHERE c.client_outstandingbalance > 0
        GROUP BY c.client_ID, c.client_name, cust.contactPerson, c.client_outstandingbalance;
    `;

    const [rows] = await pool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    // Log the actual error to your terminal so you can see the SQL message
    console.error("CRITICAL SQL ERROR:", error.message); 
    return NextResponse.json({ 
      error: "Database query failed", 
      details: error.message 
    }, { status: 500 });
  }
}