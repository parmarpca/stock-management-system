
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Stock {
  id: string;
  name: string;
  code: string;
  length: '16ft' | '12ft';
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  created_at: string;
}

export interface Slip {
  id: string;
  customer_id: string;
  stock_id: string;
  length: '16ft' | '12ft';
  pieces_used: number;
  date: string;
  color_code?: string;
  customer_name?: string;
  stock_name?: string;
}

export const useStockData = () => {
  const [stocks, setStocks] = useState<Stock[]>([
    {
      id: '1',
      name: 'Steel Rebar',
      code: 'SR001',
      length: '16ft',
      quantity: 25,
      created_at: '2024-01-15',
      updated_at: '2024-05-25'
    },
    {
      id: '2',
      name: 'Steel Rebar',
      code: 'SR002',
      length: '12ft',
      quantity: 75,
      created_at: '2024-01-15',
      updated_at: '2024-05-25'
    },
    {
      id: '3',
      name: 'Iron Rod',
      code: 'IR001',
      length: '16ft',
      quantity: 15,
      created_at: '2024-02-10',
      updated_at: '2024-05-25'
    },
    {
      id: '4',
      name: 'Aluminum Pipe',
      code: 'AP001',
      length: '12ft',
      quantity: 120,
      created_at: '2024-03-05',
      updated_at: '2024-05-25'
    }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'ABC Construction',
      created_at: '2024-01-10'
    },
    {
      id: '2',
      name: 'XYZ Builders',
      created_at: '2024-02-15'
    },
    {
      id: '3',
      name: 'Metro Infrastructure',
      created_at: '2024-03-20'
    }
  ]);

  const [slips, setSlips] = useState<Slip[]>([
    {
      id: '1',
      customer_id: '1',
      stock_id: '1',
      length: '16ft',
      pieces_used: 10,
      date: '2024-05-24',
      customer_name: 'ABC Construction',
      stock_name: 'Steel Rebar',
      color_code: 'Blue'
    },
    {
      id: '2',
      customer_id: '2',
      stock_id: '2',
      length: '12ft',
      pieces_used: 5,
      date: '2024-05-23',
      customer_name: 'XYZ Builders',
      stock_name: 'Steel Rebar',
      color_code: 'Red'
    }
  ]);

  // TODO: Replace with Supabase data fetching
  useEffect(() => {
    // This is where we'll add Supabase data fetching once tables are created
    console.log('Supabase connected, ready for data migration');
  }, []);

  return {
    stocks,
    setStocks,
    customers,
    setCustomers,
    slips,
    setSlips
  };
};
