import jwt from 'jsonwebtoken';

// VULNERABILIDAD: Credenciales Embebidas (Hard Coded Credentials)
// CWE-798: Use of Hard-coded Credentials
// El secreto JWT está hardcodeado directamente en el código fuente.
// Esto permite a cualquiera con acceso al código descifrar y falsificar tokens JWT.
// El secreto debería estar en variables de entorno o un sistema de gestión de secretos.
const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId }, 
    "secreto_super_seguro", 
    { expiresIn: '1h' }
  );
};

// VULNERABILIDAD: Credenciales Embebidas (Hard Coded Credentials)
// CWE-798: Use of Hard-coded Credentials
// Mismo problema: el secreto JWT hardcodeado permite comprometer la seguridad de todos los tokens.
const verifyToken = (token: string) => {
  return jwt.verify(token, "secreto_super_seguro");
};

export default {
  generateToken,
  verifyToken
}