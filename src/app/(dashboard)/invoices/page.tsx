'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useRouter } from 'next/navigation';

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  phone: string;
  infographer_id: number;
  status: 'draft' | 'sent' | 'paid' | 'validated' | 'rejected';
  total_amount: number;
  final_amount: number;
  created_at: string;
  infographer_name?: string;
  items?: InvoiceItem[];
  currency?: any;
}

interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  service_id: number;
  quantity: number;
  unit_price: number;
  total_price?: number;
  service_name?: string;
  currency?: any;
}

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  currency: string;
  description: string;
  status: string;
}

const InvoicesPage = () => {
  const { user, token } = useAuth();
  const { subscribeToInvoices } = useRealtime();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    client_name: '',
    phone: '',
    items: [] as { service_id: number; quantity: number; unit_price: number; currency: string }[],
  });
  const channelRef = useRef<any>(null);

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
    fetchInvoices();
    fetchServices();

    const channel = subscribeToInvoices((payload) => {
      console.log('Changement de facture détecté:', payload);
      
      switch (payload.eventType) {
        case 'INSERT':
          setInvoices(prev => [payload.new as Invoice, ...prev]);
          break;
        case 'UPDATE':
          setInvoices(prev => prev.map(invoice => 
            invoice.id === payload.new.id ? payload.new as Invoice : invoice
          ));
          break;
        case 'DELETE':
          setInvoices(prev => prev.filter(invoice => invoice.id !== payload.old.id));
          break;
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [subscribeToInvoices, token]);

  const fetchInvoices = async () => {
    try {
      const data = await apiCall('/api/invoices');
      setInvoices(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await apiCall('/api/services');
      setServices(data.filter((s: Service) => s.status === 'active'));
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { service_id: 0, quantity: 1, unit_price: 0, currency: 'CDF' }] }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === 'service_id' && typeof value === 'number') {
        const selectedService = services.find(s => s.id === value);
        if (selectedService) {
          newItems[index].unit_price = selectedService.price;
          newItems[index].currency = selectedService.currency || 'CDF';
        }
      }

      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.items || formData.items.length === 0) {
      alert('Veuillez ajouter au moins un article');
      return;
    }
    
    for (const item of formData.items) {
      if (!item.service_id || item.service_id === 0) {
        alert('Veuillez sélectionner un service pour chaque article');
        return;
      }
      if (!item.quantity || item.quantity < 1) {
        alert('La quantité doit être au moins 1');
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        alert('Le prix unitaire doit être supérieur à 0');
        return;
      }
    }
    
    try {
      if (editingInvoice) {
        await apiCall(`/api/invoices/${editingInvoice.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiCall('/api/invoices', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditingInvoice(null);
      setFormData({ client_name: '', phone: '', items: [] });
      fetchInvoices();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la création de la facture. Veuillez vérifier les données.');
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client_name: invoice.client_name,
      phone: invoice.phone,
      items: invoice.items?.map(item => ({
        service_id: item.service_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency: item.currency || 'CDF',
      })) || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de supprimer cette facture ?')) {
      try {
        await apiCall(`/api/invoices/${id}`, {
          method: 'DELETE',
        });
        fetchInvoices();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleManagerDelete = async (id: number) => {
    if (user?.role !== 'manager') return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture et ses paiements associés ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await apiCall(`/api/invoices/${id}/manager`, {
        method: 'DELETE',
      });
      setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== id));
      await fetchInvoices();
      alert('Facture supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  const handleSend = async (id: number) => {
    try {
      await apiCall(`/api/invoices/${id}/send`, {
        method: 'PATCH',
      });
      fetchInvoices();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
    }
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      const printWindow = window.open(`/api/print/preview/invoice/${invoice.id}?token=${token}`, '_blank');
      
      if (!printWindow) {
        alert('Veuillez autoriser les popups pour imprimer');
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      alert('Erreur lors de l\'impression');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#f59e0b';
      case 'sent': return '#2563eb';
      case 'paid': return '#16a34a';
      case 'validated': return '#059669';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
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

  const getItemsSummary = (items: InvoiceItem[] | undefined) => {
    if (!items || items.length === 0) return '-';
    
    const itemNames = items.map(item => {
      if (services.length > 0) {
        const service = services.find(s => s.id === item.service_id);
        return service?.name || `Service #${item.service_id}`;
      } else {
        return item.service_name || `Service #${item.service_id}`;
      }
    });
    
    if (itemNames.length === 1) {
      return itemNames[0];
    } else if (itemNames.length === 2) {
      return `${itemNames[0]}, ${itemNames[1]}`;
    } else {
      return `${itemNames[0]}, ${itemNames[1]} +${itemNames.length - 2}`;
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-6">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
          <p className="mt-2 text-gray-600">{getWelcomeMessage()} - Gestion des factures</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {user?.role === 'infographe' && (
            <button 
              onClick={() => { setShowForm(true); setEditingInvoice(null); setFormData({ client_name: '', phone: '', items: [] }); }}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Nouvelle facture
            </button>
          )}

          {showForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingInvoice ? 'Modifier la facture' : 'Nouvelle facture'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                    <input 
                      type="text" 
                      name="client_name" 
                      value={formData.client_name} 
                      onChange={handleInputChange} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Articles</label>
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <select
                        name={`items[${index}].service_id`}
                        value={item.service_id}
                        onChange={e => updateItem(index, 'service_id', parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={0}>Sélectionner un service</option>
                        {services.map((service: Service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {service.price} {service.currency || 'CDF'}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        name={`items[${index}].quantity`}
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                        min="1"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Qté"
                      />
                      <input
                        type="number"
                        step="0.01"
                        name={`items[${index}].unit_price`}
                        value={item.unit_price}
                        onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Prix (CDF)"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                  >
                    + Ajouter un article
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    {editingInvoice ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowForm(false); setEditingInvoice(null); setFormData({ client_name: '', phone: '', items: [] }); }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="mt-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
            {user?.role === 'infographe' && (
              <button 
                onClick={() => { setShowForm(true); setEditingInvoice(null); setFormData({ client_name: '', phone: '', items: [] }); }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Nouvelle facture
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Numéro</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Téléphone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Infographe</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Articles</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{invoice.invoice_number}</td>
                    <td className="px-4 py-3">{invoice.client_name}</td>
                    <td className="px-4 py-3">{invoice.phone || '-'}</td>
                    <td className="px-4 py-3">{invoice.infographer_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{getItemsSummary(invoice.items as InvoiceItem[])}</td>
                    <td className="px-4 py-3">
                      {/* @ts-ignore */}
                      <span>{parseFloat(invoice.final_amount || 0).toFixed(2)}</span> <span>{invoice.items?.[0]?.currency || 'CDF'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className={`
                          inline-block px-3 py-1 rounded text-xs font-medium 
                          text-white
                        `}
                        style={{ backgroundColor: getStatusColor(invoice.status) }}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(invoice.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {user?.role !== 'caissière' && user?.role !== 'superviseur' && (
                          <button
                            onClick={() => handlePrint(invoice)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                          >
                            Imprimer
                          </button>
                        )}
                        {user?.role === 'infographe' && invoice.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleSend(invoice.id)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                            >
                              Envoyer
                            </button>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                        {user?.role === 'caissière' && invoice.status === 'sent' && (
                          <>
                            <button
                              onClick={() => router.push(`/payments/new?invoice=${invoice.id}`)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                            >
                              Encaisser
                            </button>
                            <button
                              onClick={() => apiCall(`/api/invoices/${invoice.id}/reject`, { method: 'PATCH' }).then(fetchInvoices)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        {user?.role === 'superviseur' && invoice.status === 'paid' && (
                          <>
                            <button
                              onClick={() => apiCall(`/api/invoices/${invoice.id}/validate`, { method: 'PATCH' }).then(fetchInvoices)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => apiCall(`/api/invoices/${invoice.id}/reject`, { method: 'PATCH' }).then(fetchInvoices)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleManagerDelete(invoice.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                          >
                            Supprimer
                          </button>
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
    </div>
  );
};

export default InvoicesPage;
