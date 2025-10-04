import {MacGuffinKey} from "@/modules/crypto/common/types";

/**
 * @interface IKeyExpansion
 * Интерфейс для расширения ключа.
 * Классы, реализующие этот интерфейс, должны предоставлять метод для генерации раундовых ключей.
 */
export class IKeyExpansion {
  // S-boxes
  protected sBoxes_: number[][] | Uint16Array[] | null = null;

  public get sBoxes(): number[][] | Uint16Array[] | null {
    return this.sBoxes_;
  }

  // Раундовые ключи
  protected roundKeys_: number[] | MacGuffinKey | null = null;

  public get roundKeys(): number[] | MacGuffinKey | null {
    return this.roundKeys_;
  }
  /**
   * @function generateRoundKeys
   * @description Расширяет 128-битный ключ в 32x3 таблицу 16-битных слов.
   * Этот процесс использует итерацию собственного алгоритма шифрования macGuffin.
   * @param {Uint8Array} masterKey 128-битный (16-байтный) секретный ключ.
   * @param {object} extra - Вспомогательные данныеы.
   * @returns {MacGuffinKey} Расширенный ключ.
   * @throws {Error} Если мастер-ключ некорректного размера или numRounds <= 0.
   */
  generateRoundKeys(masterKey: Uint8Array, extra: object = {}): void {
    throw new Error("Метод 'generateRoundKeys' должен быть реализован.");
  }
}