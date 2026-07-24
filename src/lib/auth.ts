import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'forge_india_secret_min_64_chars_change_in_production_xyz123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'forge_india_refresh_secret_min_64_chars_change_abc456';

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function generateAccessToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function generateRefreshToken(payload: any) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as any;
  } catch (error) {
    return null;
  }
}

