import pool from "../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Get Today's Sales Total
    const [salesToday] = await pool.query(`
      SELECT SUM(sales_totalAmount) as total 
      FROM tbl_sales 
      WHERE sales_createdAt = CURDATE()
    `);

    // 2. Count Low Stock Items
    const [lowStock] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tbl_product 
      WHERE product_stockQty <= product_reorderLevel
    `);

    // 3. Get Total Outstanding Balance (Receivables)
    const [receivables] = await pool.query(`
      SELECT SUM(sales_Balance) as total 
      FROM tbl_sales
    `);

    // 4. Get 5 Most Recent Sales with Client Names
    const [recentSales] = await pool.query(`
        SELECT s.sales_ID, c.client_name, s.sales_createdAt, s.sales_totalAmount, s.sales_status 
        FROM tbl_sales s 
        JOIN tbl_client c ON s.client_ID = c.client_ID 
        ORDER BY s.sales_createdAt DESC 
        LIMIT 5
    `);

    return NextResponse.json({
      todaySales: salesToday[0].total || 0,
      lowStockCount: lowStock[0].count || 0,
      totalReceivables: receivables[0].total || 0,
      recentSales: recentSales
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}