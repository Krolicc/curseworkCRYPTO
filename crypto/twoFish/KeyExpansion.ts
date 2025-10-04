import { IKeyExpansion } from "@/modules/crypto/common/interfaces/KeyExpansion"

import {
  Q0, Q1,
  RS_MATRIX,
} from "@/modules/crypto/common/constants/twoFish"

import {
  multiplyGF,
  PHT,
  q, h,
} from "@/modules/crypto/twoFish/tools"

/**
 * Класс, реализующий расширение ключа для macGuffin.
 * @augments IKeyExpansion
 */
export class KeyExpansion extends IKeyExpansion {
  private M: number[];
  private S: number[];

  public constructor(masterKey: Uint8Array<any>) {
    super();

    const k = masterKey.length / 8;
    this.M = new Array(2 * k).fill(0);
    this.S = new Array(k).fill(0);

    // 1. Создание векторов M и S
    for (let i = 0; i < k; i++) {
      this.M[2 * i] = (masterKey[8 * i] | (masterKey[8 * i + 1] << 8) |
        (masterKey[8 * i + 2] << 16) | (masterKey[8 * i + 3] << 24));
      this.M[2 * i + 1] = (masterKey[8 * i + 4] | (masterKey[8 * i + 5] << 8) |
        (masterKey[8 * i + 6] << 16) | (masterKey[8 * i + 7] << 24));

      // RS Matrix multiplication to get S vector
      const keyBytes = masterKey.slice(8 * i, 8 * (i + 1));
      const sBytes = new Array(4).fill(0);
      for (let row = 0; row < 4; row++) {
        let sum = 0;
        for (let col = 0; col < 8; col++) {
          sum ^= multiplyGF(RS_MATRIX[row][col], keyBytes[col]);
        }
        sBytes[row] = sum;
      }
      this.S[k - 1 - i] = (sBytes[0] << 24) | (sBytes[1] << 16) | (sBytes[2] << 8) | sBytes[3];
    }

    // 2. Генерация раундовых ключей и S-боксов
    this.roundKeys_ = this.generateRoundKeysInternal();
    this.sBoxes_ = this.generateSBoxesInternal();
  }


  /**
   * Внутренняя реализация генерации раундовых ключей.
   */
  private generateRoundKeysInternal(): number[] {
    const roundKeys: number[] = new Array(40);
    for (let i = 0; i < 20; i++) {
      const temp = PHT(h(this.M[2 * i], this.M), h(this.M[2 * i + 1], this.M));
      roundKeys[2 * i] = temp[0];
      roundKeys[2 * i + 1] = temp[1];
    }
    return roundKeys;
  }

  /**
   * Внутренняя реализация генерации S-боксов.
   */
  private generateSBoxesInternal(): number[][] {
    const sBoxes = new Array(4).fill(0).map(() => new Array(256));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 256; j++) {
        // let x = j;
        // if (i === 0 || i === 2) {
        //   x = q(x, Q0);
        // } else {
        //   x = q(x, Q1);
        // }
        // sBoxes[i][j] = x;

        sBoxes[i][j] = h(j, this.S);
      }
    }
    return sBoxes;
  }
}