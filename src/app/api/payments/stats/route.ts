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
    let paymentsQuery = `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
                          FROM payments p
                          JOIN invoices i ON p.invoice_id = i.id`;
    let todayPaymentsQuery = `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
                              FROM payments p
                              JOIN invoices i ON p.invoice_id = i.id
                              WHERE DATE(p.payment_date) = CURRENT_DATE`;
    let pendingInvoicesQuery = `SELECT COUNT(*) as count
                                 FROM invoices
                                 WHERE status = 'sent'`;
    const params: any[] = [];

    if (user.role === 'infographe') {
      paymentsQuery += ' WHERE i.infographer_id = $1';
      todayPaymentsQuery += ' AND i.infographer_id = $1';
      pendingInvoicesQuery += ' AND infographer_id = $1';
      params.push(user.id);
    }

    console.log('Executing pendingInvoicesQuery:', pendingInvoicesQuery, 'params:', params);
    const allPaymentsResult = await pool.query(paymentsQuery, params);
    const todayPaymentsResult = await pool.query(todayPaymentsQuery, params);
    const pendingInvoicesResult = await pool.query(pendingInvoicesQuery, params);
    console.log('Pending invoices count:', pendingInvoicesResult.rows[0].count);

    let paymentsByCurrencyQuery = `SELECT i.currency, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
                                     FROM payments p
                                     JOIN invoices i ON p.invoice_id = i.id`;
    let todayPaymentsByCurrencyQuery = `SELECT i.currency, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
                                         FROM payments p
                                         JOIN invoices i ON p.invoice_id = i.id
                                         WHERE DATE(p.payment_date) = CURRENT_DATE`;
    const currencyParams = [...params];

    if (user.role === 'infographe') {
      paymentsByCurrencyQuery += ' WHERE i.infographer_id = $1';
      todayPaymentsByCurrencyQuery += ' AND i.infographer_id = $1';
    }

    paymentsByCurrencyQuery += ' GROUP BY i.currency';
    todayPaymentsByCurrencyQuery += ' GROUP BY i.currency';

    const allPaymentsByCurrencyResult = await pool.query(paymentsByCurrencyQuery, currencyParams);
    const todayPaymentsByCurrencyResult = await pool.query(todayPaymentsByCurrencyQuery, currencyParams);

    const formatCurrencyStats = (results: any[]) => {
      const stats = { CDF: { count: 0, total: 0 }, USD: { count: 0, total: 0 } };
      results.forEach(row => {
        const currency = row.currency === 'USD' || row.currency === '$' ? 'USD' : 'CDF';
        stats[currency].count = parseInt(row.count) || 0;
        stats[currency].total = parseFloat(row.total) || 0;
      });
      return stats;
    };

    const allByCurrency = formatCurrencyStats(allPaymentsByCurrencyResult.rows);
    const todayByCurrency = formatCurrencyStats(todayPaymentsByCurrencyResult.rows);

    return NextResponse.json({
      all: parseInt(allPaymentsResult.rows[0].count) || 0,
      all_total: parseFloat(allPaymentsResult.rows[0].total) || 0,
      today: parseInt(todayPaymentsResult.rows[0].count) || 0,
      today_total: parseFloat(todayPaymentsResult.rows[0].total) || 0,
      pending: parseInt(pendingInvoicesResult.rows[0].count) || 0,
      total_collected: parseFloat(allPaymentsResult.rows[0].total) || 0,
      today_payments: parseInt(todayPaymentsResult.rows[0].count) || 0,
      pending_invoices: parseInt(pendingInvoicesResult.rows[0].count) || 0,
      by_currency: {
        all: allByCurrency,
        today: todayByCurrency
      }
    });
  } catch (error) {
    console.error('Get cashier stats error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
