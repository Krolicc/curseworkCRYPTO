import { MacGuffinKey } from "@/modules/crypto/common/types";

/**
 * @class IBlockCipher
 * Интерфейс для блочного шифра.
 * Классы, реализующие этот интерфейс, должны предоставлять методы для шифрования и дешифрования блоков.
 */
export class IBlockCipher {
  /**
   * Возвращает размер блока шифра в байтах.
   * @returns {number} Размер блока в байтах.
   */
  getBlockSizeBytes(): number {
    throw new Error("Метод 'getBlockSizeBytes' должен быть реализован.");
  }

  /**
   * Шифрует один блок данных.
   * @param {Uint8Array} blk - Блок данных для шифрования.
   * @param {MacGuffinKey} key - Раундовые ключи, сгенерированные IKeyExpansion.
   * @returns {Uint8Array} Зашифрованный блок.
   * @throws {Error} Если размер блока некорректен.
   */
  encryptBlock(blk: Uint8Array<any>, key: MacGuffinKey | number[]): Uint8Array<any> {
    throw new Error("Метод 'encryptBlock' должен быть реализован.");
  }

  /**
   * Дешифрует один блок данных.
   * @param {Uint8Array} blk - Блок данных для дешифрования.
   * @param {MacGuffinKey} key - Раундовые ключи, сгенерированные IKeyExpansion.
   * @returns {Uint8Array} Расшифрованный блок.
   * @throws {Error} Если размер блока некорректен.
   */
  decryptBlock(blk: Uint8Array<any>, key: MacGuffinKey | number[]): Uint8Array<any> {
    throw new Error("Метод 'decryptBlock' должен быть реализован.");
  }
}