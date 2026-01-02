// Tailwind Renk Paleti (Hex Kodları)
const Palette = {
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
    500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827',
    950: '#030712',
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
    950: '#172554',
  },
  emerald: { // Yeşil tonları (Başarı için)
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
    500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
  },
  rose: { // Kırmızı tonları (Hata için)
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
    500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337',
  },
  amber: { // Turuncu tonları (Beklemede/Uyarı için)
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
    500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
  },
  slate: { // Alternatif koyu tema grileri
    500: '#64748b', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
  }
};

const tintColorLight = Palette.blue[600];
const tintColorDark = Palette.blue[400];

export default {
  // Uygulamanın kullandığı dinamik temalar
  light: {
    text: Palette.gray[900],
    background: Palette.gray[50],
    tint: tintColorLight,
    tabIconDefault: Palette.gray[400],
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    border: Palette.gray[200],
    notification: Palette.rose[500],
    // Tüm palete buradan da erişebilirsin: Colors.light.blue[500]
    palette: Palette, 
  },
  dark: {
    text: Palette.gray[50],
    background: '#000000',
    tint: tintColorDark,
    tabIconDefault: Palette.gray[600],
    tabIconSelected: tintColorDark,
    card: Palette.gray[900],
    border: Palette.gray[800],
    notification: Palette.rose[400],
    palette: Palette,
  },
};