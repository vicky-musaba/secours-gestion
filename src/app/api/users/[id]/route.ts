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

  if (!authorizeRoles(user, 'manager')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { username, email, role, is_active } = body;

    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, role = $3, is_active = $4 WHERE id = $5 RETURNING id, username, email, role, is_active',
      [username, email, role, is_active, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
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
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
