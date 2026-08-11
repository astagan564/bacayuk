export function isValidAdminPin(pin: unknown) {
  const configuredPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN;
  return Boolean(configuredPin && typeof pin === 'string' && pin === configuredPin);
}

