import {
  HALF_BLOCK_SIZE_BYTES,
  MASTER_KEY_SIZE_BYTES,
  NUM_ROUNDS,
} from "@/modules/crypto/common/constants/twoFish"

import { CipherContextBase } from "@/modules/crypto/common/interfaces/CipherContext"

import { KeyExpansion } from "@/modules/crypto/twoFish/KeyExpansion"
import { FeistelBlockCipher } from "@/modules/crypto/twoFish/FeistelBlockCipher"

import { xorBytes } from "@/modules/crypto/common/bits_operation"
import {CipherMode} from "@/types/state";

/**
 * @description Класс контекста шифрования macGuffin.
 * @extends CipherContextBase
 */
export class CipherContext extends CipherContextBase {
  // Мастер ключ
  private masterKey_: null | Uint8Array<any>

  /**
   * Конструктор CipherContext.
   */
  constructor() {
    super()

    this.masterKey_ = null;
  }

  public getBlockSizeBytes(): number {
    return FeistelBlockCipher.getBlockSizeBytes()
  }

  /**
   * Устанавливает мастер-ключ и генерирует раундовые ключи.
   * @param {Uint8Array} masterKey - Мастер-ключ.
   * @throws {Error} Если мастер-ключ некорректного размера.
   */
  public setMasterKey(masterKey: Uint8Array): void {
    if (!masterKey || !MASTER_KEY_SIZE_BYTES.some(length => length === masterKey.length)) {
      throw new Error(`Мастер-ключ должен быть ${MASTER_KEY_SIZE_BYTES} байт.`);
    }
    const keyExpansion = new KeyExpansion(masterKey)
    const feistelCipher = new FeistelBlockCipher(keyExpansion, NUM_ROUNDS)
    this.setBlockCipher(feistelCipher).setKeyExpansion(keyExpansion)

    this.masterKey_ = masterKey
  }

  /**
   * Шифрует данные.
   * @param {Uint8Array} currentBlock - Открытый текст.
   * @returns {Uint8Array} Промис, разрешающийся зашифрованным текстом.
   * @throws {Error} Если мастер-ключ не установлен или данные пусты.
   */
  encrypt(currentBlock: Uint8Array): Uint8Array {
    if (!this.keyExpansion.roundKeys) {
      throw new Error("Раундовые ключи не установлены.");
    }
    if (!currentBlock || currentBlock.length === 0) {
      throw new Error("Невозможно зашифровать пустые данные.");
    }

    let encryptedBlock: Uint8Array | null = null;

    switch (this.mode) {
      case CipherMode.ECB:
        encryptedBlock = this.blockCipher.encryptBlock(currentBlock, this.keyExpansion.roundKeys)
        break
      case CipherMode.CBC:
        if (!this.iv) throw new Error("Начальный счетчик (IV) необходим для режима CBC.")
        const xoredBlockCBC = xorBytes(currentBlock, this.iv)
        encryptedBlock = this.blockCipher.encryptBlock(xoredBlockCBC, this.keyExpansion.roundKeys)
        this.setIv(encryptedBlock)
        break;
      case CipherMode.PCBC:
        if (!this.iv) throw new Error("Начальный счетчик (IV) необходим для режима PCBC.")
        const xoredBlockPCBC = xorBytes(currentBlock, this.iv)
        encryptedBlock = this.blockCipher.encryptBlock(xoredBlockPCBC, this.keyExpansion.roundKeys)
        this.setIv(xorBytes(currentBlock, encryptedBlock))
        break;
      case CipherMode.CFB:
        if (!this.iv) throw new Error("Начальный счетчик (IV) необходим для режима CFB.")
        const streamCFB = this.blockCipher.encryptBlock(this.iv, this.keyExpansion.roundKeys)
        encryptedBlock = xorBytes(currentBlock, streamCFB)
        this.setIv(encryptedBlock)
        break
      case CipherMode.OFB:
        if (!this.iv) throw new Error("Начальный счетчик (IV) необходим для режима OFB.")
        this.setIv(this.blockCipher.encryptBlock(this.iv, this.keyExpansion.roundKeys))
        encryptedBlock = xorBytes(currentBlock, this.iv)
        break
      case CipherMode.CTR:
        if (!this.iv) throw new Error("Начальный счетчик (IV) необходим для режима CTR.")

        const counterBlock = new Uint8Array(this.blockCipher.getBlockSizeBytes())
        counterBlock.set(this.iv)
        // TODO: Инкремент счетчика (простой пример, в реальном CTR обычно инкремент только части)
        let carry = new DataView(currentBlock.buffer).getUint32(0)
        currentBlock = currentBlock.slice(32)

        for(let k = counterBlock.length - 1; k >= 0 && carry > 0; k--) {
          const sum = counterBlock[k] + carry
          counterBlock[k] = sum & 0xFF
          carry = sum >> 8
        }
        const streamCTR = this.blockCipher.encryptBlock(counterBlock, this.keyExpansion.roundKeys);
        encryptedBlock = xorBytes(currentBlock, streamCTR);
        break;
      case CipherMode["RANDOM_DELTA"]:
        break;
      default:
        throw new Error(`Неподдерживаемый режим шифрования: ${this.mode}`);
    }

    return encryptedBlock as Uint8Array
  }

