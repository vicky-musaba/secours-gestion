'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems: { label: string; path: string; roles: string[] }[] = [
    { label: 'Tableau de bord', path: '/dashboard', roles: ['manager', 'superviseur', 'infographe', 'caissière'] },
    { label: 'Services', path: '/services', roles: ['manager', 'superviseur', 'infographe'] },
    { label: 'Factures', path: '/invoices', roles: ['manager', 'superviseur', 'infographe', 'caissière'] },
    { label: 'Paiements', path: '/payments', roles: ['manager', 'superviseur', 'caissière'] },
    { label: 'Rapports', path: '/reports', roles: ['manager', 'superviseur'] },
    { label: 'Utilisateurs', path: '/users', roles: ['manager'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: '250px', background: '#f4f4f4', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px', marginRight: '10px' }} />
          <h2 style={{ margin: 0 }}>Facturation</h2>
        </div>
        <div style={{ marginBottom: '20px', padding: '10px', background: '#e8f4f8', borderRadius: '4px', borderLeft: '4px solid #009688' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#00695c', fontWeight: 'bold' }}>
            {getWelcomeMessage()}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#555' }}>
            Connecté en tant que : {user?.username}
          </p>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
          {filteredNavItems.map(item => (
            <li key={item.path} style={{ margin: '10px 0' }}>
              <Link
                href={item.path}
                style={{
                  display: 'block',
                  padding: '10px',
                  background: pathname === item.path ? '#ddd' : 'transparent',
                  borderRadius: '4px',
                  color: pathname === item.path ? '#000' : '#333',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          style={{
            marginTop: 'auto',
            padding: '10px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </nav>
      <main style={{ flex: 1, padding: '20px' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
