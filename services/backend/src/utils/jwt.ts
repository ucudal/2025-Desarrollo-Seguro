import jwt from 'jsonwebtoken';

const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    //"secreto_super_seguro", // CWE-321
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );
};

const verifyToken = (token: string) => {
  // return jwt.verify(token, "secreto_super_seguro"); // CWE-321
  return jwt.verify(token, process.env.JWT_SECRET as string);
};

export default {
  generateToken,
  verifyToken
}