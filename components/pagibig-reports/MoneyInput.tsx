"use client";

import { inputClass, labelClass } from "./constants";

export function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <input
        required
        type="number"
        min="0"
        max="999999999.99"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}
