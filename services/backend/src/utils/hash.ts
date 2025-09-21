import bcrypt from "bcrypt";

// Hashea texto plano.
const hashPlainText = (plainText: string):
  Promise<string> => {
    // Factor de coste de hashing (mientras más alto, más seguro, pero más lento).
    // No confudir con el salt, porque el salt se genera de manera pseudoaleatoria.
    const rounds = 12 // Esto equivale a 2^12 iteracciones = 4.096 iteracciones.
    return bcrypt.hash(plainText, rounds);
}

// Verifica que el texto plano produce el texto hasheado.
const compareHashedPlainText = (plainText: string, hashedPlainText: string):
  Promise<boolean> => {
    return bcrypt.compare(plainText, hashedPlainText);
}

export default {
  hashPlainText,
  compareHashedPlainText
}