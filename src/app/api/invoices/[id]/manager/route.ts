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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  if (!authorizeRoles(user, 'manager')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;

    await pool.query('DELETE FROM payments WHERE invoice_id = $1', [id]);
    
    const result = await pool.query(
      'DELETE FROM invoices WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    console.error('Delete invoice manager error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
