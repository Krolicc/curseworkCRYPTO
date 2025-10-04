import { CipherPadding } from "@/modules/crypto/common/types"
import { IBlockCipher } from "@/modules/crypto/common/interfaces/BlockCipher"
import { IKeyExpansion } from "@/modules/crypto/common/interfaces/KeyExpansion"

import { BLOCK_SIZE_BYTES } from "@/modules/crypto/common/constants/macGuffin"
import { CipherMode } from "@/types/state";

/**
 * @class CipherContextBase
 * Базовый класс для контекста шифрования, объединяющего блочный шифр, расширение ключа,
 * режим шифрования и режим набивки.
 * Этот интерфейс предоставляет высокоуровневые методы для шифрования/дешифрования данных.
 */
export class CipherContextBase {
  // Мастер ключ
  private _masterKey: null | Uint8Array<any> = null

  // Реализация блочного шифра.
  private _blockCipher: IBlockCipher = new IBlockCipher();

   // Реализация расширения ключа.
  private _keyExpansion: IKeyExpansion = new IKeyExpansion();

   // Режим шифрования.
  private _mode: CipherMode = CipherMode.ECB;

   // Режим набивки.
  private _padding: CipherPadding = CipherPadding.Zeros;

   // Вектор инициализации (для режимов, которые его используют).
  private _iv: Uint8Array<any> | null = null;

   // Дополнительные параметры (например, для режима CTR).
  private _options: object = {};


  public get masterKey(): IBlockCipher {
    return this._blockCipher;
  }

  public setMasterKey(masterKey: Uint8Array): CipherContextBase | void {
    this._masterKey = masterKey;
    return this;
  }

  public get blockCipher(): IBlockCipher {
    return this._blockCipher;
  }

  public setBlockCipher(blockCipher: IBlockCipher): CipherContextBase {
    this._blockCipher = blockCipher;
    return this;
  }

  public get keyExpansion(): IKeyExpansion {
    return this._keyExpansion;
  }

  public setKeyExpansion(keyExpansion: IKeyExpansion): CipherContextBase {
    this._keyExpansion = keyExpansion;
    return this;
  }

  public get mode(): CipherMode {
    return this._mode;
  }

  public setMode(mode: CipherMode): CipherContextBase {
    this._mode = mode;
    return this;
  }

  public get padding(): CipherPadding {
    return this._padding;
  }

  public setPadding(padding: CipherPadding): CipherContextBase {
    this._padding = padding;
    return this;
  }

  public get iv(): Uint8Array<any> | null {
    return this._iv;
  }

  public setIv(iv: Uint8Array<any> | null): CipherContextBase {
    if (iv && iv.length !== BLOCK_SIZE_BYTES) {
      throw new Error(`Вектор инициализации (IV) должен быть ${BLOCK_SIZE_BYTES} байт для MacGuffin.`);
    }

    this._iv = iv;
    return this;
  }

  public get options(): object {
    return this._options;
  }

  public setOptions(options: object): CipherContextBase {
    this._options = options;
    return this;
  }

  /**
   * Шифрует данные.
   * @param {Uint8Array} currentBlock - Блок открытого текста.
   * @param {Uint8Array | undefined} iv - Начальный вектор.
   * @returns {Uint8Array} Промис, разрешающийся зашифрованным текстом.
   * @throws {Error} Если мастер-ключ не установлен или данные пусты.
   */
  encrypt(currentBlock: Uint8Array, iv: Uint8Array | undefined = undefined): Uint8Array {
    throw new Error("Метод 'encrypt' должен быть реализован.");
  }

  /**
   * Дешифрует данные.
   * @param {Uint8Array} currentBlock - Зашифрованный текст.
   * @param {Uint8Array | undefined} iv - Начальный вектор.
   * @returns {Uint8Array} Промис, разрешающийся расшифрованным текстом.
   * @throws {Error} Если мастер-ключ не установлен или данные пусты.
   */
  decrypt(currentBlock: Uint8Array, iv: Uint8Array | undefined = undefined): Uint8Array {
    throw new Error("Метод 'decrypt' должен быть реализован.");
  }

  /**
   * Шифрует файл (адаптировано для фронтенда).
   * @param {File | Blob} inputFile - Объект File или Blob для шифрования.
   * @returns {Promise<void>} Промис, который разрешается после завершения шифрования.
   * @throws {Error} Если пути к файлам некорректны или мастер-ключ не установлен.
   * @note В браузере прямая работа с файловой системой (пути к файлам) невозможна.
   * Эта функция предназначена для Node.js окружения или как шаблон для работы с File/Blob API.
   */
  encryptFile(inputFile: File | Blob): Promise<Blob> {
    throw new Error("Метод 'encryptFile' должен быть реализован (или адаптирован для браузера).");
  }

  /**
   * Дешифрует файл (адаптировано для фронтенда).
   * @param {File | Blob} inputFile - Объект File или Blob для дешифрования.
   * @returns {Promise<void>} Промис, который разрешается после завершения дешифрования.
   * @throws {Error} Если пути к файлам некорректны или мастер-ключ не установлен.
   * @note В браузере прямая работа с файловой системой (пути к файлам) невозможна.
   * Эта функция предназначена для Node.js окружения или как шаблон для работы с File/Blob API.
   */
  decryptFile(inputFile: File | Blob): Promise<Blob> {
    throw new Error("Метод 'decryptFile' должен быть реализован (или адаптирован для браузера).");
  }

