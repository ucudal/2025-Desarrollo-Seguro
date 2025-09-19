import jwt from 'jsonwebtoken';

const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    //"secreto_super_seguro", // CWE-321
    process.env.JWT_SECRET as string, // CWE-522
    { expiresIn: '1h' } // CWE-327
  );
};

const verifyToken = (token: string) => {
  // return jwt.verify(token, "secreto_super_seguro"); // CWE-321
  return jwt.verify(token, process.env.JWT_SECRET as string); // CWE-347
};

export default {
  generateToken,
  verifyToken
}