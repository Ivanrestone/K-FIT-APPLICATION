import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface LoginParams {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string | null;
  };
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async ({
    email,
    password,
  }: LoginParams): Promise<LoginResult> => {
    setLoading(true);
    setError(null);

    try {
      // Query the users table to find the user by email
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (fetchError) {
        throw new Error('Invalid email or password');
      }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if password matches (in production, use proper password hashing)
      if (user.password !== password.trim()) {
        throw new Error('Invalid email or password');
      }

      // Return user data
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
}
