import { useState, useRef, useEffect } from 'react';

interface Props {
  placeholder?: string;
  onSearch: (keyword: string) => void;
}

export function SearchBar({ placeholder = '搜索', onSearch }: Props) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = (v: string) => {
    setValue(v);
    // 防抖 300ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(v.trim());
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/80 border border-gray-200 rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-wechat-green placeholder-gray-400"
        />
      </div>
    </div>
  );
}
