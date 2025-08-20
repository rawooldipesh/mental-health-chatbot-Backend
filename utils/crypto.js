// utils/crypto.js
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const MASTER_KEY_HEX = process.env.MASTER_KEY;
if (!MASTER_KEY_HEX || MASTER_KEY_HEX.length !== 64) {
  console.warn("MASTER_KEY missing or not 32-byte hex. Encryption will fail.");
}
const MASTER_KEY = MASTER_KEY_HEX ? Buffer.from(MASTER_KEY_HEX, "hex") : null;

export function genUserKey() {
  return crypto.randomBytes(32); // raw key buffer
}

// Encrypt arbitrary text with a given raw key (Buffer)
export function encryptText(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    data: enc.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptText(encObj, key) {
  const iv = Buffer.from(encObj.iv, "base64");
  const data = Buffer.from(encObj.data, "base64");
  const tag = Buffer.from(encObj.tag, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

// Wrap/unwrap the per-user key using the MASTER_KEY (Key Encryption Key)
export function wrapUserKey(userKeyBuf) {
  if (!MASTER_KEY) throw new Error("MASTER_KEY not set");
  return encryptText(userKeyBuf.toString("base64"), MASTER_KEY);
}

export function unwrapUserKey(wrapped) {
  if (!MASTER_KEY) throw new Error("MASTER_KEY not set");
  const b64 = decryptText(wrapped, MASTER_KEY);
  return Buffer.from(b64, "base64");
}
