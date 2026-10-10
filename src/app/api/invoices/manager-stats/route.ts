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

  if (!authorizeRoles(user, 'manager')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const invoiceResult = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as current_month_invoices,
        COALESCE(SUM(final_amount) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_revenue,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as previous_month_invoices,
        COALESCE(SUM(final_amount) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)), 0) as previous_month_revenue
      FROM invoices
    `);

    const userResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users
      FROM users
    `);

    const revenueByCurrencyResult = await pool.query(`
      SELECT currency,
             COALESCE(SUM(final_amount), 0) as total_revenue,
             COALESCE(SUM(final_amount) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_revenue,
             COALESCE(SUM(final_amount) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)), 0) as previous_month_revenue
      FROM invoices
      GROUP BY currency
    `);

    const invoiceStats = invoiceResult.rows[0];
    const userStats = userResult.rows[0];

    let growthRate = 0;
    if (invoiceStats.previous_month_revenue > 0) {
      growthRate = ((invoiceStats.current_month_revenue - invoiceStats.previous_month_revenue) / invoiceStats.previous_month_revenue) * 100;
    } else if (invoiceStats.current_month_revenue > 0) {
      growthRate = 100;
    }

    const formatCurrencyStats = (results: any[]) => {
      const stats = { CDF: { total_revenue: 0, current_month_revenue: 0, previous_month_revenue: 0 }, USD: { total_revenue: 0, current_month_revenue: 0, previous_month_revenue: 0 } };
      results.forEach(row => {
        const currency = row.currency === 'USD' || row.currency === '$' ? 'USD' : 'CDF';
        stats[currency].total_revenue = parseFloat(row.total_revenue) || 0;
        stats[currency].current_month_revenue = parseFloat(row.current_month_revenue) || 0;
        stats[currency].previous_month_revenue = parseFloat(row.previous_month_revenue) || 0;
      });
      return stats;
    };

    const revenueByCurrency = formatCurrencyStats(revenueByCurrencyResult.rows);

    return NextResponse.json({
      total_revenue: invoiceStats.total_revenue,
      total_invoices: invoiceStats.total_invoices,
      total_users: userStats.total_users,
      active_users: userStats.active_users,
      current_month_revenue: invoiceStats.current_month_revenue,
      current_month_invoices: invoiceStats.current_month_invoices,
      previous_month_revenue: invoiceStats.previous_month_revenue,
      previous_month_invoices: invoiceStats.previous_month_invoices,
      growth_rate: growthRate,
      by_currency: revenueByCurrency
    });
  } catch (error) {
    console.error('Get manager stats error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
