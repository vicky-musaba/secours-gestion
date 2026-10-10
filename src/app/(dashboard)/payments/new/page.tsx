'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

function NewPaymentContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    invoice_id: invoiceId || '',
    amount: '',
    amount_paid: '',
    payment_method: 'cash',
    reference: '',
  });

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
    if (invoiceId) {
      setFormData(prev => ({ ...prev, invoice_id: invoiceId }));
    }
  }, [invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/api/payments', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      alert('Paiement enregistré avec succès');
      router.push('/payments');
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      alert('Erreur lors de la création du paiement');
    }
  };

  if (user?.role !== 'caissière') {
    return <div className="min-h-screen bg-gray-100 p-6">Accès non autorisé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nouveau paiement</h1>
          <p className="mt-2 text-gray-600">Enregistrer un paiement</p>
        </header>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Facture</label>
              <input
                type="text"
                name="invoice_id"
                value={formData.invoice_id}
                onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant payé</label>
              <input
                type="number"
                step="0.01"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="cash">Espèces</option>
                <option value="card">Carte</option>
                <option value="mobile">Mobile money</option>
                <option value="transfer">Virement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => router.push('/payments')}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 p-6">Chargement...</div>}>
      <NewPaymentContent />
    </Suspense>
  );
}
