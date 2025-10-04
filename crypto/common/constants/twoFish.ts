/**
 * Размер блока twoFish в байтах (64 бита).
 * @type {number}
 */
export const BLOCK_SIZE_BYTES = 16

/**
 * Размер половины блока twoFish в байтах (32 бита).
 * @type {number}
 */
export const HALF_BLOCK_SIZE_BYTES = BLOCK_SIZE_BYTES / 2

/**
 * Количество раундов в twoFish.
 * @type {number}
 */
export const NUM_ROUNDS = 16

/**
 * Размер мастер-ключа twoFish в байтах (часто 128 бита).
 * @type {number[]}
 */
export const MASTER_KEY_SIZE_BYTES = [16, 24, 32]

/**
 * Размер раундового ключа для F-функции twoFish в байтах (обычно 48 бита).
 * @type {number}
 */
export const ROUND_KEY_SIZE_BYTES = 6

// Q-Permutations (fixed 8x8-bit bijective permutations)
// Constructed from four 4x4-bit permutations (t0-t3)
export const Q0 = {
  t0: [8, 1, 7, 13, 6, 15, 3, 2, 0, 11, 5, 9, 14, 12, 10, 4],
  t1: [14, 12, 11, 8, 1, 2, 3, 5, 15, 4, 10, 6, 7, 0, 9, 13],
  t2: [11, 10, 5, 14, 6, 13, 9, 0, 12, 8, 15, 3, 2, 4, 7, 1],
  t3: [13, 7, 15, 4, 1, 2, 6, 14, 9, 11, 3, 0, 8, 5, 12, 10]
};
export const Q1 = {
  t0: [2, 8, 11, 13, 15, 7, 6, 14, 3, 1, 9, 4, 0, 10, 12, 5],
  t1: [1, 14, 2, 11, 4, 12, 3, 7, 6, 13, 10, 5, 15, 9, 0, 8],
  t2: [4, 12, 7, 5, 1, 6, 9, 10, 0, 14, 13, 8, 2, 11, 3, 15],
  t3: [11, 9, 5, 1, 12, 3, 13, 14, 6, 4, 7, 15, 2, 0, 8, 10]
};

// MDS Матрица (Maximum Distance Separable)
export const MDS_MATRIX: number[][] = [
  [1, 239, 91, 91],
  [91, 239, 239, 1],
  [239, 91, 1, 239],
  [239, 1, 239, 91]
];

// RS-матрица (hex в десятичном формате)
export const RS_MATRIX: number[][] = [
  [1, 164, 85, 135, 90, 88, 219, 158],
  [164, 86, 130, 243, 30, 198, 104, 229],
  [2, 161, 252, 193, 71, 174, 61, 25],
  [164, 85, 135, 90, 88, 219, 158, 3]
];

// Примитивный многочлен для GF(2^8): x^8+x^6+x^5+x^3+1
export const RS_POLY = 0x169; // 101101001 в двоичной
