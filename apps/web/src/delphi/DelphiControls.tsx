import type { KeyboardEvent } from "react";

export function DelphiNumber({ label, value, onChange, suffix, min, max, step = "any" }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; min?: number; max?: number; step?: number | "any" }) {
  return <label className="delphi-number"><span>{label}</span><span className="delphi-number-input"><input type="number" value={Number.isFinite(value) ? value : ""} min={min} max={max} step={step} onChange={event => onChange(event.currentTarget.valueAsNumber)} />{suffix ? <span>{suffix}</span> : null}</span></label>;
}

export function DelphiTabs<T extends string>({ label, value, options, onChange, panelId, compact = false }: { label: string; value: T; options: { value: T; label: string; disabled?: boolean; reason?: string }[]; onChange: (value: T) => void; panelId: string; compact?: boolean }) {
  function navigate(event: KeyboardEvent<HTMLButtonElement>, current: T) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const available = options.filter(option => !option.disabled), index = available.findIndex(option => option.value === current);
    const next = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + available.length) % available.length;
    onChange(available[next].value);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    buttons?.[next]?.focus();
  }
  return <div className={compact ? "delphi-segments" : "delphi-tabs"} role="tablist" aria-label={label}>{options.map(option => <button type="button" role="tab" aria-selected={value === option.value} aria-controls={panelId} tabIndex={value === option.value ? 0 : -1} disabled={option.disabled} title={option.reason} key={option.value} onKeyDown={event => navigate(event, option.value)} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}
