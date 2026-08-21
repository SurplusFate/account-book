// 账号本子 - 解锁页（首次设置 / 解锁）
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookKey, Eye, EyeOff, ShieldCheck, Loader2, Fingerprint } from 'lucide-react';
import { useStore } from '@/store';
import StrengthMeter from '@/components/StrengthMeter';
import { passwordStrength } from '@/lib/utils';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  retrievePasswordWithBiometry,
  storePasswordWithBiometry,
  biometricLabel,
} from '@/lib/biometric';
import { BiometryType } from '@aparajita/capacitor-biometric-auth';

export default function Unlock() {
  const initialized = useStore((s) => s.initialized);
  const createVault = useStore((s) => s.createVault);
  const unlock = useStore((s) => s.unlock);
  const error = useStore((s) => s.error);
  const loading = useStore((s) => s.loading);
  const navigate = useNavigate();

  const isSetup = !initialized;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [offerEnableBio, setOfferEnableBio] = useState(false);
  const [bioType, setBioType] = useState<BiometryType>(BiometryType.none);
  // 防止自动生物识别验证在一次会话内被重复触发
  const autoTriedRef = useRef(false);
  // 设备实际支持的生物识别类型对应的展示名（指纹 / 面容 / 虹膜）
  const bioName = biometricLabel(bioType);

  const strength = passwordStrength(password);

  useEffect(() => {
    void (async () => {
      const info = await isBiometricAvailable();
      setBioAvailable(info.available);
      if (!info.available) return;
      setBioType(info.type);
      const enabled = await isBiometricEnabled();
      setBioEnabled(enabled);
      // 已初始化（非首次设置）且启用生物识别，进入页面自动触发一次验证
      if (enabled && initialized && !autoTriedRef.current) {
        autoTriedRef.current = true;
        await handleBioUnlock();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (isSetup) {
      if (password.length < 6) {
        setLocalError('主密码至少需要 6 位');
        return;
      }
      if (password !== confirm) {
        setLocalError('两次输入的主密码不一致');
        return;
      }
      if (strength.score < 2) {
        setLocalError('主密码强度过低，建议包含大小写字母、数字与符号');
        return;
      }
      const ok = await createVault(password);
      if (ok) {
        if (bioAvailable && !bioEnabled) setOfferEnableBio(true);
        else navigate('/');
      }
    } else {
      const ok = await unlock(password);
      if (ok) {
        if (bioAvailable && !bioEnabled) setOfferEnableBio(true);
        else navigate('/');
      }
    }
  }

  async function handleEnableBio() {
    setBioLoading(true);
    setLocalError(null);
    const ok = await storePasswordWithBiometry(password || confirm);
    setBioLoading(false);
    if (ok) {
      setBioEnabled(true);
      setOfferEnableBio(false);
      navigate('/');
    } else {
      setOfferEnableBio(false);
      navigate('/');
    }
  }

  async function handleBioUnlock() {
    setBioLoading(true);
    setLocalError(null);
    try {
      const pwd = await retrievePasswordWithBiometry();
      if (pwd) {
        const ok = await unlock(pwd);
        if (ok) {
          navigate('/');
          return;
        }
        setLocalError('密码错误，请重新输入主密码');
      }
    } finally {
      setBioLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      }}
    >
      {/* 装饰光晕 */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: 'var(--accent-soft)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: 'color-mix(in srgb, var(--success) 5%, transparent)' }}
      />

      <div className="relative w-full max-w-md animate-rise">
        {/* 品牌标识 */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-glow">
            <BookKey className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-cream">
            账号本子
          </h1>
          <p className="mt-1.5 text-sm text-cream-dim">
            {isSetup ? '设置主密码，开启加密保管' : '输入主密码解锁保险库'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-7">
          <div className="mb-5">
            <label className="label">主密码</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder={isSetup ? '设置一个强主密码' : '输入主密码'}
                className="input pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-dim transition-colors hover:text-cream"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {isSetup && password && (
              <div className="mt-2.5">
                <StrengthMeter password={password} />
              </div>
            )}
          </div>

          {isSetup && (
            <div className="mb-5 animate-fade-in">
              <label className="label">确认主密码</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次输入主密码"
                className="input"
              />
            </div>
          )}

          {(localError || error) && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger animate-fade-in">
              {localError || error}
            </div>
          )}

          <button type="submit" disabled={loading || bioLoading} className="btn-primary w-full">
            {loading || bioLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSetup ? (
              '创建保险库'
            ) : (
              '解锁'
            )}
          </button>

          {!isSetup && bioAvailable && bioEnabled && (
            <button
              type="button"
              onClick={handleBioUnlock}
              disabled={loading || bioLoading}
              className="btn-ghost mt-3 w-full flex items-center justify-center gap-2"
            >
              <Fingerprint className="h-4.5 w-4.5" />
              使用{bioName}解锁
            </button>
          )}

          {offerEnableBio && (
            <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <Fingerprint className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-cream mb-1">是否启用{bioName}解锁？</p>
                  <p className="text-cream-dim mb-3">下次打开可直接通过{bioName}解锁，无需输入主密码。</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleEnableBio}
                      disabled={bioLoading}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      {bioLoading ? '验证中…' : '启用'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOfferEnableBio(false); navigate('/'); }}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      暂不启用
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSetup && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-white/[0.02] p-3 text-xs text-cream-dim">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p>
                主密码用于加密所有账号数据，<strong className="text-cream-muted">一旦遗忘将无法找回</strong>。
                数据仅加密保存在本地与你的坚果云，无人可见明文。
              </p>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-cream-dim/70">
          端到端加密 · WebDAV 云同步 · 永久免费
        </p>
      </div>
    </div>
  );
}
