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

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      'SELECT * FROM services ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  if (!authorizeRoles(user, 'manager', 'superviseur')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, category, price, currency, description, status } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ message: 'Nom, catégorie et prix requis' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO services (name, category, price, currency, description, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category, price, currency || 'CDF', description, status || 'active']
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
