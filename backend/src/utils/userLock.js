/** Stable 64-bit advisory lock keys from a user UUID for pg_advisory_xact_lock. */
export function userAdvisoryLockKeys(userId) {
  const hex = String(userId).replace(/-/g, '');
  return [
    parseInt(hex.slice(0, 8), 16) || 1,
    parseInt(hex.slice(8, 16), 16) || 1,
  ];
}
