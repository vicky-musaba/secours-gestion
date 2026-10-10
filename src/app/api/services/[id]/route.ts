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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  if (!authorizeRoles(user, 'manager', 'superviseur')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, price, currency, description, status } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ message: 'Nom, catégorie et prix requis' }, { status: 400 });
    }

    const result = await pool.query(
      'UPDATE services SET name = $1, category = $2, price = $3, currency = $4, description = $5, status = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [name, category, price, currency || 'CDF', description, status || 'active', id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Service non trouvé' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update service error:', error);
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

  if (!authorizeRoles(user, 'manager')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const result = await pool.query(
      'DELETE FROM services WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Service non trouvé' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
