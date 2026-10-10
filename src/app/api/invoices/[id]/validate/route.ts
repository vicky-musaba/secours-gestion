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
    const result = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *',
      ['validated', id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Validate invoice error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
