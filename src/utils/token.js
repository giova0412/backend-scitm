import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export function generarTokenRecuperacion(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no definido en variables de entorno");
  return jwt.sign({ id: userId }, secret, { expiresIn: "15m" });
}

export function verificarToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no definido en variables de entorno");
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
