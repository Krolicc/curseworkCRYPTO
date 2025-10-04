import { IKeyExpansion } from "@/modules/crypto/common/interfaces/KeyExpansion"
import { IBlockCipher } from "@/modules/crypto/common/interfaces/BlockCipher"

import { MacGuffinKey } from "@/modules/crypto/common/types"
import {
  KSIZE,
  S_BOX,
} from "@/modules/crypto/common/constants/macGuffin"

type extraBlock = {
  blockCipher: IBlockCipher
}

/**
 * Класс, реализующий расширение ключа для macGuffin.
 * @augments IKeyExpansion
 */
export class KeyExpansion extends IKeyExpansion {
  sBoxes_: Uint16Array<any>[] = S_BOX

  public constructor(masterKey: Uint8Array, extra: extraBlock) {
    super();

    this.generateRoundKeys(masterKey, extra);
  }

  public generateRoundKeys(masterKey: Uint8Array, extra: extraBlock): void {
    const ek: MacGuffinKey = { val: new Uint16Array(KSIZE) };

    const k = [masterKey.subarray(0, 8), masterKey.subarray(8, 16)];

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 32; j++) {
        k[i] = extra.blockCipher.encryptBlock(k[i], ek);
        ek.val[j * 3] ^= k[i][0] | (k[i][1] << 8);
        ek.val[j * 3 + 1] ^= k[i][2] | (k[i][3] << 8);
        ek.val[j * 3 + 2] ^= k[i][4] | (k[i][5] << 8);
      }
    }

    this.roundKeys_ = ek;
  }
}