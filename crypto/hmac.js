/**
 * @file Реализация HMAC (Hash-based Message Authentication Code) для фронтенда.
 * @fileoverview Этот файл предоставляет функцию для вычисления HMAC, используя Web Crypto API.
 */

// HMAC (Hash-based Message Authentication Code) - это специфический тип кода
// аутентификации сообщений (MAC), включающий криптографическую хеш-функцию
// и секретный криптографический ключ. Как и любой MAC, HMAC может использоваться
// для одновременной проверки целостности данных и подлинности сообщения.

/**
 * Вычисляет HMAC для заданного сообщения и ключа, используя указанный алгоритм хеширования.
 *
 * @param {CryptoKey} key - Криптографический ключ для HMAC (должен быть в формате 'raw' или 'secret').
 * Этот ключ должен быть экспортирован как Uint8Array для внутренних операций.
 * @param {string | Uint8Array | ArrayBuffer} message - Сообщение, для которого вычисляется HMAC.
 * Может быть строкой, Uint8Array или ArrayBuffer.
 * @param {string} [hashAlgorithm='SHA-256'] - Название хеш-алгоритма для использования (например, 'SHA-256', 'SHA-384', 'SHA-512').
 * Должен поддерживаться Web Crypto API.
 * @returns {Promise<Uint8Array>} Promise, который разрешается с HMAC в виде Uint8Array.
 * @throws {Error} Если Web Crypto API недоступен или параметры некорректны.
 */
async function computeHMAC(key, message, hashAlgorithm = 'SHA-256') {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Ваш браузер не поддерживает Web Crypto API.");
    }
    if (!(key instanceof CryptoKey)) {
        throw new Error("Параметр 'key' должен быть объектом CryptoKey.");
    }

    let msgBuffer;
    if (typeof message === 'string') {
        const encoder = new TextEncoder();
        msgBuffer = encoder.encode(message);
    } else if (message instanceof Uint8Array || message instanceof ArrayBuffer) {
        msgBuffer = message;
    } else {
        throw new Error("Сообщение должно быть строкой, Uint8Array или ArrayBuffer.");
    }

    try {
        // 'hmac' - это объект, который Web Crypto API понимает как алгоритм HMAC.
        // Он требует указания хеш-алгоритма, который будет использоваться внутри.
        const hmacBuffer = await window.crypto.subtle.sign(
            {
                name: "HMAC",
                hash: { name: hashAlgorithm },
            },
            key,        // Ваш импортированный ключ CryptoKey
            msgBuffer   // Сообщение в виде ArrayBuffer/Uint8Array
        );

        return new Uint8Array(hmacBuffer);
    } catch (e) {
        console.error("Ошибка при вычислении HMAC:", e);
        throw new Error("Не удалось вычислить HMAC: " + e.message);
    }
}

/**
 * Генерирует или импортирует ключ для HMAC.
 * @param {string} [hashAlgorithm='SHA-256'] - Алгоритм хеширования, для которого предназначен ключ.
 * @param {string | Uint8Array} [rawKey] - Необязательный "сырой" ключ в виде строки или Uint8Array.
 * Если не предоставлен, будет сгенерирован новый случайный ключ.
 * @param {number} [keyLength] - Желаемая длина ключа в битах, если генерируется новый ключ.
 * Для HMAC-SHA256 рекомендуется 256 бит.
 * @returns {Promise<CryptoKey>} Promise, который разрешается с объектом CryptoKey.
 */
async function generateOrImportHMACKey(hashAlgorithm = 'SHA-256', rawKey = null, keyLength = 256) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Ваш браузер не поддерживает Web Crypto API.");
    }

    const keyAlgorithm = {
        name: "HMAC",
        hash: { name: hashAlgorithm },
        length: keyLength // Длина ключа в битах
    };

    const usages = ["sign", "verify"]; // Ключ будет использоваться для подписи и проверки

    if (rawKey) {
        // Импортируем существующий ключ
        let keyBuffer;
        if (typeof rawKey === 'string') {
            const encoder = new TextEncoder();
            keyBuffer = encoder.encode(rawKey);
        } else if (rawKey instanceof Uint8Array) {
            keyBuffer = rawKey;
        } else {
            throw new Error("RawKey должен быть строкой или Uint8Array.");
        }

        return await window.crypto.subtle.importKey(
            "raw",          // Формат ключа (сырые байты)
            keyBuffer,      // Байты ключа
            keyAlgorithm,   // Алгоритм для использования с этим ключом
            false,          // Неэкспортируемый (можно установить true, если нужно экспортировать)
            usages          // Назначение ключа
        );
    } else {
        // Генерируем новый случайный ключ
        return await window.crypto.subtle.generateKey(
            keyAlgorithm,
            true, // Экспортируемый (чтобы можно было его сохранить или передать)
            usages
        );
    }
}