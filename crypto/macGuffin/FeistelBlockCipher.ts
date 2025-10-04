/**
 * @file Реализация блочного шифра на основе структуры Фейстеля.
 * @fileoverview Этот файл содержит класс FeistelBlockCipher, который реализует
 * блочный шифр Фейстеля, используя предоставленные интерфейсы IKeyExpansion и IBlockCipher
 * для раундовой функции F.
 */

import { IBlockCipher } from "@/modules/crypto/common/interfaces/BlockCipher"

import { NUM_ROUNDS } from "@/modules/crypto/common/constants/macGuffin"

import { MacGuffinKey } from "@/modules/crypto/common/types"
import { FFunction } from "@/modules/crypto/macGuffin/FFunction"

/**
 * Класс, реализующий функционал сети Фейстеля на основе предоставленных интерфейсов.
 * Этот класс сам реализует интерфейс IBlockCipher, представляя собой блочный шифр
 * структуры Фейстеля, использующий другой IBlockCipher для раундовой функции F.
 * @augments IBlockCipher
 */
export class FeistelBlockCipher extends IBlockCipher {
    // Реализация интерфейса IKeyExpansion для расширения ключа.
    private stable_: Uint16Array;

    // Реализация интерфейса FFunction, используемая как основа для раундовой функции F, работающая на полублоках.
    private roundFunctionBlockCipher_: FFunction = new FFunction();

    // Количество раундов в сети Фейстеля.
    private numRounds_: number;

    // Размер блока шифра в байтах.
    static blockSizeBytes_: number = FFunction.getBlockSizeBytes() * 2

    /**
     * Конструктор FeistelBlockCipher.
     * @param {Uint16Array} stable - TODO
     * @param {number} numRounds - Количество раундов в сети Фейстеля.
     * @throws {Error} Если keyExpansion или roundFunctionBlockCipher не предоставлены
     * или numRounds некорректно.
     */
    constructor(stable: Uint16Array, numRounds: number) {
        super();
        if (numRounds <= 0) {
            throw new Error("Количество раундов должно быть положительным числом.");
        }

        this.stable_ = stable;
        this.numRounds_ = numRounds;
    }

    /**
     * Возвращает размер блока шифра в байтах.
     * @returns {number} Размер блока в байтах.
     */
    static getBlockSizeBytes(): number {
        return this.blockSizeBytes_;
    }

    // /**
    //  * Основная раундовая функция Фейстеля.
    //  * Вычисляет f(data, roundKey).
    //  * @private
    //  * @param {Uint8Array} halfBlockData - Половина блока, которая будет передана в F-функцию.
    //  * @param {Uint8Array} roundKey - Раундовый ключ для текущего раунда.
    //  * @returns {Uint8Array} Результат F-функции.
    //  */
    // _feistelRoundFunction(halfBlockData: Uint8Array<any>, roundKey: Uint8Array<any>): Uint8Array<any> {
    //     // Здесь используется roundFunctionBlockCipher_ для выполнения F-функции.
    //     // Предполагается, что roundFunctionBlockCipher_ ожидает раундовый ключ в виде массива,
    //     // даже если это единственный ключ для своей собственной операции шифрования.
    //     // Это может потребовать адаптации в зависимости от того, как именно roundFunctionBlockCipher
    //     // обрабатывает свои ключи. В данном случае, передаем его как [roundKey].
    //     return this.roundFunctionBlockCipher_.encryptBlock(halfBlockData, [roundKey]);
    // }

    /**
     * @function encryptBlock
     * @description Шифрует один 64-битный блок данных.
     * @param {Uint8Array} blk 64-битный (8-байтный) блок открытого текста.
     * @param {MacGuffinKey} key Расширенный ключ, сгенерированный mcg_keyset.
     // * @param {Function} f_func F-функция.
     * @returns {Uint8Array} Зашифрованный 64-битный блок.
     */
    public encryptBlock(blk: Uint8Array<any>, key: MacGuffinKey): Uint8Array<any> {
        let [r0, r1, r2, r3] = [
            blk[0] | (blk[1] << 8),
            blk[2] | (blk[3] << 8),
            blk[4] | (blk[5] << 8),
            blk[6] | (blk[7] << 8)]
        let ek = new Uint16Array(key.val)

        for (let i = 0; i < NUM_ROUNDS / 4; i++) {
            // Раунд 1
            let a = r1 ^ ek[i * 12];
            let b = r2 ^ ek[i * 12 + 1];
            let c = r3 ^ ek[i * 12 + 2];
            let F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r0 ^= F;

            // Раунд 2
            a = r2 ^ ek[i * 12 + 3];
            b = r3 ^ ek[i * 12 + 4];
            c = r0 ^ ek[i * 12 + 5];
            F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r1 ^= F;

            // Раунд 3
            a = r3 ^ ek[i * 12 + 6];
            b = r0 ^ ek[i * 12 + 7];
            c = r1 ^ ek[i * 12 + 8];
            F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r2 ^= F;

            // Раунд 4
            a = r0 ^ ek[i * 12 + 9];
            b = r1 ^ ek[i * 12 + 10];
            c = r2 ^ ek[i * 12 + 11];
            F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r3 ^= F;
        }

        const output = new Uint8Array(8);

        output[0] = r0; output[1] = r0 >> 8;
        output[2] = r1; output[3] = r1 >> 8;
        output[4] = r2; output[5] = r2 >> 8;
        output[6] = r3; output[7] = r3 >> 8;

        return output;
    }

    /**
     * @function decryptBlock
     * @description Дешифрует один 64-битный блок зашифрованного текста.
     * @param {Uint8Array} blk 64-битный (8-байтный) блок зашифрованного текста.
     * @param {MacGuffinKey} key Расширенный ключ, сгенерированный mcg_keyset.
     * @returns {Uint8Array} Расшифрованный 64-битный блок.
     */
    public decryptBlock(blk: Uint8Array, key: MacGuffinKey): Uint8Array {
        let [r0, r1, r2, r3] = [
            blk[0] | (blk[1] << 8),
            blk[2] | (blk[3] << 8),
            blk[4] | (blk[5] << 8),
            blk[6] | (blk[7] << 8)];

        let ek = new Uint16Array(key.val);

        for (let i = (NUM_ROUNDS / 4) - 1; i >= 0; i--) {
            // Раунд 4 (в обратном порядке)
            let c = r2 ^ ek[i * 12 + 11];
            let b = r1 ^ ek[i * 12 + 10];
            let a = r0 ^ ek[i * 12 + 9];
            let F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r3 ^= F;

            // Раунд 3 (в обратном порядке)
            c = r1 ^ ek[i * 12 + 8];
            b = r0 ^ ek[i * 12 + 7];
            a = r3 ^ ek[i * 12 + 6];
            F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r2 ^= F;

            // Раунд 2 (в обратном порядке)
            c = r0 ^ ek[i * 12 + 5];
            b = r3 ^ ek[i * 12 + 4];
            a = r2 ^ ek[i * 12 + 3];
            F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r1 ^= F;

            // Раунд 1 (в обратном порядке)
            c = r3 ^ ek[i * 12 + 2];
            b = r2 ^ ek[i * 12 + 1];
            a = r1 ^ ek[i * 12];
            F = this.roundFunctionBlockCipher_.f_optimized(a, b, c, this.stable_);
            r0 ^= F;
        }

        const output = new Uint8Array(8);

        output[0] = r0; output[1] = r0 >> 8;
        output[2] = r1; output[3] = r1 >> 8;
        output[4] = r2; output[5] = r2 >> 8;
        output[6] = r3; output[7] = r3 >> 8;

        return output;
    }
}