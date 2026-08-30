"use client";

export function TextQuestion({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={6}
      autoFocus
      className="input min-h-[160px] resize-none text-base leading-relaxed"
    />
  );
}