  getBlockSizeBytes(): number {
    throw new Error("Метод 'getBlockSizeBytes' должен быть реализован (или адаптирован для браузера).");
  }

  /**
   * Добавляет набивку к данным.
   * @param {Uint8Array} data - Исходные данные.
   * @returns {Uint8Array} Данные с добавленной набивкой.
   */
  _addPadding(data: Uint8Array<any>): Uint8Array<any> {
    const blockSize: number = this.getBlockSizeBytes()

    let paddingLength = blockSize - (data.length % blockSize);
    if (paddingLength === 0) {
      paddingLength = blockSize; // Если данные кратны размеру блока, добавляем полный блок набивки
    }

    const paddedData = new Uint8Array(data.length + paddingLength);
    paddedData.set(data);

    switch (this._padding) {
      case CipherPadding.Zeros:
        // fill уже делает нули, так что ничего дополнительно не нужно
        break;
      case CipherPadding.ANSIX923:
        paddedData.fill(0, data.length, paddedData.length - 1);
        paddedData[paddedData.length - 1] = paddingLength;
        break;
      case CipherPadding.PKCS7:
        paddedData.fill(paddingLength, data.length);
        break;
      case CipherPadding.ISO10126:
        // Заполняем случайными байтами, последний байт - длина набивки
        for (let i = data.length; i < paddedData.length - 1; i++) {
          paddedData[i] = Math.floor(Math.random() * 256);
        }
        paddedData[paddedData.length - 1] = paddingLength;
        break;
      default:
        throw new Error(`Неизвестный режим набивки: ${this._padding}`);
    }
    return paddedData;
  }

  /**
   * Удаляет набивку из данных.
   * @param {Uint8Array} data - Данные с набивкой.
   * @returns {Uint8Array} Данные без набивки.
   * @throws {Error} Если набивка некорректна.
   */
  _removePadding(data: Uint8Array<any>): Uint8Array<any> {
    const blockSize: number = this.getBlockSizeBytes()

    if (data.length % blockSize !== 0) {
      throw new Error("Длина данных не кратна размеру блока после дешифрования.");
    }

    let paddingLength = 0;
    switch (this._padding) {
      case CipherPadding.Zeros:
        // Для нулей сложно определить точную длину набивки без дополнительной информации.
        // В реальных сценариях ZerosPadding часто используется, когда длина данных известна заранее
        // или когда последние байты НЕ могут быть нулями в исходных данных.
        // Здесь просто удаляем все конечные нули.
        let i = data.length - 1;
        while (i >= 0 && data[i] === 0) {
          paddingLength++;
          i--;
        }
        break;
      case CipherPadding.ANSIX923:
        paddingLength = data[data.length - 1];
        if (paddingLength > blockSize || paddingLength === 0) {
          throw new Error("Некорректная длина набивки ANSIX923.");
        }
        // Проверяем, что остальные байты набивки - нули
        for (let j = 1; j < paddingLength; j++) {
          if (data[data.length - 1 - j] !== 0) {
            throw new Error("Некорректная набивка ANSIX923: не нулевые байты.");
          }
        }
        break;
      case CipherPadding.PKCS7:
        paddingLength = data[data.length - 1];
        if (paddingLength > blockSize || paddingLength === 0) {
          throw new Error("Некорректная длина набивки PKCS7.");
        }
        // Проверяем, что все байты набивки имеют одинаковое значение
        for (let j = 1; j <= paddingLength; j++) {
          if (data[data.length - j] !== paddingLength) {
            throw new Error("Некорректная набивка PKCS7: значения байтов не совпадают с длиной набивки.");
          }
        }
        break;
      case CipherPadding.ISO10126:
        paddingLength = data[data.length - 1];
        if (paddingLength > blockSize || paddingLength === 0) {
          throw new Error("Некорректная длина набивки ISO10126.");
        }
        // Для ISO10126 мы не можем проверить случайные байты, только длину
        break;
      default:
        throw new Error(`Неизвестный режим набивки: ${this._padding}`);
    }

    // Если данных недостаточно для заявленной длины набивки, это ошибка
    if (data.length < paddingLength) {
      throw new Error("Длина данных меньше предполагаемой длины набивки.");
    }

    return data.slice(0, data.length - paddingLength);
  }

  static uploadBlockHeader(blockId: number, date: number, receiver_id: number, data: Uint8Array): Uint8Array {
    const headerBuffer = new ArrayBuffer(16);
    const headerView = new DataView(headerBuffer);

    headerView.setUint32(0, receiver_id, false);
    headerView.setUint32(4, blockId, false);
    headerView.setBigInt64(8, BigInt(date), false);

    const header = new Uint8Array(headerBuffer);

    const combinedBlock = new Uint8Array(header.length + data.length);
    combinedBlock.set(header, 0);
    combinedBlock.set(data, header.length);

    return combinedBlock;
  }
}

