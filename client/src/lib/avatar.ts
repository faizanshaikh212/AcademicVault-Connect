// Default avatar SVG as a data URL - a simple, professional placeholder
export const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(`
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#E5E7EB"/>
  <path d="M100 100C116.569 100 130 86.5685 130 70C130 53.4315 116.569 40 100 40C83.4315 40 70 53.4315 70 70C70 86.5685 83.4315 100 100 100ZM100 110C77.9086 110 60 127.909 60 150V160H140V150C140 127.909 122.091 110 100 110Z" fill="#9CA3AF"/>
</svg>
`)}`;

/**
 * Gets the avatar URL with cache busting if needed
 * @param avatarUrl - The avatar URL from the user's profile
 * @param updatedAt - The user's last update timestamp
 * @returns The final avatar URL with cache busting if needed
 */
export function getAvatarUrl(
  avatarUrl: string | undefined,
  updatedAt: string | undefined
): string {
  if (!avatarUrl) return DEFAULT_AVATAR;

  const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  return `${avatarUrl}?t=${timestamp}`;
}
