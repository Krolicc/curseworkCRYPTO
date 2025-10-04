/**
 * @file Реализация KDF (Key Derivation Function) для фронтенда с использованием PBKDF2.
 * @fileoverview Этот файл предоставляет функцию для вывода криптографических ключей из паролей
 * или других секретных значений с использованием PBKDF2 и Web Crypto API.
 */

// PBKDF2 (Password-Based Key Derivation Function 2) - это функция вывода ключей,
// которая является частью PKCS #5 v2.0. Она используется для уменьшения уязвимости
// криптографических ключей к атакам методом грубой силы, увеличивая время,
// необходимое для выполнения каждого вычисления ключа.
// PBKDF2 использует псевдослучайную функцию (обычно HMAC) для итеративного вычисления
// ключей, а также "соль" для защиты от атак по радужным таблицам.

/**
 * Выводит криптографический ключ из пароля или другого секретного значения с использованием PBKDF2.
 *
 * @param {string | Uint8Array | ArrayBuffer} password - Пароль или исходное секретное значение.
 * Может быть строкой, Uint8Array или ArrayBuffer.
 * @param {Uint8Array} salt - Криптографически случайная "соль". Должна быть уникальной для каждого вывода ключа.
 * Рекомендуется использовать соль длиной не менее 16 байт (128 бит).
 * @param {number} iterations - Количество итераций. Чем больше, тем безопаснее, но медленнее.
 * Рекомендуется от 100,000 до миллиона для паролей, в зависимости от целевой платформы и угроз.
 * @param {number} keyLengthBits - Желаемая длина выведенного ключа в битах (например, 256 для AES-256).
 * @param {string} hashAlgorithm - Хеш-алгоритм для использования внутри PBKDF2 (например, 'SHA-256', 'SHA-384', 'SHA-512').
 * @returns {Promise<CryptoKey>} Promise, который разрешается с объектом CryptoKey.
 * @throws {Error} Если Web Crypto API недоступен или параметры некорректны.
 */
export default async function deriveKeyPBKDF2(password, salt, iterations, keyLengthBits, hashAlgorithm) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Ваш браузер не поддерживает Web Crypto API.");
    }
    if (!(salt instanceof Uint8Array)) {
        throw new Error("Параметр 'salt' должен быть Uint8Array.");
    }
    if (iterations <= 0) {
        throw new Error("Количество итераций должно быть положительным числом.");
    }
    if (keyLengthBits <= 0 || keyLengthBits % 8 !== 0) {
        throw new Error("Длина ключа должна быть положительным числом, кратным 8.");
    }

    let passwordBuffer;
    if (typeof password === 'string') {
        const encoder = new TextEncoder();
        passwordBuffer = encoder.encode(password);
    } else if (password instanceof Uint8Array || password instanceof ArrayBuffer) {
        passwordBuffer = password;
    } else {
        throw new Error("Пароль должен быть строкой, Uint8Array или ArrayBuffer.");
    }

    try {
        // Импортируем пароль как "сырой" ключ, который будет использоваться в качестве базового ключа для PBKDF2
        const baseKey = await window.crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            { name: "PBKDF2" }, // Указываем, что этот ключ будет использоваться с PBKDF2
            false,              // Неэкспортируемый
            ["deriveKey", "deriveBits"] // Разрешаем использование для вывода ключей или бит
        );

        // Определяем параметры для PBKDF2
        const pbkdf2Params = {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: { name: hashAlgorithm },
        };

        // Определяем параметры для выходного ключа (например, для AES-GCM)
        const derivedKeyAlgorithm = {
            name: "AES-GCM", // Или "HMAC", "AES-CBC" и т.д.
            length: keyLengthBits,
        };

        // Использование "deriveKey" для получения CryptoKey
        const derivedKey = await window.crypto.subtle.deriveKey(
            pbkdf2Params,
            baseKey,
            derivedKeyAlgorithm,
            true, // Экспортируемый (чтобы можно было его использовать для шифрования/дешифрования)
            ["encrypt", "decrypt"] // Или "sign", "verify" и т.д. в зависимости от derivedKeyAlgorithm
        );

        // Если вам нужны сырые биты ключа (Uint8Array), а не CryptoKey,
        // используйте deriveBits:
        /*
        const derivedBitsBuffer = await window.crypto.subtle.deriveBits(
            pbkdf2Params,
            baseKey,
            keyLengthBits // Длина бит, которые нужно вывести
        );
        return new Uint8Array(derivedBitsBuffer);
        */

        return derivedKey;

    } catch (e) {
        console.error("Ошибка при выводе ключа PBKDF2:", e);
        throw new Error("Не удалось вывести ключ с помощью PBKDF2: " + e.message);
    }
}

/**
 * Генерирует криптографически стойкую случайную "соль".
 * @param {number} [lengthBytes=16] - Длина соли в байтах (рекомендуется 16 байт = 128 бит).
 * @returns {Uint8Array} Случайная соль.
 * @throws {Error} Если Web Crypto API недоступен.
 */
function generateSalt(lengthBytes = 16) {
    if (!window.crypto || !window.crypto.getRandomValues) {
        throw new Error("Ваш браузер не поддерживает криптографически стойкий генератор случайных чисел (Web Crypto API).");
    }
    const salt = new Uint8Array(lengthBytes);
    window.crypto.getRandomValues(salt);
    return salt;
}