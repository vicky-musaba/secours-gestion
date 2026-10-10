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
    let query = `
      SELECT
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_invoices,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_invoices,
        COUNT(*) FILTER (WHERE status = 'validated') as validated_invoices,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_invoices,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(final_amount) FILTER (WHERE status = 'paid'), 0) as paid_revenue
      FROM invoices`;
    const params: any[] = [];

    if (user.role === 'infographe') {
      query += ' WHERE infographer_id = $1';
      params.push(user.id);
    }

    const result = await pool.query(query, params);

    let revenueByCurrencyQuery = `
      SELECT currency, COALESCE(SUM(final_amount), 0) as total_revenue,
             COALESCE(SUM(final_amount) FILTER (WHERE status = 'paid'), 0) as paid_revenue
      FROM invoices`;
    const currencyParams = [...params];

    if (user.role === 'infographe') {
      revenueByCurrencyQuery += ' WHERE infographer_id = $1';
    }

    revenueByCurrencyQuery += ' GROUP BY currency';

    const revenueByCurrencyResult = await pool.query(revenueByCurrencyQuery, currencyParams);

    const formatCurrencyStats = (results: any[]) => {
      const stats = { CDF: { total_revenue: 0, paid_revenue: 0 }, USD: { total_revenue: 0, paid_revenue: 0 } };
      results.forEach(row => {
        const currency = row.currency === 'USD' || row.currency === '$' ? 'USD' : 'CDF';
        stats[currency].total_revenue = parseFloat(row.total_revenue) || 0;
        stats[currency].paid_revenue = parseFloat(row.paid_revenue) || 0;
      });
      return stats;
    };

    const revenueByCurrency = formatCurrencyStats(revenueByCurrencyResult.rows);

    return NextResponse.json({
      ...result.rows[0],
      by_currency: revenueByCurrency
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
