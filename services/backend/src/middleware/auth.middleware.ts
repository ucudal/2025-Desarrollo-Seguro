import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // VULNERABILIDAD:(Hard Coded Credentials)
    // CWE-798: Use of Hard-coded Credentials
    // El secreto JWT está hardcodeado también en el middleware de autenticación.
    // Esto crea inconsistencia y riesgo de seguridad si el secreto se cambia en un lugar pero no en otro.
    // Debería usar la misma fuente centralizada de configuración (variables de entorno).
    // Esto debe solucionarse en ambas partes
    const decoded = jwt.verify(token, "secreto_super_seguro");
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export default authenticateJWT;