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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  if (!authorizeRoles(user, 'manager', 'superviseur', 'caissière')) {
    return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount_paid, payment_method, reference, currency } = body;

    if (!amount_paid || !payment_method) {
      return NextResponse.json({ message: 'Montant et méthode de paiement requis' }, { status: 400 });
    }

    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée' }, { status: 404 });
    }

    const invoice = invoiceResult.rows[0];
    const paymentCurrency = currency || invoice.currency || 'CDF';

    const paymentResult = await pool.query(
      'INSERT INTO payments (invoice_id, amount, amount_paid, payment_method, cashier_id, reference, status, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, invoice.final_amount, amount_paid, payment_method, user.id, reference || null, 'completed', paymentCurrency]
    );

    const updatedInvoice = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *',
      ['paid', id]
    );

    return NextResponse.json({
      payment: paymentResult.rows[0],
      invoice: updatedInvoice.rows[0]
    });
  } catch (error) {
    console.error('Pay invoice error:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
