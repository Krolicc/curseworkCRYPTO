/**
 * Reverses the bits of a single byte.
 * @param {number} byte - The byte to reverse (0-255).
 * @returns {number} The byte with its bits reversed.
 */
export function reverseByteBits(byte: number): number {
    let reversedByte = 0;
    for (let i = 0; i < 8; ++i) {
        if ((byte >> i) & 1) {
            reversedByte |= (1 << (7 - i));
        }
    }
    return reversedByte;
}

/**
 * Gets the value of a specific bit from a byte array.
 * @param {Uint8Array} data - The array of bytes.
 * @param {number} bitIndex - The 0-based index of the bit to get.
 * @param {boolean} lsbFirst - True if bits are indexed from least significant to most significant within a byte.
 * @returns {number} The value of the bit (0 or 1).
 * @throws {Error} If bitIndex is out of bounds.
 */
export function getBit(data: Uint8Array<any>, bitIndex: number, lsbFirst: boolean): number {
    const byteIndex = Math.floor(bitIndex / 8);
    let bitPosInByte = bitIndex % 8;

    if (byteIndex < 0 || byteIndex >= data.length) {
        throw new Error("Bit index out of bounds: byte index " + byteIndex);
    }

    const byte = data[byteIndex];
    let bit;

    if (lsbFirst) {
        // LSB first: 0 is rightmost bit, 7 is leftmost bit
        bit = (byte >> bitPosInByte) & 1;
    } else {
        // MSB first: 0 is leftmost bit, 7 is rightmost bit
        bit = (byte >> (7 - bitPosInByte)) & 1;
    }
    return bit;
}

/**
 * Sets a specific bit in a byte array to a given value.
 * Modifies the data array in place.
 * @param {Uint8Array} data - The array of bytes.
 * @param {number} bitIndex - The 0-based index of the bit to set.
 * @param {number} value - The value to set the bit to (0 or 1).
 * @param {boolean} lsbFirst - True if bits are indexed from least significant to most significant within a byte.
 * @throws {Error} If bitIndex is out of bounds or value is not 0 or 1.
 */
export function setBit(data: Uint8Array<any>, bitIndex: number, value: number, lsbFirst: boolean): void {
    const byteIndex = Math.floor(bitIndex / 8);
    let bitPosInByte = bitIndex % 8;

    if (byteIndex < 0 || byteIndex >= data.length) {
        throw new Error("Bit index out of bounds: byte index " + byteIndex);
    }
    if (value !== 0 && value !== 1) {
        throw new Error("Bit value must be 0 or 1.");
    }

    let byte = data[byteIndex];

    if (lsbFirst) {
        // LSB first: 0 is rightmost bit, 7 is leftmost bit
        if (value === 1) {
            byte |= (1 << bitPosInByte);
        } else {
            byte &= ~(1 << bitPosInByte);
        }
    } else {
        // MSB first: 0 is leftmost bit, 7 is rightmost bit
        if (value === 1) {
            byte |= (1 << (7 - bitPosInByte));
        } else {
            byte &= ~(1 << (7 - bitPosInByte));
        }
    }
    data[byteIndex] = byte;
}

/**
 * Performs a bit permutation on an input array of bytes.
 * @param {Uint8Array} inputData - The input array of bytes.
 * @param {number[]} permutationTable - An array of 0-based bit indices defining the permutation.
 * The length of this table determines the output bit length.
 * @param {boolean} lsbFirstInput - True if input bits are read LSB first within bytes.
 * @param {boolean} lsbFirstOutput - True if output bits are written LSB first within bytes.
 * @returns {Uint8Array} A new Uint8Array containing the permuted bits.
 */
