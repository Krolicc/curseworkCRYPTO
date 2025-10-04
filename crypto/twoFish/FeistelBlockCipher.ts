/**
 * @file Реализация блочного шифра на основе структуры Фейстеля.
 * @fileoverview Этот файл содержит класс FeistelBlockCipher, который реализует
 * блочный шифр Фейстеля, используя предоставленные интерфейсы IKeyExpansion и IBlockCipher
 * для раундовой функции F.
 */

import {
  BLOCK_SIZE_BYTES,
  HALF_BLOCK_SIZE_BYTES, MDS_MATRIX,
  NUM_ROUNDS,
} from "@/modules/crypto/common/constants/twoFish"

import { IBlockCipher } from "@/modules/crypto/common/interfaces/BlockCipher"
import { IKeyExpansion } from "@/modules/crypto/common/interfaces/KeyExpansion"

import { rot, wordsToBytes, bytesToWords } from "@/modules/crypto/common/bits_operation"
import {h, multiplyGF, PHT} from "@/modules/crypto/twoFish/tools"

/**
 * Класс, реализующий функционал сети Фейстеля на основе предоставленных интерфейсов.
 * Этот класс сам реализует интерфейс IBlockCipher, представляя собой блочный шифр
 * структуры Фейстеля, использующий другой IBlockCipher для раундовой функции F.
 * @augments IBlockCipher
 */
export class FeistelBlockCipher extends IBlockCipher {
  // Реализация интерфейса IKeyExpansion для расширения ключа.
  private keyExpansion_: IKeyExpansion;

  // Количество раундов в сети Фейстеля.
  private numRounds_: number;

  // Размер блока шифра в байтах.
  static blockSizeBytes_: number = HALF_BLOCK_SIZE_BYTES * 2;

  /**
   * Конструктор FeistelBlockCipher.
   * @param {IKeyExpansion} keyExpansion - Реализация интерфейса IKeyExpansion для расширения ключа.
   * @param {number} numRounds - Количество раундов в сети Фейстеля.
   * @throws {Error} Если keyExpansion или roundFunctionBlockCipher не предоставлены
   * или numRounds некорректно.
   */
  constructor(keyExpansion: IKeyExpansion, numRounds: number) {
      super();
      if (numRounds <= 0) {
          throw new Error("Количество раундов должно быть положительным числом.");
      }

      this.keyExpansion_ = keyExpansion;
      this.numRounds_ = numRounds;
  }

  /**
   * Возвращает размер блока шифра в байтах.
   * @returns {number} Размер блока в байтах.
   */
  static getBlockSizeBytes(): number {
    return this.blockSizeBytes_;
  }

  /**
   * @function encryptBlock
   * @description Шифрует один 64-битный блок данных.
   * @param {Uint8Array} blk 64-битный (8-байтный) блок открытого текста.
   * @param {number[]} round_keys Расширенный ключ, сгенерированный mcg_keyset.
   * @returns {Uint8Array} Зашифрованный 64-битный блок.
   * @source Схема 2
   */
  public encryptBlock(blk: Uint8Array<any>, round_keys: number[]): Uint8Array<any> {
    if (this.keyExpansion_.sBoxes === null) {
      throw new Error("S-boxes не определены.")
    }
    if (this.keyExpansion_.roundKeys === null) {
      throw new Error("Раундовые ключи не определены.")
    }

    let [w0, w1, w2, w3] = bytesToWords(blk);
    w0 ^= round_keys[0];
    w1 ^= round_keys[1];
    w2 ^= round_keys[2];
    w3 ^= round_keys[3];


    for (let r = 0; r < NUM_ROUNDS; r++) {
      // console.log(w0, w1, w2, w3);

      const t0 = this.gFunction(w0, this.keyExpansion_.sBoxes as number[][]);
      const t1 = this.gFunction(rot(w1, 8), this.keyExpansion_.sBoxes as number[][]);

      const [f0, f1] = PHT(t0, t1)

      w2 = rot(w2 ^ (f0 + (this.keyExpansion_.roundKeys as number[])[2 * r + 8]), -1);
      w3 = rot(w3, 1) ^ (f1 + (this.keyExpansion_.roundKeys as number[])[2 * r + 9]);


      if (r < NUM_ROUNDS - 1) {
        [w0, w1, w2, w3] = [w2, w3, w0, w1];
      }
    }

    // console.log(w0, w1, w2, w3);

    // Output whitening
    w0 ^= round_keys[4];
    w1 ^= round_keys[5];
    w2 ^= round_keys[6];
    w3 ^= round_keys[7];

    return wordsToBytes([w0, w1, w2, w3]);
  }

  /**
   * @function decryptBlock
   * @description Дешифрует один 64-битный блок зашифрованного текста.
   * @param {Uint8Array} blk 64-битный (8-байтный) блок зашифрованного текста.
   * @param {number[]} round_keys Расширенный ключ, сгенерированный mcg_keyset.
   * @returns {Uint8Array} Расшифрованный 64-битный блок.
   * @source Схема 3
   */
  public decryptBlock(blk: Uint8Array, round_keys: number[]): Uint8Array<any> {
    if (this.keyExpansion_.sBoxes === null) {
      throw new Error("S-boxes не определены.")
    }
    if (blk.length !== BLOCK_SIZE_BYTES) {
      throw new Error(`Шифротекст должен быть ${BLOCK_SIZE_BYTES} байт.`);
    }

    let [w0, w1, w2, w3] = bytesToWords(blk);

    // Reverse output whitening
    w0 ^= round_keys[4];
    w1 ^= round_keys[5];
    w2 ^= round_keys[6];
    w3 ^= round_keys[7];

    for (let r = NUM_ROUNDS - 1; r >= 0; r--) {
      if (r < NUM_ROUNDS - 1) {
        [w0, w1, w2, w3] = [w2, w3, w0, w1];
      }

      const t0 = this.gFunction(w0, this.keyExpansion_.sBoxes as number[][]);
      const t1 = this.gFunction(rot(w1, 8), this.keyExpansion_.sBoxes as number[][]);

      const [f0, f1] = PHT(t0, t1);

      const oldW2 = rot(w2, 1) ^ (f0 + (this.keyExpansion_.roundKeys as number[])[2 * r + 8]);
      const oldW3 = rot(w3 ^ (f1 + (this.keyExpansion_.roundKeys as number[])[2 * r + 9]), -1);

      // if (r === NUM_ROUNDS - 1)
      //   console.log(oldW2, oldW3);

      w2 = oldW2;
      w3 = oldW3;

    }

    // console.log(w0, w1, w2, w3);

    // Reverse input whitening
    w0 ^= round_keys[0];
    w1 ^= round_keys[1];
    w2 ^= round_keys[2];
    w3 ^= round_keys[3];

    return wordsToBytes([w0, w1, w2, w3]);
  }

  /**
   * Функция g, использующая предвычисленные S-боксы.
   * @param x 32-битное слово.
   * @param sBoxes Предвычисленные S-боксы.
   * @returns 32-битное слово.
   */
  private gFunction(x: number, sBoxes: number[][]): number {
    const b0 = sBoxes[0][(x >> 24) & 0xFF];
    const b1 = sBoxes[1][(x >> 16) & 0xFF];
    const b2 = sBoxes[2][(x >> 8) & 0xFF];
    const b3 = sBoxes[3][x & 0xFF];

    const y = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;

    // Умножение на MDS-матрицу
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
}