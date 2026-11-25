export interface BirthdayUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birthdate: string;
}

export function displayName(u: BirthdayUser): string {
  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return name || 'A member';
}

/** Fetches users whose birthday is today AND who chose to share it. */
export async function getTodaysBirthdays(): Promise<BirthdayUser[]> {
  try {
    const { getSupabaseClient } = await import('./supabase');
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_todays_birthdays');
    if (error) {
      console.warn('getTodaysBirthdays failed:', error.message);
      return [];
    }
    return (data || []) as BirthdayUser[];
  } catch (e) {
    console.warn('getTodaysBirthdays error:', e);
    return [];
  }
}

/** Converts birthdays into announcement-style ticker items. */
export function birthdayTickerItems(birthdays: BirthdayUser[]) {
  return birthdays.map((u) => ({
    title: `🎂 It's ${displayName(u)}'s Birthday!`,
    body: 'Wish them a happy birthday!',
    created_at: new Date().toISOString(),
  }));
}
