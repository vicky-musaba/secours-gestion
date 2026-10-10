'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const UsersPage = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'infographe',
    is_active: true,
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
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/users');
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...dataWithoutPassword } = formData;
        await apiCall(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(dataWithoutPassword),
        });
      } else {
        await apiCall('/api/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'infographe', is_active: true });
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleEdit = (userData: any) => {
    setEditingUser(userData);
    setFormData({
      username: userData.username,
      email: userData.email,
      password: '',
      role: userData.role,
      is_active: userData.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de supprimer cet utilisateur ?')) {
      try {
        await apiCall(`/api/users/${id}`, {
          method: 'DELETE',
        });
        fetchUsers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleResetPassword = async (id: number) => {
    if (confirm('Êtes-vous sûr de réinitialiser le mot de passe de cet utilisateur ?')) {
      try {
        await apiCall(`/api/users/${id}/reset-password`, {
          method: 'PATCH',
          body: JSON.stringify({ newPassword: '123456' }),
        });
        alert('Mot de passe réinitialisé avec succès. Nouveau mot de passe: 123456');
      } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      }
    }
  };

  const handleLock = async (id: number, lock: boolean) => {
    try {
      await apiCall(`/api/users/${id}/lock`, {
        method: 'PATCH',
        body: JSON.stringify({ lock }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du verrouillage/déverrouillage:', error);
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

  if (loading) return <div className="min-h-screen bg-gray-100 p-6">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-2 text-gray-600">{getWelcomeMessage()} - Ajout et modification des utilisateurs</p>
        </header>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nouvel utilisateur</h2>
            </div>
            {user?.role === 'manager' && (
              <button 
                onClick={() => { setShowForm(true); setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'infographe', is_active: true }); }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Nouvel utilisateur
              </button>
            )}
          </div>

          {showForm && (
            <div className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur *</label>
                    <input 
                      type="text" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleInputChange} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                      <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        required={!editingUser}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
                    <select 
                      name="role" 
                      value={formData.role} 
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="manager">Manager</option>
                      <option value="superviseur">Superviseur</option>
                      <option value="infographe">Infographe</option>
                      <option value="caissière">Caissière</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      checked={formData.is_active} 
                      onChange={handleInputChange}
                      className="w-auto h-4 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-600">Actif</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                    {editingUser ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'infographe', is_active: true }); }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nom d'utilisateur</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dernière connexion</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(userData => (
                <tr key={userData.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{userData.username}</td>
                  <td className="px-4 py-3">{userData.email}</td>
                  <td className="px-4 py-3">
                    <span 
                      className={`
                        inline-block px-2 py-1 rounded text-xs font-medium 
                        ${userData.role === 'manager' ? 'bg-primary-100 text-primary-600' : userData.role === 'superviseur' ? 'bg-blue-100 text-blue-600' : userData.role === 'infographe' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}
                      `}
                    >
                      {userData.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className={`
                        inline-block px-2 py-1 rounded text-xs font-medium 
                        ${userData.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                      `}
                    >
                      {userData.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{userData.last_login ? new Date(userData.last_login).toLocaleString() : 'Jamais'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {user?.role === 'manager' && (
                        <>
                          <button
                            onClick={() => handleEdit(userData)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleResetPassword(userData.id)}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-sm"
                          >
                            Réinitialiser MDP
                          </button>
                          <button
                            onClick={() => handleLock(userData.id, !userData.is_active)}
                            className={userData.is_active ? "px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm" : "px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"}
                          >
                            {userData.is_active ? 'Verrouiller' : 'Déverrouiller'}
                          </button>
                          <button
                            onClick={() => handleDelete(userData.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
