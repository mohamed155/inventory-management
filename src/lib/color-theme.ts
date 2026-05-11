import type { ColorToken } from '@/store/settings.store';

type ColorValues = { primary: string; primaryForeground: string };

const COLOR_MAP: Record<ColorToken, ColorValues> = {
  violet: {
    primary: 'oklch(0.487 0.226 289.594)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  blue: {
    primary: 'oklch(0.546 0.245 262.88)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  green: {
    primary: 'oklch(0.527 0.154 150.07)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  orange: {
    primary: 'oklch(0.705 0.191 47.72)',
    primaryForeground: 'oklch(0.205 0 0)',
  },
  red: {
    primary: 'oklch(0.577 0.245 27.33)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
  zinc: {
    primary: 'oklch(0.442 0.011 264.53)',
    primaryForeground: 'oklch(0.985 0 0)',
  },
};

export function applyPrimaryColor(token: ColorToken): void {
  const values = COLOR_MAP[token] ?? COLOR_MAP.violet;
  const root = document.documentElement;
  root.style.setProperty('--primary', values.primary);
  root.style.setProperty('--primary-foreground', values.primaryForeground);
}

export const COLOR_OPTIONS: { token: ColorToken; hex: string }[] = [
  { token: 'violet', hex: '#7c3aed' },
  { token: 'blue', hex: '#2563eb' },
  { token: 'green', hex: '#16a34a' },
  { token: 'orange', hex: '#ea580c' },
  { token: 'red', hex: '#dc2626' },
  { token: 'zinc', hex: '#52525b' },
];
