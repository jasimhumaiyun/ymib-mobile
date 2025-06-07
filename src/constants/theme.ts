/**
 * YMIB Theme System
 * Inspired by the mysterious depths of the ocean
 * Sea green palette with nautical elements
 */

export const Colors = {
  // Primary Sea Green Palette
  primary: {
    50: '#E0F2F1',   // Lightest sea foam
    100: '#B2DFDB',  // Light sea foam
    200: '#80CBC4',  // Sea foam
    300: '#4DB6AC',  // Light sea green
    400: '#26A69A',  // Sea green
    500: '#009688',  // Primary sea green
    600: '#00897B',  // Deep sea green
    700: '#00796B',  // Darker sea green
    800: '#00695C',  // Deep ocean
    900: '#004D40',  // Deepest ocean
  },

  // Secondary Ocean Blues
  secondary: {
    50: '#E1F5FE',
    100: '#B3E5FC', 
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#03A9F4',  // Ocean blue
    600: '#039BE5',
    700: '#0288D1',
    800: '#0277BD',
    900: '#01579B',
  },

  // Accent Colors
  accent: {
    treasure: '#FFB300',    // Golden treasure
    coral: '#FF7043',       // Coral reef
    pearl: '#F5F5F5',       // Pearl white
    seaweed: '#4CAF50',     // Seaweed green
    sunset: '#FF6B35',      // Ocean sunset
    mustardSea: '#D4AF37',  // Mustardy sea yellow
  },

  // Neutral Ocean Tones
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic Colors
  success: '#00897B',      // Deep sea green
  warning: '#FFB300',      // Treasure gold
  error: '#D32F2F',        // Danger red
  info: '#0288D1',         // Ocean blue

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FFFE',   // Very light sea foam
    tertiary: '#E0F2F1',   // Light sea foam
    ocean: '#B2DFDB',      // Sea foam background
  },

  // Text Colors
  text: {
    primary: '#212121',     // Deep charcoal
    secondary: '#616161',   // Medium gray
    tertiary: '#9E9E9E',    // Light gray
    inverse: '#FFFFFF',     // White text
    ocean: '#004D40',       // Deep ocean text
    muted: '#78909C',       // Muted blue-gray
  },
};

export const Typography = {
  // Font Families
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    // Consider adding custom fonts like:
    // heading: 'Playfair Display', // Elegant serif for headings
    // body: 'Inter',              // Clean sans-serif for body
  },

  // Font Sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 48,
    '6xl': 64,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Weights - React Native compatible
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  ocean: {
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Component Styles
export const ComponentStyles = {
  button: {
    primary: {
      backgroundColor: Colors.primary[600],
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.xl,
      ...Shadows.ocean,
    },
    secondary: {
      backgroundColor: Colors.background.tertiary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.xl,
      borderWidth: 1,
      borderColor: Colors.primary[300],
    },
  },
  
  card: {
    base: {
      backgroundColor: Colors.background.primary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.base,
    },
    ocean: {
      backgroundColor: Colors.background.secondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: Colors.primary[500],
      ...Shadows.sm,
    },
  },

  input: {
    base: {
      borderWidth: 1,
      borderColor: Colors.neutral[300],
      borderRadius: BorderRadius.md,
      padding: Spacing.base,
      backgroundColor: Colors.background.secondary,
      fontSize: Typography.sizes.base,
      color: Colors.text.primary,
    },
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
}; 