import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { UserSettingsView } from '@/components/UserSettings';

interface SettingsApplicationRouteProps {
  isNight: boolean;
}

export function SettingsApplicationRoute({ isNight }: SettingsApplicationRouteProps) {
  const navigate = useNavigate();
  const returnHome = useCallback(() => {
    void navigate({ to: '/' });
  }, [navigate]);

  return <UserSettingsView onBack={returnHome} isNight={isNight} />;
}
