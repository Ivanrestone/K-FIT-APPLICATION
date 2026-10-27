import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and key are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RegisterMemberParams {
  email: string;
  password: string;
  fullName: string;
}

interface RegisterMemberResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export function useRegisterMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerMember = async ({
    email,
    password,
    fullName,
  }: RegisterMemberParams): Promise<RegisterMemberResult> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create user in Clerk (this would normally be done via Clerk SDK)
      // For now, we'll simulate this and create a user ID
      // In production, you would use Clerk's signUp API
      const clerkUserId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Step 2: Provision user profile in Supabase
      const { data: profileData, error: profileError } = await supabase.rpc(
        'provision_user_profile',
        {
          p_user_id: clerkUserId,
          p_email: email,
          p_full_name: fullName.trim(),
          p_password: password,
        }
      );

      if (profileError) {
        if (profileError.code === '23505' && profileError.message.includes('email')) {
          throw new Error('Email already registered');
        }
        throw new Error('Failed to create user profile');
      }

      // Step 3: Create default subscription records (inactive)
      // Use on conflict do nothing to handle existing subscriptions
      const { error: appSubError } = await supabase
        .from('subscriptions_app')
        .insert({
          user_id: clerkUserId,
          active: false,
          expires_at: null,
          cancelled_at: null,
        })
        .onConflict('user_id')
        .ignore();

      if (appSubError && appSubError.code !== '23505') {
        console.error('App subscription error:', appSubError);
        throw new Error('Failed to create app subscription');
      }

      const { error: gymSubError } = await supabase
        .from('subscriptions_gym')
        .insert({
          user_id: clerkUserId,
          active: false,
          expires_at: null,
          cancelled_at: null,
        })
        .onConflict('user_id')
        .ignore();

      if (gymSubError && gymSubError.code !== '23505') {
        console.error('Gym subscription error:', gymSubError);
        throw new Error('Failed to create gym subscription');
      }

      return {
        success: true,
        userId: clerkUserId,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
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
    registerMember,
    loading,
    error,
  };
}
