'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`debug-order-${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('Realtime payload:', payload);
        setMessages(prev => [...prev, `Status changed: ${payload.new?.status} at ${new Date().toLocaleTimeString()}`]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function testUpdate() {
    if (!orderId) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'preparing' })
      .eq('id', orderId);
    
    if (error) {
      setMessages(prev => [...prev, `Error: ${error.message}`]);
    } else {
      setMessages(prev => [...prev, `Update successful at ${new Date().toLocaleTimeString()}`]);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Realtime Debug</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter order ID"
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={testUpdate}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
      >
        Test Update to 'preparing'
      </button>

      <div className="border rounded p-4 h-64 overflow-y-auto">
        <h3 className="font-bold mb-2">Messages:</h3>
        {messages.map((msg, i) => (
          <div key={i} className="text-sm mb-1">{msg}</div>
        ))}
      </div>
    </div>
  );
}
