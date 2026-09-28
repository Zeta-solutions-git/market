import type { User } from '@hooks/stores/authStore'

type DisplayUser = Pick<
  User,
  'name' | 'email' | 'username' | 'firstName' | 'lastName'
> | null

// Full name for display: first+last (oe-profile claims) -> name -> username -> email.
export function getDisplayName(user: DisplayUser): string {
  if (!user) return ''
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return full || user.name || user.username || user.email || ''
}

export function getFirstName(user: DisplayUser): string {
  if (!user) return ''
  return user.firstName || getDisplayName(user).split(' ')[0] || ''
}

// Up to two initials, e.g. "Friso van der Burg" -> "FB".
export function getInitials(user: DisplayUser): string {
  const name = getDisplayName(user)
  if (!name) return '?'
  const parts = name.split(/[\s@._-]+/).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
}
