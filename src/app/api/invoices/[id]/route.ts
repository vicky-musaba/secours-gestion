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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  try {
    const { id } = await params;
    let query = `SELECT i.*, u.username as infographer_name
                 FROM invoices i
                 LEFT JOIN users u ON i.infographer_id = u.id
                 WHERE i.id = $1`;
    const queryParams: any[] = [id];

    if (user.role === 'infographe') {
      query += ' AND i.infographer_id = $2';
      queryParams.push(user.id);
    }

    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée ou accès non autorisé' }, { status: 404 });
    }
    
    const invoice = result.rows[0];
    const invoiceWithCurrency = {
      ...invoice,
      currency: invoice.currency || 'CDF'
    };
    
    return NextResponse.json(invoiceWithCurrency);
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { client_name, customer_name, phone, customer_phone, items, total_amount, final_amount, infographer_id, currency } = body;

    const finalClientName = client_name || customer_name;
    const finalPhone = phone || customer_phone;

    let query = 'UPDATE invoices SET client_name = $1, phone = $2, items = $3, total_amount = $4, final_amount = $5, infographer_id = $6, currency = $7 WHERE id = $8';
    const queryParams: any[] = [finalClientName, finalPhone, JSON.stringify(items), total_amount, final_amount || total_amount, infographer_id, currency || 'CDF', id];

    if (user.role === 'infographe') {
      query += ' AND infographer_id = $9';
      queryParams.push(user.id);
    }

    query += ' RETURNING *';

    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée ou accès non autorisé' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  try {
    const { id } = await params;
    let query = 'DELETE FROM invoices WHERE id = $1 AND status = $2';
    const queryParams: any[] = [id, 'draft'];

    if (user.role === 'infographe') {
      query += ' AND infographer_id = $3';
      queryParams.push(user.id);
    }

    query += ' RETURNING *';

    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée, ne peut pas être supprimée ou accès non autorisé' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
