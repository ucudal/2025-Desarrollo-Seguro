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

  // VULNERABILIDAD: guardar el secreto JWT embebido en el codigo permite al atacante generar un token falso

  // MITIGACIÓN: almacenar el secreto JWT en el archivo de entorno .env

  try {
    const secret = process.env.JWT_SECRET || "";
    if (!secret) {
      throw new Error("JWT secret not configured");
    }
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export default authenticateJWT;
