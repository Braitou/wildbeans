'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [orderId, setOrderId] = useState('67b4794f-f426-4d1c-9a01-68f8e9e2e0f7');

  async function checkOrderStatus() {
    try {
      setMessages(prev => [...prev, `Checking order status for: ${orderId}`]);
      
      // Vérifier le statut actuel
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, pickup_code')
        .eq('id', orderId)
        .single();
      
      if (error) {
        setMessages(prev => [...prev, `Error: ${error.message}`]);
      } else {
        setMessages(prev => [...prev, `Current status: ${data.status}, Pickup: ${data.pickup_code}`]);
      }
    } catch (err) {
      setMessages(prev => [...prev, `Error: ${err}`]);
    }
  }

  async function testUpdateStatus(newStatus: string) {
    try {
      setMessages(prev => [...prev, `Testing update to ${newStatus}...`]);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) {
        setMessages(prev => [...prev, `Update error: ${error.message}`]);
      } else {
        setMessages(prev => [...prev, `Successfully updated to ${newStatus}!`]);
        // Vérifier le statut après mise à jour
        setTimeout(checkOrderStatus, 1000);
      }
    } catch (err) {
      setMessages(prev => [...prev, `Error: ${err}`]);
    }
  }

  async function checkRLSPolicies() {
    try {
      setMessages(prev => [...prev, 'Checking RLS policies...']);
      
      // Essayer de lire les politiques
      const { data, error } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'orders');
      
      if (error) {
        setMessages(prev => [...prev, `RLS check error: ${error.message}`]);
      } else {
        setMessages(prev => [...prev, `Found ${data?.length || 0} policies for orders table`]);
        data?.forEach(policy => {
          setMessages(prev => [...prev, `Policy: ${policy.policy_name} - ${policy.permissive} - ${policy.roles}`]);
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, `RLS check error: ${err}`]);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug - Order Status & RLS</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter order ID"
          className="w-full p-2 border rounded mb-2"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={checkOrderStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Check Status
        </button>
        <button
          onClick={() => testUpdateStatus('preparing')}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Set to Preparing
        </button>
        <button
          onClick={() => testUpdateStatus('ready')}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Set to Ready
        </button>
        <button
          onClick={checkRLSPolicies}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Check RLS
        </button>
      </div>

      <div className="border rounded p-4 h-96 overflow-y-auto bg-gray-50">
        <h3 className="font-bold mb-2">Messages:</h3>
        {messages.map((msg, i) => (
          <div key={i} className="text-sm mb-1 font-mono">{msg}</div>
        ))}
      </div>
    </div>
  );
}
