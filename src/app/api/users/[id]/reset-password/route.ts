import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

export async function PATCH(
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
    const { newPassword } = body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
