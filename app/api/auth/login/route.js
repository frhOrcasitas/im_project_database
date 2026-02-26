import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // 1. Setup Connection
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'db_mrintcorp'
        });

        const [rows] = await connection.execute(
            'SELECT employee_ID, employee_name, employee_role FROM tbl_employee WHERE employee_email = ? AND employee_contactNo = ? AND employee_status = "Active"',
            [username, password]
        );

        await connection.end();

        if (rows.length > 0) {
            const user =rows[0];
            return NextResponse.json({
                success: true,
                user: {
                    is: user.employee_ID,
                    name: user.employee_name,
                    role: user.employee_role
                }
            });
             
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials or inactive account' },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}