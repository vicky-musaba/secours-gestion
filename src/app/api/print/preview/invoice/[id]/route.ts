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
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('token');

  const authHeader = request.headers.get('authorization');
  const authToken = token || (authHeader && authHeader.split(' ')[1]);

  if (!authToken) {
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  let user;
  try {
    user = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key') as { id: number; username: string; role: string };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ message: 'Token expiré' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Token requis' }, { status: 401 });
  }

  try {
    let query = `SELECT i.*, u.username as infographer_name
                 FROM invoices i
                 LEFT JOIN users u ON i.infographer_id = u.id
                 WHERE i.id = $1`;
    const queryParams: any[] = [id];

    if (user.role === 'infographe') {
      query += ' AND i.infographer_id = $2';
      queryParams.push(user.id);
    }

    const invoiceResult = await pool.query(query, queryParams);

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json({ message: 'Facture non trouvée ou accès non autorisé' }, { status: 404 });
    }

    const invoice = invoiceResult.rows[0];

    let items: any[] = [];
    try {
      if (invoice.items) {
        items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
        if (!Array.isArray(items)) {
          items = [];
        }
      }
    } catch (error) {
      console.error('Error parsing items:', error);
      items = [];
    }

    if (items.length > 0) {
      const serviceIds = items.map((item: any) => item.service_id).filter((id: any) => id);
      if (serviceIds.length > 0) {
        const servicesResult = await pool.query(
          'SELECT id, name FROM services WHERE id = ANY($1)',
          [serviceIds]
        );
        const servicesMap: Record<number, string> = {};
        servicesResult.rows.forEach(service => {
          servicesMap[service.id] = service.name;
        });
        
        items = items.map((item: any) => ({
          ...item,
          service_name: servicesMap[item.service_id] || 'Service inconnu'
        }));
      }
    }

    const formatAmount = (amount: any, currency = 'CDF') => {
      const num = parseFloat(amount || 0);
      const currencySymbol = currency === 'USD' ? '$' : currency;
      return num % 1 === 0 ? `${num} ${currencySymbol}` : `${num.toFixed(2)} ${currencySymbol}`;
    };

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #000; padding: 3px; background: white; width: 80mm; }
    .container { width: 100%; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px dashed #000; }
    .company-info h1 { font-size: 14px; font-weight: bold; margin-bottom: 2px; color: #000; }
    .company-info p { font-size: 9px; margin-bottom: 0.5px; }
    .invoice-info { text-align: center; margin-top: 5px; }
    .invoice-info h2 { font-size: 14px; color: #000; margin-bottom: 5px; font-weight: bold; }
    .invoice-info .label { font-weight: bold; font-size: 14px; }
    .invoice-info .value { font-family: "Courier New", monospace; font-size: 14px; margin-bottom: 2px; }
    .client-info { margin-bottom: 8px; padding: 4px; background: #fff; border: 1px solid #000; }
    .client-info h3 { font-size: 14px; margin-bottom: 3px; color: #000; font-weight: bold; }
    .client-info p { font-size: 14px; margin-bottom: 2px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 14px; }
    .items-table th { background: #fff; color: #000; padding: 3px; text-align: left; font-weight: bold; font-size: 14px; border-bottom: 2px solid #000; }
    .items-table td { padding: 3px; border-bottom: 1px solid #000; font-size: 14px; color: #000; }
    .items-table td.text-center { font-family: "Courier New", monospace; color: #000; font-size: 14px; font-weight: bold; }
    .items-table tr:last-child td { border-bottom: none; }
    .items-table .text-right { text-align: right; }
    .items-table .text-center { text-align: center; }
    .totals { width: 100%; margin-top: 5px; text-align: center; }
    .total-row { display: flex; justify-content: center; gap: 15px; padding: 3px 0; border-bottom: 1px solid #000; font-size: 14px; }
    .total-row span:last-child { font-family: "Courier New", monospace; }
    .total-row:last-child { border-bottom: none; border-top: 1px solid #000; font-weight: bold; font-size: 14px; padding-top: 4px; }
    .footer { margin-top: 8px; padding-top: 5px; border-top: 1px dashed #000; text-align: center; color: #000; font-size: 14px; }
    .print-button { display: inline-block; padding: 8px 16px; background: #000; color: white; border: none; font-size: 14px; cursor: pointer; margin: 8px auto; width: 100%; }
    .print-button:hover { background: #333; }
    .status { display: inline-block; padding: 2px 5px; border: 1px solid #000; font-weight: bold; font-size: 14px; text-transform: uppercase; }
    .status-draft { background: #fff; color: #000; border-color: #000; }
    .status-sent { background: #fff; color: #000; border-color: #000; }
    .status-paid { background: #fff; color: #000; border-color: #000; }
    .status-validated { background: #fff; color: #000; border-color: #000; }
    .status-rejected { background: #fff; color: #000; border-color: #000; }
    @media print {
      body { padding: 2mm; width: 76mm; }
      @page {
        size: 80mm auto;
        margin: 2mm;
      }
      .print-button { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>LE SECOURS SARLU</h1>
        <p>Services de Graphisme & Impression</p>
        <p>RDC</p>
        <p>RCCM: CD/KNG/RCCM/25-B-00252</p>
        <p>ID. nat/ 01-g4701-N60524X</p>
        <p>Contacts: +243999677252, 833181008</p>
        <p>E-MAIL: lesecourssarlu@gmail.com</p>
        <p>WEB: lesecourssarlu.com</p>
      </div>
      <div class="invoice-info">
        <h2>FACTURE</h2>
        <div class="value"><span class="label">N°:</span> ${invoice.invoice_number}</div>
        <div class="value"><span class="label">Date:</span> ${new Date(invoice.created_at).toLocaleDateString('fr-FR')}</div>
        <div class="value"><span class="label">Statut:</span> <span class="status status-${invoice.status}">${invoice.status}</span></div>
      </div>
    </div>

    <div class="client-info">
      <h3>Client</h3>
      <p><strong>Nom:</strong> ${invoice.client_name}</p>
      ${invoice.phone ? `<p><strong>Téléphone:</strong> ${invoice.phone}</p>` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Article</th>
          <th class="text-center">Quantité</th>
          <th class="text-center">Prix unitaire</th>
          <th class="text-center">Sous-total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any) => `
          <tr>
            <td>${item.service_name || 'Service inconnu'}</td>
            <td class="text-center">${item.quantity || 1}</td>
            <td class="text-center">${formatAmount(item.unit_price, item.currency)}</td>
            <td class="text-center">${formatAmount((item.quantity || 1) * (item.unit_price || 0), item.currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>Sous-total:</span> <span>${formatAmount(invoice.total_amount, items[0]?.currency)}</span></div>
      <div class="total-row"><span>Total:</span> <span>${formatAmount(invoice.final_amount, items[0]?.currency)}</span></div>
    </div>

    <div class="footer">
      <p>Merci pour votre confiance!</p>
      <p>LE SECOURS SARLU - Services de Graphisme & Impression</p>
      <p>Infographe: ${invoice.infographer_name || 'N/A'}</p>
    </div>
    
    <div style="text-align: center;">
      <button class="print-button" onclick="window.print()">Imprimer cette facture</button>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Print error:', error);
    return NextResponse.json({ message: 'Erreur: ' + (error as Error).message }, { status: 500 });
  }
}
