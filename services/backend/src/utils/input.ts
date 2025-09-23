// Para verificar que el nombre real es válido.
export const isValidName = (name: string): boolean => {
  if (!name) return false;

  // Letras (a-z, A-Z, acentos), espacios. 3-50 caracteres.
  const regex = /^[a-zA-ZÀ-ÿ\s]{3,50}$/;

  // Quitar espacio al inicio y al final para el test.
  return regex.test(name.trim());
};

// Para verificar que el nombre de usuario es válido.
export const isValidUsername = (username: string): boolean => {
  if (!username) return false;

  // Letras (a-z, A-Z), números, guion bajo y medio, punto. 3-30 caracteres.
  const regex = /^[a-zA-Z0-9._-]{3,30}$/;

  // Quitar espacio al inicio y al final para el test.
  return regex.test(username.trim());
};

// Para verificar que el email es válido.
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;

  // Explicación del regex:
  // ^                 -> inicio de string
  // [^\s@]+           -> uno o más caracteres que no sean espacio ni @
  // @                 -> literal @
  // [^\s@]+           -> uno o más caracteres que no sean espacio ni @
  // \.                -> literal punto
  // [^\s@]+           -> uno o más caracteres que no sean espacio ni @
  // $                 -> fin del string
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(email.trim());
};

export default {
  isValidName,
  isValidUsername,
  isValidEmail
};