// authUtils.ts - Authentication utilities (password hashing, JWT)

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../types';

// Configuration
const BCRYPT_ROUNDS = 10;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// JWT Secret — WAJIB diset di .env, tidak ada fallback default demi keamanan
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  console.error('❌ FATAL: JWT_SECRET belum diset atau terlalu pendek (minimal 32 karakter).');
  console.error('   Tambahkan JWT_SECRET di file .env');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️  Development mode: menggunakan fallback secret (JANGAN gunakan di production!)');
  }
}

// Fallback hanya untuk development, di production akan exit di atas
export const JWT_SECRET = rawSecret || 'dev-only-secret-do-not-use-in-production-' + Date.now();

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: UserPayload | Record<string, any>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: UserPayload | Record<string, any>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Create user payload for JWT (exclude sensitive data)
 */
export function createUserPayload(user: any): UserPayload {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    guru_id: user.guru_id
  };
}

const mod = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  createUserPayload,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};

module.exports = mod;
export default mod;