export function permuteBits(inputData: Uint8Array<any>, permutationTable: number[], lsbFirstInput: boolean, lsbFirstOutput: boolean): Uint8Array<any> {
    const outputBitLength = permutationTable.length;
    const outputByteLength = Math.ceil(outputBitLength / 8);
    const outputData = new Uint8Array(outputByteLength).fill(0); // Initialize with zeros

    for (let i = 0; i < outputBitLength; ++i) {
        const inputBitIndex = permutationTable[i] - 1; // Convert 1-based table to 0-based index

        if (inputBitIndex < 0 || inputBitIndex >= inputData.length * 8) {
            throw new Error(`Permutation table index out of bounds: ${inputBitIndex} at output bit ${i}`);
        }

        const bitValue = getBit(inputData, inputBitIndex, lsbFirstInput);
        setBit(outputData, i, bitValue, lsbFirstOutput);
    }
    return outputData;
}


// Optional: Helper for printing bytes in binary (MSB-first) for debugging, similar to C++ example
export function printBytesBinary(data: any): void {
    let binaryString = "";
    for (const byte of data) {
        binaryString += byte.toString(2).padStart(8, '0') + " ";
    }
    console.log(binaryString.trim());
}

// Optional: Helper for printing bytes in hex
export function printBytesHex(data: any): void {
    let hexString = "";
    for (const byte of data) {
        hexString += byte.toString(16).padStart(2, '0') + " ";
    }
    console.log(hexString.trim());
}

/**
 * Выполняет XOR двух Uint8Array поэлементно.
 * @param {Uint8Array} a - Первый массив.
 * @param {Uint8Array} b - Второй массив.
 * @returns {Uint8Array} Новый массив, содержащий результат XOR.
 * @throws {Error} Если массивы имеют разную длину.
 */
export function xorBytes(a: Uint8Array<any>, b: Uint8Array<any>): Uint8Array<any> {
    if (a.length !== b.length) {
        throw new Error("Массивы для XOR должны быть одинаковой длины.");
    }
    const result = new Uint8Array(a.length);
    for (let i = 0; i < a.length; ++i) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

/**
 * Выполняет цикличесий битовый сдвиг.
 * @param {ArrayBuffer} startBuffer - Массив байтов.
 * @param {number} offset - Сдвиг.
 * @returns {Uint8Array} Новый массив, содержащий результат циклического сдвига.
 */
export function cycleOffset(startBuffer: ArrayBuffer, offset: number): Uint8Array<any> {
    let buffer = new Uint8Array(new ArrayBuffer(startBuffer.byteLength));
    let start: ArrayBuffer
    let end: ArrayBuffer

    if (offset < 0) {
        start = startBuffer.slice(startBuffer.byteLength - offset, startBuffer.byteLength);
        end = startBuffer.slice(0, startBuffer.byteLength - offset);
    } else {
        start = startBuffer.slice(0, offset);
        end = startBuffer.slice(offset, startBuffer.byteLength);
    }

    buffer.set(new Uint8Array(start), 0)
    buffer.set(new Uint8Array(end), 0)

    return buffer;
}

export function bytesToWords(bytes: Uint8Array): number[] {
    const words = [];
    for (let i = 0; i < bytes.length; i += 4) {
        words.push(
          (bytes[i] << 24) |
          (bytes[i + 1] << 16) |
          (bytes[i + 2] << 8) |
          bytes[i + 3]
        );
    }
    return words;
}

export function wordsToBytes(words: number[]): Uint8Array {
    const bytes = new Uint8Array(words.length * 4);
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        bytes[i * 4] = (word >> 24) & 0xFF;
        bytes[i * 4 + 1] = (word >> 16) & 0xFF;
        bytes[i * 4 + 2] = (word >> 8) & 0xFF;
        bytes[i * 4 + 3] = word & 0xFF;
    }
    return bytes;
}

export function rot(n: number, bits: number): number {
    const value = n >>> 0;
    if (bits > 0) {
        return (value << bits) | (value >>> (32 - bits));
    } else {
        return (value >>> -bits) | (value << (32 + bits));
    }
}