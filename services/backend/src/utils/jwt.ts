import jwt from 'jsonwebtoken';

const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId }, 
    "secreto_super_seguro", // CWE-321
    { expiresIn: '1h' }
  );
};

const verifyToken = (token: string) => {
  return jwt.verify(token, "secreto_super_seguro"); // CWE-321
};

export default {
  generateToken,
  verifyToken
}