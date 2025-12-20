import { useUser } from '@clerk/clerk-react';

export const useSafeUser = () => {
  try {
    return useUser();
  } catch {
    // outside <ClerkProvider> → return null user
    return { user: null, isLoaded: true };
  }
};
