import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MONTHLY_PRICE = 45;

export function useRevenue() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the start of the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthISO = startOfMonth.toISOString();

      // Count members created this month
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .gte('created_at', startOfMonthISO);

      if (countError) {
        throw countError;
      }

      const revenue = (count || 0) * MONTHLY_PRICE;
      setMonthlyRevenue(revenue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch revenue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  return {
    monthlyRevenue,
    loading,
    error,
    refetch: fetchRevenue,
  };
}
