import {
  MDS_MATRIX,
  Q0, Q1,
  RS_POLY
} from "@/modules/crypto/common/constants/twoFish";

export function q(x: number, qTable: typeof Q0): number {
  const a0 = (x >> 4) & 0xF;
  const b0 = x & 0xF;

  const a1 = a0 ^ b0;
  const b1 = a0 ^ (((b0 << 1) | (b0 >> 3)) & 0xF) ^ ((8 * a0) & 0xF);

  const a2 = qTable.t0[a1];
  const b2 = qTable.t1[b1];

  const a3 = a2 ^ b2;
  const b3 = a2 ^ (((b2 << 1) | (b2 >> 3)) & 0xF) ^ ((8 * a2) & 0xF);

  const a4 = qTable.t2[a3];
  const b4 = qTable.t3[b3];

  return (b4 << 4) | a4;
}

// Эта функция h - это то, что вы описали как g(X) = h(X, S)
export function h(x: number, lVector: number[]): number {
    const k = lVector.length;

  let y0 = (x >> 24) & 0xFF;
  let y1 = (x >> 16) & 0xFF;
  let y2 = (x >> 8) & 0xFF;
  let y3 = x & 0xFF;

  if (k >= 4) {
    y3 = q(y3, Q1) ^ ((lVector[3] >> 24) & 0xFF);
    y2 = q(y2, Q0) ^ ((lVector[3] >> 16) & 0xFF);
    y1 = q(y1, Q1) ^ ((lVector[3] >> 8) & 0xFF);
    y0 = q(y0, Q1) ^ (lVector[3] & 0xFF);
  }

  if (k >= 3) {
    y3 = q(y3, Q0) ^ ((lVector[2] >> 24) & 0xFF);
    y2 = q(y2, Q0) ^ ((lVector[2] >> 16) & 0xFF);
    y1 = q(y1, Q1) ^ ((lVector[2] >> 8) & 0xFF);
    y0 = q(y0, Q1) ^ (lVector[2] & 0xFF);
  }

  y0 = q(q(q(y0, Q0) ^ ((lVector[1] >> 24) & 0xFF), Q0) ^ ((lVector[0] >> 24) & 0xFF), Q1);
  y1 = q(q(q(y1, Q1) ^ ((lVector[1] >> 16) & 0xFF), Q0) ^ ((lVector[0] >> 16) & 0xFF), Q0);
  y2 = q(q(q(y2, Q0) ^ ((lVector[1] >> 8) & 0xFF), Q1) ^ ((lVector[0] >> 8) & 0xFF), Q1);
  y3 = q(q(q(y3, Q1) ^ (lVector[1] & 0xFF), Q1) ^ (lVector[0] & 0xFF), Q0);

  const y = (y0 << 24) | (y1 << 16) | (y2 << 8) | y3;

  const z0 =
    multiplyGF(MDS_MATRIX[0][0], (y >> 24) & 0xFF) ^
    multiplyGF(MDS_MATRIX[0][1], (y >> 16) & 0xFF) ^
    multiplyGF(MDS_MATRIX[0][2], (y >> 8) & 0xFF) ^
    multiplyGF(MDS_MATRIX[0][3], y & 0xFF);
  const z1 =
    multiplyGF(MDS_MATRIX[1][0], (y >> 24) & 0xFF) ^
    multiplyGF(MDS_MATRIX[1][1], (y >> 16) & 0xFF) ^
    multiplyGF(MDS_MATRIX[1][2], (y >> 8) & 0xFF) ^
    multiplyGF(MDS_MATRIX[1][3], y & 0xFF);
  const z2 =
    multiplyGF(MDS_MATRIX[2][0], (y >> 24) & 0xFF) ^
    multiplyGF(MDS_MATRIX[2][1], (y >> 16) & 0xFF) ^
    multiplyGF(MDS_MATRIX[2][2], (y >> 8) & 0xFF) ^
    multiplyGF(MDS_MATRIX[2][3], y & 0xFF);
  const z3 =
    multiplyGF(MDS_MATRIX[3][0], (y >> 24) & 0xFF) ^
    multiplyGF(MDS_MATRIX[3][1], (y >> 16) & 0xFF) ^
    multiplyGF(MDS_MATRIX[3][2], (y >> 8) & 0xFF) ^
    multiplyGF(MDS_MATRIX[3][3], y & 0xFF);

  return (z0 << 24) | (z1 << 16) | (z2 << 8) | z3;
}

/**
 * Умножение над полем Галуа GF(2^8).
 * @param a - Первый множитель.
 * @param b - Второй множитель.
 * @returns Результат умножения.
 */
export function multiplyGF(a: number, b: number): number {
  let result = 0;
  while (b > 0) {
    if (b & 1) {
      result ^= a;
    }
    a <<= 1;
    if (a & 0x100) {
      a ^= RS_POLY;
    }
    b >>= 1;
  }
  return result;
}

export const PHT = (a: number, b: number) => [(a + b) % 2**32, (a + 2*b) % 2**32];
