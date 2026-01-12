export const rnThemes = {
  boldModern: {
    id: 'boldModern',
    name: 'Bold & Modern',
    description: 'Creative and energizing',
    primary: '#7c3aed',      // Deep Purple
    secondary: '#ec4899',    // Magenta Pink
    accent: '#a78bfa',       // Soft Lavender
    background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #a78bfa 100%)',
    cardBorder: 'linear-gradient(90deg, #7c3aed, #ec4899, #a78bfa)',
  },
  warmEnergizing: {
    id: 'warmEnergizing',
    name: 'Warm & Energizing',
    description: 'Sunrise vibes, optimistic',
    primary: '#f97316',      // Coral Orange
    secondary: '#fbbf24',    // Golden Yellow
    accent: '#fef3c7',       // Soft Cream
    background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 50%, #fef3c7 100%)',
    cardBorder: 'linear-gradient(90deg, #f97316, #fbbf24, #fef3c7)',
  },
  freshVibrant: {
    id: 'freshVibrant',
    name: 'Fresh & Vibrant',
    description: 'Friendly and lively',
    primary: '#fb7185',      // Bright Coral
    secondary: '#fdba74',    // Peach
    accent: '#fef2f2',       // Warm White
    background: 'linear-gradient(135deg, #fb7185 0%, #fdba74 50%, #fef2f2 100%)',
    cardBorder: 'linear-gradient(90deg, #fb7185, #fdba74, #fef2f2)',
  },
  sophisticatedWarm: {
    id: 'sophisticatedWarm',
    name: 'Sophisticated & Warm',
    description: 'Elegant and professional',
    primary: '#be123c',      // Burgundy/Wine
    secondary: '#fda4af',    // Rose Gold
    accent: '#fef2f2',       // Cream
    background: 'linear-gradient(135deg, #be123c 0%, #fda4af 50%, #fef2f2 100%)',
    cardBorder: 'linear-gradient(90deg, #be123c, #fda4af, #fef2f2)',
  },
  natureInspired: {
    id: 'natureInspired',
    name: 'Nature-Inspired',
    description: 'Earthy and grounded',
    primary: '#ea580c',      // Warm Terracotta
    secondary: '#84cc16',    // Sage
    accent: '#fef9c3',       // Sand
    background: 'linear-gradient(135deg, #ea580c 0%, #84cc16 50%, #fef9c3 100%)',
    cardBorder: 'linear-gradient(90deg, #ea580c, #84cc16, #fef9c3)',
  },
  oceanDusk: {
    id: 'oceanDusk',
    name: 'Ocean at Dusk',
    description: 'Calm and serene',
    primary: '#0ea5e9',      // Sky Blue
    secondary: '#8b5cf6',    // Soft Purple
    accent: '#fdf4ff',       // Pale Pink
    background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #fdf4ff 100%)',
    cardBorder: 'linear-gradient(90deg, #0ea5e9, #8b5cf6, #fdf4ff)',
  },
};

export type ThemeId = keyof typeof rnThemes;
export const defaultTheme: ThemeId = 'boldModern';
