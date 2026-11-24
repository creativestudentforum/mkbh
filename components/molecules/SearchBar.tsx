"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280] group-focus-within:text-[#9ca3af] transition-colors duration-150 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3.5 py-2 bg-[#0e1015] border border-white/10 rounded-lg text-sm text-[#f3f4f6] placeholder-[#555d6e] focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c] hover:border-white/20 transition-colors duration-150"
      />
    </div>
  );
}
