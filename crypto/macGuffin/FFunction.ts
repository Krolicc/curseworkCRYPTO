import {
  HALF_BLOCK_SIZE_BYTES,
  LOOKUP_MASKS,
  OUTPUT_MASKS,
} from "@/modules/crypto/common/constants/macGuffin"

/**
 * Класс, реализующий F-функцию macGuffin как блочный шифр.
 */
export class FFunction {
  static blockSizeBytes_: number = HALF_BLOCK_SIZE_BYTES;

  /**
   * @function getBlockSizeBytes
   * @description Возвращает размер блока F-функции в байтах.
   * @returns {number} Размер блока F-функции.
   */
  static getBlockSizeBytes(): number {
    return this.blockSizeBytes_;
  }

  /**
   * @function f_optimized
   * @description Вычисляет функцию F с использованием оптимизированного табличного поиска.
   * @param {number} a Регистр a.
   * @param {number} b Регистр b.
   * @param {number} c Регистр c.
   * @param {Uint16Array<ArrayBuffer>} stable Раундовые ключи.
   * @returns {number} 16-битный результат функции.
   * @throws {Error} Функция не реализована.
   */
  public f_optimized(a: number, b: number, c: number, stable: Uint16Array<ArrayBufferLike>): number {
    let result = 0;
    for (let j = 0; j < 4; j++) {
      const index = (a & LOOKUP_MASKS[j][0]) | (b & LOOKUP_MASKS[j][1]) | (c & LOOKUP_MASKS[j][2]);
      result |= OUTPUT_MASKS[j] & stable[index];
    }
    return result;
  }
}