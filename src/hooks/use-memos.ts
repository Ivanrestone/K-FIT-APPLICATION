import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

type Priority = 'High' | 'Medium' | 'Low';

interface DbMemo {
  id: string;
  title: string;
  content: string;
  created_at: string;
  priority: Priority;
  author: string;
}

interface Memo {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: Priority;
  author: string;
}

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemos = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: memosData, error: fetchError } = await supabase
        .from('memos')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedMemos: Memo[] = (memosData || []).map((memo: DbMemo) => {
        const createdAt = new Date(memo.created_at);
        const date = createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        });

        return {
          id: memo.id,
          title: memo.title,
          content: memo.content,
          date,
          priority: memo.priority,
          author: memo.author,
        };
      });

      setMemos(mappedMemos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch memos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createMemo = async ({
    title,
    content,
    priority,
    author,
  }: {
    title: string;
    content: string;
    priority: Priority;
    author: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('memos').insert({
        title: title.trim(),
        content: content.trim(),
        priority,
        author,
      });

      if (insertError) {
        throw insertError;
      }

      await fetchMemos();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create memo';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteMemo = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase.from('memos').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchMemos();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete memo';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  return {
    memos,
    loading,
    error,
    refetch: fetchMemos,
    createMemo,
    deleteMemo,
  };
}