  /**
   * Дешифрует данные.
   * @param {Uint8Array} currentBlock - Зашифрованный текст.
   * @returns {Uint8Array} Промис, разрешающийся расшифрованным текстом.
   * @throws {Error} Если мастер-ключ не установлен или данные пусты/некорректны.
   */
  decrypt(currentBlock: Uint8Array): Uint8Array {
    if (!this.keyExpansion.roundKeys) {
      throw new Error("Раундовые ключи не установлены.");
    }

    if (!currentBlock || currentBlock.length === 0 || currentBlock.length % this.blockCipher.getBlockSizeBytes() !== 0) {
      throw new Error("Невозможно дешифровать пустые или некорректно выровненные данные.");
    }

    let decryptedBlock: Uint8Array | null = null;

    switch (this.mode) {
      case CipherMode.ECB:
        decryptedBlock = this.blockCipher.decryptBlock(currentBlock, this.keyExpansion.roundKeys);
        break;
      case CipherMode.CBC:
        if (!this.iv) throw new Error("IV необходим для режима CBC.");
        decryptedBlock = this.blockCipher.decryptBlock(currentBlock, this.keyExpansion.roundKeys);
        decryptedBlock = xorBytes(decryptedBlock, this.iv);
        this.setIv(currentBlock);
        break;
      case CipherMode.PCBC:
        if (!this.iv) throw new Error("IV необходим для режима PCBC.");
        decryptedBlock = this.blockCipher.decryptBlock(currentBlock, this.keyExpansion.roundKeys);
        decryptedBlock = xorBytes(decryptedBlock, this.iv);
        this.setIv(xorBytes(decryptedBlock, currentBlock))
        break;
      case CipherMode.CFB:
        if (!this.iv) throw new Error("IV необходим для режима CFB.");
        const streamCFB = this.blockCipher.encryptBlock(this.iv, this.keyExpansion.roundKeys)
        decryptedBlock = xorBytes(currentBlock, streamCFB);
        this.setIv(currentBlock)
        break;
      case CipherMode.OFB:
        if (!this.iv) throw new Error("IV необходим для режима OFB.");
        this.setIv(this.blockCipher.encryptBlock(this.iv, this.keyExpansion.roundKeys))
        decryptedBlock = xorBytes(currentBlock, this.iv);
        break;
      case CipherMode.CTR:
        if (!this.iv) throw new Error("Начальный счетчик (IV) необходим для режима CTR.")
        const counterBlock = new Uint8Array(this.blockCipher.getBlockSizeBytes())
        counterBlock.set(this.iv)

        let carry = new DataView(currentBlock.buffer).getUint32(0)
        currentBlock = currentBlock.slice(32)

        for(let k = counterBlock.length - 1; k >= 0 && carry > 0; k--) {
          const sum = counterBlock[k] + carry
          counterBlock[k] = sum & 0xFF
          carry = sum >> 8
        }
        const streamCTR = this.blockCipher.encryptBlock(counterBlock, this.keyExpansion.roundKeys);
        decryptedBlock = xorBytes(currentBlock, streamCTR);
        break;
      case CipherMode["RANDOM_DELTA"]:
        break;
      default:
        throw new Error(`Неподдерживаемый режим дешифрования: ${this.mode}`);
    }

    return decryptedBlock as Uint8Array;
  }


  /**
   * Шифрует файл (адаптировано для фронтенда).
   * @param {File | Blob} inputFile - Объект File или Blob для шифрования.
   * @returns {Promise<Blob>} Промис, разрешающийся Blob с зашифрованными данными.
   * @throws {Error} Если мастер-ключ не установлен или inputFile некорректен.
   */
  async encryptFile(inputFile: File | Blob): Promise<Blob> {
    if (!(inputFile instanceof File) && !(inputFile instanceof Blob)) {
      throw new Error("Input file must be a File or Blob object.");
    }
    if (!this.masterKey_) {
      throw new Error("Мастер-ключ не установлен. Вызовите setMasterKey перед шифрованием файла.");
    }

    // Читаем файл как ArrayBuffer
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(inputFile);
    })

    const plaintext = new Uint8Array(arrayBuffer as ArrayBuffer);
    const ciphertext = await this.encrypt(plaintext); // Используем уже реализованный метод encrypt

    return new Blob([ciphertext], { type: 'application/octet-stream' });
  }

  /**
   * Дешифрует файл (адаптировано для фронтенда).
   * @param {File | Blob} inputFile - Объект File или Blob для дешифрования.
   * @returns {Promise<Blob>} Промис, разрешающийся Blob с дешифрованными данными.
   * @throws {Error} Если мастер-ключ не установлен или inputFile некорректен.
   */
  async decryptFile(inputFile: File | Blob): Promise<Blob> {
    if (!(inputFile instanceof File) && !(inputFile instanceof Blob)) {
      throw new Error("Input file must be a File or Blob object.");
    }
    if (!this.masterKey_) {
      throw new Error("Мастер-ключ не установлен. Вызовите setMasterKey перед дешифрованием файла.");
    }

    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(inputFile);
    });

    const ciphertext = new Uint8Array(arrayBuffer as ArrayBuffer);
    const plaintext = await this.decrypt(ciphertext); // Используем уже реализованный метод decrypt

    // Тип можно определить по расширению файла, если оно известно,
    // или использовать 'application/octet-stream' по умолчанию.
    return new Blob([plaintext], { type: 'application/octet-stream' });
  }
}