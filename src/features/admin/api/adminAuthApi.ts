interface VerifyAdminPinResponse {
  ok: boolean;
  error?: string;
}

export const adminAuthApi = {
  async verifyPin(pin: string): Promise<void> {
    const response = await fetch('/api/verify-admin-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const result = await response.json() as VerifyAdminPinResponse;
    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'PIN Admin salah.');
    }
  },
};
