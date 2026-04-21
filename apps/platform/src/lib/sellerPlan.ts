/** Či má predajca aktívny plán PRO / Firma (odznak dôvery). */
export function isProSellerBadge(
  plan?: string | null,
  validUntil?: string | Date | null,
): boolean {
  if (!plan || !validUntil) return false
  const end = typeof validUntil === 'string' ? new Date(validUntil) : validUntil
  if (Number.isNaN(end.getTime()) || end.getTime() <= Date.now()) return false
  return plan === 'PRO' || plan === 'FIRMA'
}

export function sellerPlanLabel(plan?: string | null): string {
  switch (plan) {
    case 'PLUS':
      return 'Plus'
    case 'PRO':
      return 'RentMe Pro'
    case 'FIRMA':
      return 'Firma'
    default:
      return 'Štandard'
  }
}

/** Má používateľ zaplatený plán (nie Štandard) a ešte neexpirovaný? */
export function sellerPlanSubscriptionActive(
  plan?: string | null,
  validUntil?: string | Date | null,
): boolean {
  if (!plan || plan === 'STANDARD') return false
  if (!validUntil) return false
  const end = typeof validUntil === 'string' ? new Date(validUntil) : validUntil
  if (Number.isNaN(end.getTime())) return false
  return end.getTime() > Date.now()
}

/** Bol vyšší plán, ale dátum už vypršal? */
export function sellerPlanSubscriptionExpired(
  plan?: string | null,
  validUntil?: string | Date | null,
): boolean {
  if (!plan || plan === 'STANDARD') return false
  if (!validUntil) return false
  const end = typeof validUntil === 'string' ? new Date(validUntil) : validUntil
  if (Number.isNaN(end.getTime())) return false
  return end.getTime() <= Date.now()
}
