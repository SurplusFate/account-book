// 账号本子 - 加密层（Web Crypto API: PBKDF2 + AES-GCM）
// 全部依赖浏览器原生实现，无第三方库，密钥永不离开内存

const PBKDF2_ITERATIONS = 150000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes (AES-GCM 推荐 12 字节)
const KEY_LENGTH = 256; // bits

const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------- Base64 与二进制互转 ----------
export function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

// ---------- 密钥派生 ----------
/** 用主密码 + 盐派生 256 位 AES-GCM 密钥 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------- 加密 / 解密 ----------
/** 用密钥加密任意对象，返回密文与 IV（均为 Base64） */
export async function encryptJSON(
  key: CryptoKey,
  data: unknown,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = randomBytes(IV_LENGTH);
  const plaintext = enc.encode(JSON.stringify(data));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  return { ciphertext: bufToBase64(cipherBuf), iv: bufToBase64(iv) };
}

/** 解密并返回解析后的对象 */
export async function decryptJSON<T = unknown>(
  key: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<T> {
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuf(iv) as BufferSource },
    key,
    base64ToBuf(ciphertext) as BufferSource,
  );
  return JSON.parse(dec.decode(plainBuf)) as T;
}

// ---------- 验证块 ----------
const VERIFIER_PLAINTEXT = 'account-book-verifier-v1';

/** 创建验证块：用主密钥加密固定明文 */
export async function createVerifier(
  key: CryptoKey,
): Promise<{ verifier: string; verifierIv: string }> {
  const { ciphertext, iv } = await encryptJSON(key, VERIFIER_PLAINTEXT);
  return { verifier: ciphertext, verifierIv: iv };
}

/** 校验主密码：解密验证块并比对 */
export async function verifyKey(
  key: CryptoKey,
  verifier: string,
  verifierIv: string,
): Promise<boolean> {
  try {
    const result = await decryptJSON<string>(key, verifier, verifierIv);
    return result === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}

// ---------- 一次性初始化新保险库的加密产物 ----------
export async function initEncryptedVault(password: string): Promise<{
  encrypted: Pick<
    import('@/types').EncryptedVault,
    'salt' | 'verifier' | 'verifierIv' | 'iterations'
  >;
  key: CryptoKey;
}> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);
  const { verifier, verifierIv } = await createVerifier(key);
  return {
    encrypted: {
      salt: bufToBase64(salt),
      verifier,
      verifierIv,
      iterations: PBKDF2_ITERATIONS,
    },
    key,
  };
}

/** 用已有盐与迭代次数尝试派生密钥并校验 */
export async function unlockWithPassword(
  password: string,
  saltB64: string,
  iterations: number,
  verifier: string,
  verifierIv: string,
): Promise<CryptoKey | null> {
  const salt = base64ToBuf(saltB64);
  const key = await deriveKey(password, salt, iterations);
  const ok = await verifyKey(key, verifier, verifierIv);
  return ok ? key : null;
}

export { PBKDF2_ITERATIONS };
