'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ReportsPage = () => {
  const { user, token } = useAuth();
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
    setLoading(false);
  }, [token]);

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
          <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
          <p className="mt-2 text-gray-600">{getWelcomeMessage()} - Rapports et statistiques</p>
        </header>

        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600">
            La page des rapports est en cours de développement. Les statistiques sont disponibles sur le Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
