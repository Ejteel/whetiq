export function decodeContextToken(token: string | null): string | null {
  if (!token) {
    return null;
  }
  return token.trim() || null;
}
