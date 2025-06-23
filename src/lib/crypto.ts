// src/lib/crypto.ts
"use client";

const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12; // Recommended for AES-GCM
const PBKDF2_ITERATIONS = 250000; // Increased iterations for better security

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true, // exportable: false for production if key is not needed outside
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: ArrayBuffer, password: string): Promise<ArrayBuffer | null> {
  try {
    const pako = (await import('pako')).default;
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

    // 1. Compress the data before encryption
    const compressedData = pako.deflate(new Uint8Array(data)).buffer;

    const key = await deriveKey(password, salt);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      compressedData
    );

    // Prepend salt and IV to the encrypted data
    const resultBuffer = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    resultBuffer.set(salt, 0);
    resultBuffer.set(iv, salt.length);
    resultBuffer.set(new Uint8Array(encryptedData), salt.length + iv.length);

    return resultBuffer.buffer;
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
}

export async function decryptData(encryptedDataWithSaltAndIv: ArrayBuffer, password: string): Promise<ArrayBuffer | null> {
  try {
    const pako = (await import('pako')).default;
    const dataView = new Uint8Array(encryptedDataWithSaltAndIv);

    const salt = dataView.slice(0, SALT_LENGTH_BYTES);
    const iv = dataView.slice(SALT_LENGTH_BYTES, SALT_LENGTH_BYTES + IV_LENGTH_BYTES);
    const ciphertext = dataView.slice(SALT_LENGTH_BYTES + IV_LENGTH_BYTES);

    if (salt.length !== SALT_LENGTH_BYTES || iv.length !== IV_LENGTH_BYTES) {
      throw new Error("Invalid encrypted file format: salt or IV missing/corrupted.");
    }

    const key = await deriveKey(password, salt);

    const decryptedCompressedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext.buffer
    );

    // 2. Decompress the data after decryption
    const originalData = pako.inflate(new Uint8Array(decryptedCompressedData)).buffer;

    return originalData;
  } catch (error) {
    console.error("Decryption failed:", error);
    // Common reason for failure is incorrect password or corrupted data
    if (error instanceof DOMException && error.name === 'OperationError') {
      throw new Error("Decryption failed. This might be due to an incorrect password or corrupted file.");
    }
    throw error; // Re-throw other errors
  }
}
