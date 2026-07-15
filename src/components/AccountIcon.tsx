// 账号本子 - 账号图标（favicon + 首字母回退）
import { useState } from 'react';
import { faviconUrl, initials } from '@/lib/utils';

interface Props {
  url: string;
  title: string;
  size?: number;
}

export default function AccountIcon({ url, title, size = 44 }: Props) {
  const [failed, setFailed] = useState(false);
  const fav = url ? faviconUrl(url) : '';

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cream/10 bg-ink-700/60"
      style={{ width: size, height: size }}
    >
      {fav && !failed ? (
        <img
          src={fav}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className="font-serif font-semibold text-amber-400"
          style={{ fontSize: size * 0.42 }}
        >
          {initials(title)}
        </span>
      )}
    </div>
  );
}
