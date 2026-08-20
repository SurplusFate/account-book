import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

const STORAGE_KEY = 'ab_biometric_pwd';
const SETTING_KEY = 'ab_biometric_enabled';

export async function isBiometricAvailable(): Promise<{
  available: boolean;
  type: BiometryType;
  reason?: string;
}> {
  try {
    const info = await BiometricAuth.checkBiometry();
    return {
      available: info.isAvailable,
      type: info.biometryType,
      reason: info.reason || undefined,
    };
  } catch (e) {
    return { available: false, type: BiometryType.none, reason: String(e) };
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  const v = localStorage.getItem(SETTING_KEY);
  const encPwd = localStorage.getItem(STORAGE_KEY);
  return v === '1' && !!encPwd;
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    localStorage.setItem(SETTING_KEY, '1');
  } else {
    localStorage.removeItem(SETTING_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function authenticateWithBiometry(reason: string = '验证身份'): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({ reason });
    return true;
  } catch {
    return false;
  }
}

export async function storePasswordWithBiometry(password: string): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({ reason: '启用指纹解锁' });
    const enc = btoa(unescape(encodeURIComponent(password)));
    localStorage.setItem(STORAGE_KEY, enc);
    localStorage.setItem(SETTING_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export async function retrievePasswordWithBiometry(): Promise<string | null> {
  const enc = localStorage.getItem(STORAGE_KEY);
  if (!enc) return null;
  try {
    const ok = await authenticateWithBiometry('使用指纹解锁账号本子');
    if (!ok) return null;
    return decodeURIComponent(escape(atob(enc)));
  } catch {
    return null;
  }
}
