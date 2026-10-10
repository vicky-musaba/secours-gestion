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
    let query = `SELECT i.id as invoice_id, i.invoice_number, i.client_name as customer_name, i.total_amount, i.status, i.infographer_id, i.currency
                 FROM invoices i
                 WHERE i.status = 'sent'`;
    const params: any[] = [];

    if (user.role === 'infographe') {
      query += ' AND i.infographer_id = $1';
      params.push(user.id);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await pool.query(query, params);
    
    const invoicesWithCurrency = result.rows.map(invoice => ({
      ...invoice,
      currency: invoice.currency || 'CDF'
    }));
    
    return NextResponse.json(invoicesWithCurrency);
  } catch (error) {
    console.error('Get pending payments error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
