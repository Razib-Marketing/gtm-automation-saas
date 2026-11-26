export async function startGoogleOAuth(
  getToken: () => Promise<string | null>,
  returnTo = '/organization'
): Promise<void> {
  const token = await getToken();
  if (!token) {
    throw new Error('Authentication session expired. Please refresh and sign in again.');
  }

  const res = await fetch('/api/auth/google/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    credentials: 'same-origin',
    body: JSON.stringify({ returnTo })
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.authUrl) {
    throw new Error(data?.error || 'Failed to initiate Google OAuth connection');
  }

  window.location.href = data.authUrl;
}
