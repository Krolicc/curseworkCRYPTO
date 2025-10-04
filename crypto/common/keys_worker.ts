export async function encryptKey(key: string, masterKey: string): Promise<string> {
  // Наша логика шифрования
  return btoa(key + masterKey);
}

export async function decryptKey(encryptedKey: string, masterKey: string): Promise<string> {
  const decrypted = atob(encryptedKey);
  if (decrypted.endsWith(masterKey)) {
    return decrypted.slice(0, -masterKey.length);
  }
  throw new Error('Invalid key');
}

export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    base = (base * base) % modulus;
    exponent = exponent >> 1n; // Оператор побитового сдвига для деления на 2
  }
  return result;
}

export function generateRandomBigInt(max: bigint): bigint {
  const byteLength = Math.ceil(Number(max.toString(2).length) / 8);
  const array = new Uint8Array(byteLength);

  window.crypto.getRandomValues(array);

  let randomValue = 0n;

  for (let i = 0; i < byteLength; i++) {
    randomValue = (randomValue << 8n) | BigInt(array[i]);
  }
  return randomValue % max;
}

export function generateDHKeys({p, g}: any) : { publicKey: bigint, privateKey: bigint } {
  const a: bigint = generateRandomBigInt(p - 1n);

  const A = modPow(g, a, p)

  console.log("Новый приватный ключ (a):", a.toString());
  console.log("Новый публичный ключ (A):", A.toString());

  return { publicKey: A, privateKey: a };
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };

    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(new Blob([buffer]));
  });
}

export async function generateFixedLengthKey(
  keyString: string,
  length: 16 | 24 | 32
): Promise<string> {
  let hashAlgorithm: 'SHA-256' | 'SHA-384';

  switch (length) {
    case 16:
      hashAlgorithm = 'SHA-256';
      break;
    case 24:
      hashAlgorithm = 'SHA-384';
      break;
    case 32:
      hashAlgorithm = 'SHA-256';
      break;
    default:
      throw new Error('Unsupported key length. Use 16, 24, or 32.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(keyString);

  const hashBuffer = await crypto.subtle.digest(hashAlgorithm, data);

  const resultBytes = new Uint8Array(hashBuffer);

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(resultBytes.slice(0, length));
}

/**
 * Генерирует криптографически стойкий IV для блочного шифра.
 * @param {number} ivLength - Длина IV в байтах.
 * @returns {Uint8Array} Сгенерированный вектор инициализации
 */
export async function generateIV(ivLength: number): Promise<Uint8Array> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.getRandomValues) {
    throw new Error('Web Crypto API не поддерживается в этом окружении.')
  }

  const iv = new Uint8Array(ivLength)

  window.crypto.getRandomValues(iv)

  return iv
}

export const stringToUint8Array = (str: string) => {
  return new TextEncoder().encode(str);
}

export const uint8ArrayToString = (arr: any) => {
  return new TextDecoder().decode(arr);
}