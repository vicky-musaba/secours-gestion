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
    let query = `SELECT i.*, u.username as infographer_name 
                 FROM invoices i 
                 LEFT JOIN users u ON i.infographer_id = u.id`;
    const params: any[] = [];

    if (user.role === 'infographe') {
      query += ' WHERE i.infographer_id = $1';
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
    console.error('Get invoices error:', error);
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
    const { client_name, customer_name, phone, customer_phone, items, total_amount, final_amount, infographer_id, currency } = body;

    const finalClientName = client_name || customer_name;
    const finalPhone = phone || customer_phone;

    if (!finalClientName || !items) {
      return NextResponse.json({ message: 'Données incomplètes' }, { status: 400 });
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const finalInfographerId = infographer_id || user.id;
    
    let calculatedTotal = total_amount;
    if (!calculatedTotal && Array.isArray(items)) {
      calculatedTotal = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity || 0) * (item.unit_price || 0);
      }, 0);
    }
    
    const finalCurrency = currency || 'CDF';
    
    const result = await pool.query(
      'INSERT INTO invoices (invoice_number, client_name, phone, items, total_amount, final_amount, infographer_id, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [invoiceNumber, finalClientName, finalPhone, JSON.stringify(items), calculatedTotal, final_amount || calculatedTotal, finalInfographerId, finalCurrency]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
