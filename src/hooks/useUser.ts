import { useAuth } from '../lib/auth-context';

export function useUser() {
  const { user, isLoading } = useAuth();
  
  return {
    user,
    isLoading,
  };
} 