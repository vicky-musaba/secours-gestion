'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';

function PaymentDetailsContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const apiCall = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (!response.ok) {
      throw new Error('API call failed');
    }
    return response.json();
  };

  useEffect(() => {
    if (params.id) {
      fetchPayment();
    }
  }, [params.id, token]);

  const fetchPayment = async () => {
    try {
      const data = await apiCall(`/api/payments/invoice/${params.id}`);
      if (data.length > 0) {
        setPayment(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du paiement:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-6">Chargement...</div>;

  if (!payment) return <div className="min-h-screen bg-gray-100 p-6">Paiement non trouvé</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Détails du paiement</h1>
          <p className="mt-2 text-gray-600">Informations sur le paiement</p>
        </header>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Facture</label>
              <p className="mt-1 text-gray-900">{payment.invoice_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client</label>
              <p className="mt-1 text-gray-900">{payment.customer_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Montant</label>
              <p className="mt-1 text-gray-900">{payment.amount} {payment.currency || 'CDF'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Montant payé</label>
              <p className="mt-1 text-gray-900">{payment.amount_paid} {payment.currency || 'CDF'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Méthode de paiement</label>
              <p className="mt-1 text-gray-900">{payment.payment_method}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="mt-1 text-gray-900">{new Date(payment.payment_date).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Référence</label>
              <p className="mt-1 text-gray-900">{payment.reference || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Statut</label>
              <p className="mt-1 text-gray-900">{payment.status}</p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => router.push('/payments')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 p-6">Chargement...</div>}>
      <PaymentDetailsContent />
    </Suspense>
  );
}
