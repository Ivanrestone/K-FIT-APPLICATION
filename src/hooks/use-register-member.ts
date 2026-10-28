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
      const { error: profileError } = await supabase.rpc(
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
      // Don't fail registration if subscriptions fail - they can be created later via payment
      try {
        await supabase
          .from('subscriptions_app')
          .insert({
            user_id: clerkUserId,
            active: false,
            expires_at: null,
            cancelled_at: null,
          });
      } catch (e) {
        // Ignore subscription errors - user is created successfully
      }

      try {
        await supabase
          .from('subscriptions_gym')
          .insert({
            user_id: clerkUserId,
            active: false,
            expires_at: null,
            cancelled_at: null,
          });
      } catch (e) {
        // Ignore subscription errors - user is created successfully
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
