import jwt from 'jsonwebtoken';

const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '1d' }
  );
};

const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
};

export default {
  generateToken,
  verifyToken
}