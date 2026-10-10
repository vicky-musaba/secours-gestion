'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DashboardPage = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    total_invoices: 0,
    today_invoices: 0,
    recent_operations: 0
  });
  const [caissiereStats, setCaissiereStats] = useState({
    today_payments: 0,
    total_collected: 0,
    pending_invoices: 0
  });
  const [supervisorStats, setSupervisorStats] = useState({
    today_invoices: 0,
    today_validated_invoices: 0,
    today_rejected_invoices: 0,
    validated_invoices: 0,
    rejected_invoices: 0,
    recent_operations: 0
  });
  const [managerStats, setManagerStats] = useState({
    total_revenue: 0,
    total_invoices: 0,
    total_users: 0,
    growth_rate: 0
  });

  const apiCall = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('API call failed');
    }
    return response.json();
  };

  useEffect(() => {
    if (user?.role === 'infographe') {
      fetchStats();
    } else if (user?.role === 'caissière') {
      fetchCaissiereStats();
    } else if (user?.role === 'superviseur') {
      fetchSupervisorStats();
    } else if (user?.role === 'manager') {
      fetchManagerStats();
    }
  }, [user, token]);

  const fetchStats = async () => {
    try {
      const data = await apiCall('/api/invoices/stats');
      setStats(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const fetchCaissiereStats = async () => {
    try {
      const data = await apiCall('/api/payments/stats');
      setCaissiereStats(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques caissière:', error);
    }
  };

  const fetchSupervisorStats = async () => {
    try {
      const data = await apiCall('/api/invoices/supervisor-stats');
      setSupervisorStats(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques superviseur:', error);
    }
  };

  const fetchManagerStats = async () => {
    try {
      const data = await apiCall('/api/invoices/manager-stats');
      setManagerStats(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques manager:', error);
    }
  };

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

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="mt-2 text-gray-600">
            {getWelcomeMessage()} - {user.username}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {user.role === 'caissière' && (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Paiements du jour
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-primary-600">
                      {caissiereStats.today_payments}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-full">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a4 4 0 110-8 4 4 0 010 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Total encaissé
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-success-600">
                      {Number(caissiereStats.total_collected || 0).toFixed(2)} CDF
                    </p>
                  </div>
                  <div className="p-3 bg-success-100 rounded-full">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3 3 0 014.438 0 3.42 3.42 0 001.946.806 3 3 0 014.438 0 3.42 3.42 0 01-1.946.806 3 3 0 00-4.438 0 3.42 3.42 0 00-1.946.806z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Factures en attente
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-warning-600">
                      {caissiereStats.pending_invoices}
                    </p>
                  </div>
                  <div className="p-3 bg-warning-100 rounded-full">
                    <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.661 13l-.732 2.732z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          {user.role === 'superviseur' && (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Factures du jour
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-primary-600">
                      {supervisorStats.today_invoices}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-full">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a4 4 0 110-8 4 4 0 010 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Factures validées aujourd'hui
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-success-600">
                      {supervisorStats.today_validated_invoices}
                    </p>
                  </div>
                  <div className="p-3 bg-success-100 rounded-full">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3 3 0 014.438 0 3.42 3.42 0 001.946.806 3 3 0 014.438 0 3.42 3.42 0 01-1.946.806 3 3 0 00-4.438 0 3.42 3.42 0 00-1.946.806z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Factures rejetées aujourd'hui
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-danger-600">
                      {supervisorStats.today_rejected_invoices}
                    </p>
                  </div>
                  <div className="p-3 bg-danger-100 rounded-full">
                    <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Dernières opérations
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-gray-600">
                      {supervisorStats.validated_invoices + supervisorStats.rejected_invoices}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          {user.role === 'infographe' && (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Factures créées
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-primary-600">
                      {stats.total_invoices}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-full">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a4 4 0 110-8 4 4 0 010 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Factures du jour
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-secondary-600">
                      {stats.today_invoices}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary-100 rounded-full">
                    <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a4 4 0 110-8 4 4 0 010 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Dernières opérations
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-gray-600">
                      {stats.recent_operations}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          {user.role === 'manager' && (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Chiffre d'affaires
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-success-600">
                      {Number(managerStats.total_revenue || 0).toFixed(2)} CDF
                    </p>
                  </div>
                  <div className="p-3 bg-success-100 rounded-full">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3 3 0 014.438 0 3.42 3.42 0 001.946.806 3 3 0 014.438 0 3.42 3.42 0 01-1.946.806 3 3 0 00-4.438 0 3.42 3.42 0 00-1.946.806z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Nombre de factures
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-primary-600">
                      {managerStats.total_invoices || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-full">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a4 4 0 110-8 4 4 0 010 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Nombre d'utilisateurs
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-secondary-600">
                      {managerStats.total_users || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary-100 rounded-full">
                    <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a4 4 0 110-8 4 4 0 010 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Taux de croissance
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-warning-600">
                      {Number(managerStats.growth_rate || 0) > 0 ? '+' : ''}{Number(managerStats.growth_rate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-warning-100 rounded-full">
                    {Number(managerStats.growth_rate || 0) >= 0 ? (
                      <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
