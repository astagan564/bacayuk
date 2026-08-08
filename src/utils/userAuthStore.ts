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

import { supabase } from './supabaseClient';

const AUTH_STORAGE_KEY = 'buku_cerita_parent_auth_v1';
const FREE_READ_HISTORY_KEY = 'buku_cerita_free_read_history_v1';

export const userAuthStore = {
  getUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: UserAccount): Promise<void> {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    
    // Sync to Supabase
    try {
      await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        login_method: user.loginMethod,
        created_at: user.createdAt
      });
    } catch (e) {
      console.error('Failed to sync user to Supabase', e);
    }
  },

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
    
    await this.setUser(user);
  },

  async recordAiStoryUsed(): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    
    user.aiStoriesUsed = (user.aiStoriesUsed || 0) + 1;
    await this.setUser(user);
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
