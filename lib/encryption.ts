import CryptoJS from 'crypto-js';

// Fallback key if ENCRYPTION_KEY is not set (for development)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'hexacloud-default-encryption-key-2024';

export function encryptPassword(password: string): string {
  try {
    if (!password) {
      throw new Error('Password is required');
    }
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
}

export function decryptPassword(encryptedPassword: string): string {
  try {
    if (!encryptedPassword) {
      throw new Error('Encrypted password is required');
    }
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
}