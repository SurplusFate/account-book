// 账号本子 - 密码强度指示条
import { passwordStrength } from '@/lib/utils';

const COLORS = ['bg-danger', 'bg-danger', 'bg-amber-600', 'bg-amber-500', 'bg-success'];

export default function StrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              i < score ? COLORS[score] : 'bg-cream/10'
            }`}
          />
        ))}
      </div>
      <span className="w-12 text-right text-xs text-cream-dim">{label}</span>
    </div>
  );
}
