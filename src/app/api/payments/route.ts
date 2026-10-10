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
    let query = `SELECT p.*, i.invoice_number, i.client_name, i.infographer_id, i.items
                 FROM payments p
                 JOIN invoices i ON p.invoice_id = i.id
                 ORDER BY p.payment_date DESC`;
    const params: any[] = [];

    if (user.role === 'infographe') {
      query += ' WHERE i.infographer_id = $1';
      params.push(user.id);
    }

    const result = await pool.query(query, params);

    const paymentsWithCurrency = result.rows.map(payment => {
      if (payment.currency) {
        return payment;
      }
      const items = typeof payment.items === 'string' ? JSON.parse(payment.items) : payment.items;
      const currency = items?.[0]?.currency || 'CDF';
      return { ...payment, currency };
    });

    return NextResponse.json(paymentsWithCurrency);
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invoice_id, amount, amount_paid, payment_method, cashier_id, reference, currency } = body;

    if (!invoice_id || !amount || !payment_method) {
      return NextResponse.json({ message: 'Données incomplètes' }, { status: 400 });
    }

    let paymentCurrency = currency;
    if (!paymentCurrency) {
      const invoiceResult = await pool.query(
        'SELECT currency FROM invoices WHERE id = $1',
        [invoice_id]
      );
      if (invoiceResult.rows.length > 0) {
        paymentCurrency = invoiceResult.rows[0].currency || 'CDF';
      } else {
        paymentCurrency = 'CDF';
      }
    }

    const result = await pool.query(
      'INSERT INTO payments (invoice_id, amount, amount_paid, payment_method, cashier_id, reference, currency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [invoice_id, amount, amount_paid || amount, payment_method, cashier_id || user.id, reference, paymentCurrency]
    );

    await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2',
      ['paid', invoice_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
