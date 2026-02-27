import { NextResponse } from "next/server";
import pool from "../../../lib/db";

export async function POST(req) {
  try {
    const { clientId, paymentAmount } = await req.json();

    if (!clientId || !paymentAmount) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    const updateBalanceQuery = `
      UPDATE tbl_client 
      SET client_outstandingbalance = client_outstandingbalance - ? 
      WHERE client_ID = ?
    `;

    await pool.query(updateBalanceQuery, [paymentAmount, clientId]);

    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ details: error.message }, { status: 500 });
  }
}