import { useAuthCheck, useProfile } from '../lib/auth-context';

export function useUser() {
  const { isAuthenticated, isLoading, userId } = useAuthCheck();
  const { profile } = useProfile();
  
  return {
    user: isAuthenticated ? { id: userId, ...profile } : null,
    isLoading,
    isAuthenticated,
    userId
  };
} 