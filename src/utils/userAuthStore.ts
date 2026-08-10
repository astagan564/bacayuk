export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loginMethod: 'google' | 'whatsapp' | 'email';
  createdAt: string;
  vipExpiresAt?: string; // ISO string
  aiStoriesUsed?: number;
}

import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

const FREE_READ_HISTORY_KEY = 'buku_cerita_free_read_history_v1';
let authenticatedUser: UserAccount | null = null;

function accountFromAuthUser(user: User): UserAccount {
  const provider = user.app_metadata?.provider;
  const loginMethod: UserAccount['loginMethod'] = provider === 'google'
    ? 'google'
    : user.phone
      ? 'whatsapp'
      : 'email';
  const name = String(
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.parent_name ||
    (user.phone ? `Orang Tua (${user.phone.slice(-4)})` : '') ||
    user.email?.split('@')[0] ||
    'Orang Tua'
  );

  return {
    id: user.id,
    name,
    email: user.email || '',
    phone: user.phone || undefined,
    loginMethod,
    createdAt: user.created_at,
    vipExpiresAt: typeof user.app_metadata?.vip_expires_at === 'string' ? user.app_metadata.vip_expires_at : undefined,
    aiStoriesUsed: typeof user.app_metadata?.ai_stories_used === 'number' ? user.app_metadata.ai_stories_used : undefined,
  };
}

export const userAuthStore = {
  getUser(): UserAccount | null {
    return authenticatedUser;
  },

  async initialize(): Promise<UserAccount | null> {
    const { data, error } = await supabase.auth.getUser();
    authenticatedUser = error || !data.user ? null : accountFromAuthUser(data.user);
    return authenticatedUser;
  },

  onAuthStateChange(callback: (user: UserAccount | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      authenticatedUser = session?.user ? accountFromAuthUser(session.user) : null;
      callback(authenticatedUser);
    }).data.subscription;
  },

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  },

  async sendWhatsAppOtp(phone: string, parentName?: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'whatsapp',
        data: { parent_name: parentName?.trim() || undefined },
      },
    });
    if (error) throw error;
  },

  async verifyWhatsAppOtp(phone: string, token: string): Promise<UserAccount> {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    if (!data.user) throw new Error('Sesi WhatsApp belum berhasil dibuat.');
    authenticatedUser = accountFromAuthUser(data.user);
    return authenticatedUser;
  },

  async sendEmailMagicLink(email: string, parentName?: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        data: { parent_name: parentName?.trim() || undefined },
      },
    });
    if (error) throw error;
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    authenticatedUser = null;
  },

  isVip(): boolean {
    const user = this.getUser();
    if (!user || !user.vipExpiresAt) return false;
    return new Date(user.vipExpiresAt) > new Date();
  },

  async activateVip(): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1); // 1 month subscription
    
    user.vipExpiresAt = expires.toISOString();
    user.aiStoriesUsed = 0; // reset quota on payment
    
    authenticatedUser = user;
  },

  async recordAiStoryUsed(): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    
    user.aiStoriesUsed = (user.aiStoriesUsed || 0) + 1;
    authenticatedUser = user;
  },

  // Returns array of story IDs read as a guest
  getReadHistory(): string[] {
    try {
      const data = localStorage.getItem(FREE_READ_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Track a story read by user
  async recordStoryRead(storyId: string, storyTitle?: string): Promise<void> {
    const history = this.getReadHistory();
    if (!history.includes(storyId)) {
      history.push(storyId);
      localStorage.setItem(FREE_READ_HISTORY_KEY, JSON.stringify(history));
    }
    
    // Sync to Supabase if logged in
    const user = this.getUser();
    if (user) {
      try {
        await supabase.from('user_reading_activities').upsert({
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          story_id: storyId,
          story_title: storyTitle || storyId,
          last_page_read: 0,
          total_pages: 0,
          is_completed: false
        }, { onConflict: 'user_id,story_id' });
      } catch (e) {
        console.error('Failed to sync reading activity', e);
      }
    }
  },

  /**
   * Returns true if user can read the story online.
   * Logic:
   * 1. If logged in -> Always allowed (unlimited online reading)
   * 2. If guest:
   *    - If readHistory is empty -> Allowed (this will be their 1 free story)
   *    - If readHistory contains this storyId -> Allowed (they can re-read their 1 free story)
   *    - If readHistory already has 1 or more OTHER stories -> LOCKED (requires login)
   */
  canReadStoryOnline(storyId: string, accessStatus?: 'free_guest' | 'free_member' | 'paid'): boolean {
    if (accessStatus === 'free_guest') return true;

    const user = this.getUser();
    if (user) return true; // Logged in members get unlimited online access for free/member books

    const history = this.getReadHistory();
    if (history.length === 0) return true; // First book is free
    if (history.includes(storyId)) return true; // Same free book re-read allowed

    return false; // Tried to access a 2nd story without login
  },

  getFreeStoryId(): string | null {
    const history = this.getReadHistory();
    return history.length > 0 ? history[0] : null;
  }
};
