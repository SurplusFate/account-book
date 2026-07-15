// 账号本子 - 密码生成器
import { useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import {
  generatePassword,
  passwordStrength,
  DEFAULT_GEN_OPTIONS,
  type GeneratorOptions,
} from '@/lib/utils';
import StrengthMeter from '@/components/StrengthMeter';

interface Props {
  onUse: (password: string) => void;
}

export default function PasswordGenerator({ onUse }: Props) {
  const [opts, setOpts] = useState<GeneratorOptions>(DEFAULT_GEN_OPTIONS);
  const [generated, setGenerated] = useState(() =>
    generatePassword(DEFAULT_GEN_OPTIONS),
  );

  function regen(next?: GeneratorOptions) {
    const o = next ?? opts;
    setGenerated(generatePassword(o));
  }

  function update<K extends keyof GeneratorOptions>(
    key: K,
    value: GeneratorOptions[K],
  ) {
    const next = { ...opts, [key]: value };
    setOpts(next);
    regen(next);
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-serif text-sm font-semibold text-cream">密码生成器</h4>
        <button
          onClick={() => regen()}
          className="flex items-center gap-1.5 text-xs text-amber-400 transition-colors hover:text-amber-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重新生成
        </button>
      </div>

      {/* 生成的密码展示 */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-ink-900/60 px-4 py-3">
        <code className="flex-1 break-all font-mono text-sm text-amber-100">
          {generated}
        </code>
        <button
          onClick={() => onUse(generated)}
          className="shrink-0 rounded-lg bg-amber-500/15 p-2 text-amber-400 transition-colors hover:bg-amber-500/25"
          title="使用此密码"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-4">
        <StrengthMeter password={generated} />
      </div>

      {/* 长度滑块 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-cream-dim">长度</span>
          <span className="font-mono text-amber-400">{opts.length}</span>
        </div>
        <input
          type="range"
          min={6}
          max={40}
          value={opts.length}
          onChange={(e) => update('length', Number(e.target.value))}
          className="w-full accent-amber-500"
        />
      </div>

      {/* 字符类型开关 */}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['upper', '大写 A-Z'],
            ['lower', '小写 a-z'],
            ['digit', '数字 0-9'],
            ['symbol', '符号 !@#'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => update(key, !opts[key])}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
              opts[key]
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                : 'border-cream/10 bg-white/[0.02] text-cream-dim'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                opts[key]
                  ? 'border-amber-500 bg-amber-500 text-ink-950'
                  : 'border-cream/20'
              }`}
            >
              {opts[key] && <Check className="h-3 w-3" />}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
