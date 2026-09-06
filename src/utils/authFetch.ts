import { auth } from '../firebase';

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  // If currentUser is null, wait for initial auth state hydration
  if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
    try {
      await auth.authStateReady();
    } catch {
      // Ignore
    }
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error('User is not authenticated');
  }

  const token = await user.getIdToken();

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
