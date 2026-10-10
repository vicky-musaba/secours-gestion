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

function authorizeRoles(user: any, ...roles: string[]) {
  return roles.includes(user.role);
}

export async function GET(request: NextRequest) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  if (!authorizeRoles(user, 'superviseur', 'manager')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_invoices,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_invoices,
        COUNT(*) FILTER (WHERE status = 'validated') as validated_invoices,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_invoices,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', CURRENT_DATE)) as today_invoices,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', CURRENT_DATE) AND status = 'validated') as today_validated_invoices,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', CURRENT_DATE) AND status = 'rejected') as today_rejected_invoices,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(final_amount) FILTER (WHERE status = 'paid'), 0) as paid_revenue,
        COALESCE(SUM(final_amount) FILTER (WHERE created_at >= DATE_TRUNC('day', CURRENT_DATE)), 0) as today_revenue
      FROM invoices
    `);

    const revenueByCurrencyResult = await pool.query(`
      SELECT currency, 
             COALESCE(SUM(final_amount), 0) as total_revenue,
             COALESCE(SUM(final_amount) FILTER (WHERE status = 'paid'), 0) as paid_revenue,
             COALESCE(SUM(final_amount) FILTER (WHERE created_at >= DATE_TRUNC('day', CURRENT_DATE)), 0) as today_revenue
      FROM invoices
      GROUP BY currency
    `);

    const formatCurrencyStats = (results: any[]) => {
      const stats = { CDF: { total_revenue: 0, paid_revenue: 0, today_revenue: 0 }, USD: { total_revenue: 0, paid_revenue: 0, today_revenue: 0 } };
      results.forEach(row => {
        const currency = row.currency === 'USD' || row.currency === '$' ? 'USD' : 'CDF';
        stats[currency].total_revenue = parseFloat(row.total_revenue) || 0;
        stats[currency].paid_revenue = parseFloat(row.paid_revenue) || 0;
        stats[currency].today_revenue = parseFloat(row.today_revenue) || 0;
      });
      return stats;
    };

    const revenueByCurrency = formatCurrencyStats(revenueByCurrencyResult.rows);

    return NextResponse.json({
      ...result.rows[0],
      by_currency: revenueByCurrency
    });
  } catch (error) {
    console.error('Get supervisor stats error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
