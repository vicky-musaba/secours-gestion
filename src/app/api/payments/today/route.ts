import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; username: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  try {
    let query = `SELECT p.*, i.client_name as customer_name, i.total_amount as invoice_total, i.invoice_number, i.infographer_id, i.currency as invoice_currency
                 FROM payments p
                 JOIN invoices i ON p.invoice_id = i.id
                 WHERE DATE(p.payment_date) = CURRENT_DATE`;
    const params: any[] = [];

    if (user.role === 'infographe') {
      query += ' AND i.infographer_id = $1';
      params.push(user.id);
    }

    query += ' ORDER BY p.payment_date DESC';

    const result = await pool.query(query, params);
    
    const paymentsWithCurrency = result.rows.map(payment => {
      if (payment.currency) {
        return payment;
      }
      return { ...payment, currency: payment.invoice_currency || 'CDF' };
    });
    
    return NextResponse.json(paymentsWithCurrency);
  } catch (error) {
    console.error('Get today payments error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
