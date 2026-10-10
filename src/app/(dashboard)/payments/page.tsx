'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const PaymentsPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    all: 0,
    today: 0,
    pending: 0
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

  const fetchStats = async () => {
    try {
      const data = await apiCall('/api/payments/stats');
      setStats({
        all: data.all || 0,
        today: data.today || 0,
        pending: data.pending || 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      let endpoint = '/api/payments';
      if (filter === 'today') {
        endpoint += '/today';
      } else if (filter === 'pending') {
        endpoint += '/pending';
      }
      
      const data = await apiCall(endpoint);
      setPayments(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filter, token]);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleStatusChange = (paymentId: number, newStatus: string) => {
    if (user?.role !== 'superviseur' && user?.role !== 'manager') return;
    
    try {
      apiCall(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }).then(fetchPayments);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (user?.role !== 'manager') return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture et ses paiements associés ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await apiCall(`/api/invoices/${invoiceId}/manager`, {
        method: 'DELETE',
      });
      setPayments(prevPayments => prevPayments.filter(payment => payment.invoice_id !== invoiceId));
      await fetchPayments();
      alert('Facture supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  const renderPaymentItem = (payment: any) => (
    <tr key={payment.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
      <td className="px-4 py-3">{payment.invoice_number}</td>
      <td className="px-4 py-3">{payment.client_name}</td>
      <td className="px-4 py-3">{payment.amount_paid} {payment.currency || 'CDF'}</td>
      <td className="px-4 py-3">{payment.payment_method}</td>
      <td className="px-4 py-3">{new Date(payment.payment_date).toLocaleString()}</td>
      <td className="px-4 py-3">{payment.reference || '-'}</td>
      <td className="px-4 py-3">
        <select 
          value={payment.status}
          onChange={(e) => handleStatusChange(payment.id, e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/payments/${payment.id}/details`)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
          >
            Détails
          </button>
          {user?.role === 'manager' && (
            <button 
              onClick={() => handleDeleteInvoice(payment.invoice_id)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
            >
              Supprimer facture
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  const renderTodayPayments = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Paiements d'aujourd'hui</h3>
      <p className="text-gray-600">{payments.length} paiement(s) reçu(s)</p>
    </div>
  );

  const renderPendingPayments = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Paiements en attente</h3>
      {payments.length === 0 ? (
        <p className="text-gray-500">Aucun paiement en attente</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Facture</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Méthode</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Référence</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{payment.invoice_number}</td>
                  <td className="px-4 py-3">{payment.amount_paid} {payment.currency || 'CDF'}</td>
                  <td className="px-4 py-3">{payment.payment_method}</td>
                  <td className="px-4 py-3">{payment.reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAllPayments = () => (
    <div>
      {payments.length === 0 ? (
        <p className="text-gray-500">Aucun paiement trouvé</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Facture</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Méthode</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Référence</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(renderPaymentItem)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const getWelcomeMessage = () => {
    if (!user) return '';
    const roleMessages: Record<string, string> = {
      'manager': 'Manager',
      'superviseur': 'Superviseur',
      'infographe': 'Infographe',
      'caissière': 'Caissière'
    };
    const roleDisplay = roleMessages[user.role] || user.role;
    return `Bienvenue ${roleDisplay}`;
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-6">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
          <p className="mt-2 text-gray-600">{getWelcomeMessage()} - Gestion des encaissements</p>
        </header>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                filter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tous ({stats.all})
            </button>
            <button 
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                filter === 'today' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Aujourd'hui ({stats.today})
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                filter === 'pending' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              En attente ({stats.pending})
            </button>
          </div>
        </div>

        {renderTodayPayments()}
        {renderPendingPayments()}
        {renderAllPayments()}
      </div>
    </div>
  );
};

export default PaymentsPage;
