import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DbUser {
  id: string;
  role: string;
  created_at: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  password: string | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  membership: string;
  trainer: string;
  joinedDate: string;
  status: 'Active' | 'Pending' | 'Expired';
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'member')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedMembers: Member[] = (users || []).map((user: DbUser) => {
        const createdAt = new Date(user.created_at);
        const joinedDate = createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        });

        const name = user.full_name || 
          (user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user.first_name || user.last_name || 'Unknown');

        return {
          id: user.id,
          name,
          email: user.email,
          membership: 'Paid',
          trainer: 'Unassigned',
          joinedDate,
          status: 'Active',
        };
      });

      setMembers(mappedMembers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
}
