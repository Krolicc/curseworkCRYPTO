/**
 * Перечисление режимов набивки (padding).
 * @enum {string}
 */
export enum CipherPadding {
  "Zeros" = "Zeros",
  "ANSIX923" = "ANSIX923",
  "PKCS7" = "PKCS7",
  "ISO10126" = "ISO10126",
}

/**
 * Расширенный ключ.
 */
export type MacGuffinKey = {
  val: Uint16Array;
};