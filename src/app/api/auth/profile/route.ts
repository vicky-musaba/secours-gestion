import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { message: 'Token requis' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: number; username: string; role: string };

    const result = await pool.query(
      'SELECT id, username, email, role, is_active, created_at, last_login FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { message: 'Token invalide' },
        { status: 401 }
      );
    }
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { message: 'Token expiré' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
