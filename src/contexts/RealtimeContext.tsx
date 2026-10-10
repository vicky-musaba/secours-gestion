'use client';

import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface RealtimeContextType {
  subscribeToTable: (tableName: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void) => RealtimeChannel;
  unsubscribeFromTable: (channel: RealtimeChannel) => void;
  subscribeToInvoices: (callback: (payload: RealtimePostgresChangesPayload<any>) => void) => RealtimeChannel;
  subscribeToServices: (callback: (payload: RealtimePostgresChangesPayload<any>) => void) => RealtimeChannel;
  subscribeToUsers: (callback: (payload: RealtimePostgresChangesPayload<any>) => void) => RealtimeChannel;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const subscribeToTable = useCallback((tableName: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void) => {
    const channel = supabase
      .channel(`custom-${tableName}-channel`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Abonnement réussi à la table ${tableName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Erreur d'abonnement à la table ${tableName}`);
        }
      });

    return channel;
  }, []);

  const unsubscribeFromTable = useCallback((channel: RealtimeChannel) => {
    supabase.removeChannel(channel);
  }, []);

  const subscribeToInvoices = useCallback((callback: (payload: RealtimePostgresChangesPayload<any>) => void) => {
    return subscribeToTable('invoices', callback);
  }, [subscribeToTable]);

  const subscribeToServices = useCallback((callback: (payload: RealtimePostgresChangesPayload<any>) => void) => {
    return subscribeToTable('services', callback);
  }, [subscribeToTable]);

  const subscribeToUsers = useCallback((callback: (payload: RealtimePostgresChangesPayload<any>) => void) => {
    return subscribeToTable('users', callback);
  }, [subscribeToTable]);

  useEffect(() => {
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{
      subscribeToTable,
      unsubscribeFromTable,
      subscribeToInvoices,
      subscribeToServices,
      subscribeToUsers
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export default RealtimeContext;
