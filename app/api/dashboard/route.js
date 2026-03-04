import pool from "../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Today's Sales — DATE() wrapper needed for datetime columns
    const [salesToday] = await pool.query(`
      SELECT SUM(sales_totalAmount) AS total
      FROM tbl_sales
      WHERE DATE(sales_createdAt) = CURDATE()
    `);

    // 2. Low Stock Items
    const [lowStock] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM tbl_product
      WHERE product_stockQty <= product_reorderLevel
    `);

    // 3. Total Outstanding — only unpaid/partial, exclude fully paid
    const [receivables] = await pool.query(`
      SELECT SUM(sales_Balance) AS total
      FROM tbl_sales
      WHERE sales_paymentStatus != 'Paid'
        AND sales_Balance > 0
    `);

    // 4. Recent Sales
    const [recentSales] = await pool.query(`
      SELECT
        s.sales_ID,
        c.client_name,
        s.sales_createdAt,
        s.sales_totalAmount,
        s.sales_status,
        s.sales_paymentStatus,
        s.sales_Balance
      FROM tbl_sales s
      JOIN tbl_client c ON s.client_ID = c.client_ID
      ORDER BY s.sales_createdAt DESC
      LIMIT 5
    `);

    return NextResponse.json({
      todaySales:       salesToday[0].total  || 0,
      lowStockCount:    lowStock[0].count    || 0,
      totalReceivables: receivables[0].total || 0,
      recentSales,
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}