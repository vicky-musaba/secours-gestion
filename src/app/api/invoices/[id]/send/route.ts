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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  try {
    const { id } = await params;
    let query = 'UPDATE invoices SET status = $1 WHERE id = $2';
    const queryParams: any[] = ['sent', id];

    if (user.role === 'infographe') {
      query += ' AND infographer_id = $3';
      queryParams.push(user.id);
    }

    query += ' RETURNING *';

    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée ou accès non autorisé' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
