// === COLOR TOKENS ===
export const colors = {
  // Primary brand — trustworthy blue-green
  primary: {
    50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
    400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
    800: '#1E40AF', 900: '#1E3A8A',
  },
  // Accent — energetic orange for CTAs
  accent: {
    50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74',
    400: '#FB923C', 500: '#F97316', 600: '#EA580C', 700: '#C2410C',
    800: '#9A3412', 900: '#7C2D12',
  },
  // Neutral scale
  neutral: {
    50: '#FAFAFA', 100: '#F5F5F5', 200: '#E5E5E5', 300: '#D4D4D4',
    400: '#A3A3A3', 500: '#737373', 600: '#525252', 700: '#404040',
    800: '#262626', 900: '#171717',
  },
  success: {
    50: '#F0FDF4', 100: '#DCFCE7', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
  },
  warning: {
    50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
  },
  error: {
    50: '#FEF2F2', 100: '#FEE2E2', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
  },
  info: {
    50: '#F0F9FF', 100: '#E0F2FE', 500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1',
  },
};

export const lightTheme = {
  bg: '#FFFFFF',
  bgSecondary: '#F5F5F5',
  text: '#171717',
  textSecondary: '#525252',
  border: '#E5E5E5',
  ...colors,
};

export const darkTheme = {
  bg: '#0A0A0A',
  bgSecondary: '#171717',
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  border: '#262626',
  primary: colors.primary,
  accent: colors.accent,
  neutral: {
    50: '#171717', 100: '#262626', 200: '#404040', 300: '#525252',
    400: '#737373', 500: '#A3A3A3', 600: '#D4D4D4', 700: '#E5E5E5',
    800: '#F5F5F5', 900: '#FAFAFA',
  },
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
};

export type Theme = typeof lightTheme;

// === SPACING SCALE ===
export const spacing = {
  0: '0', 0.5: '2px', 1: '4px', 1.5: '6px', 2: '8px', 2.5: '10px',
  3: '12px', 3.5: '14px', 4: '16px', 5: '20px', 6: '24px', 7: '28px',
  8: '32px', 9: '36px', 10: '40px', 12: '48px', 14: '56px', 16: '64px',
};

// === TYPOGRAPHY ===
export const fontSizes = {
  xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px',
  '2xl': '24px', '3xl': '30px', '4xl': '36px', '5xl': '48px',
};

export const fontWeights = {
  normal: '400', medium: '500', semibold: '600', bold: '700',
};

// === BORDER RADIUS ===
export const radii = {
  none: '0', sm: '4px', DEFAULT: '8px', md: '8px', lg: '12px', xl: '16px',
  full: '9999px',
};

// === ELEVATION / SHADOW ===
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// === STATUS CONFIGURATION ===
export const statusConfig: Record<string, {
  bg: string; text: string; border: string; icon: string; label: string;
}> = {
  DRAFT:          { bg: 'neutral.50',   text: 'neutral.600',   border: 'neutral.200', icon: 'edit',             label: 'Draft' },
  QUOTED:         { bg: 'info.50',       text: 'info.700',       border: 'info.200',     icon: 'receipt',          label: 'Quote Ready' },
  BOOKED:         { bg: 'info.50',       text: 'info.700',       border: 'info.200',     icon: 'check-circle',     label: 'Confirmed' },
  SEARCHING:      { bg: 'warning.50',   text: 'warning.700',    border: 'warning.200',  icon: 'search',           label: 'Searching' },
  ASSIGNED:       { bg: 'primary.50',    text: 'primary.700',    border: 'primary.200',  icon: 'car',              label: 'Driver Assigned' },
  EN_ROUTE_TO_PICKUP:  { bg: 'primary.50', text: 'primary.700',  border: 'primary.200', icon: 'navigation',       label: 'En Route' },
  AT_PICKUP:      { bg: 'primary.50',    text: 'primary.700',    border: 'primary.200',  icon: 'map-marker',       label: 'At Pickup' },
  PICKED_UP:      { bg: 'primary.50',    text: 'primary.700',    border: 'primary.200',  icon: 'package',          label: 'Collected' },
  EN_ROUTE_TO_DROPOFF: { bg: 'primary.50', text: 'primary.700',  border: 'primary.200', icon: 'truck',             label: 'In Transit' },
  AT_DROPOFF:     { bg: 'primary.50',    text: 'primary.700',    border: 'primary.200',  icon: 'flag',             label: 'Arrived' },
  DELIVERED:      { bg: 'success.50',   text: 'success.700',   border: 'success.200', icon: 'check',             label: 'Delivered' },
  COMPLETED:      { bg: 'success.50',   text: 'success.700',   border: 'success.200', icon: 'check-circle',      label: 'Completed' },
  CANCELLED:      { bg: 'error.50',     text: 'error.700',     border: 'error.200',    icon: 'x-circle',          label: 'Cancelled' },
  UNMATCHED:      { bg: 'error.50',     text: 'error.700',     border: 'error.200',    icon: 'alert-circle',      label: 'No Driver Found' },
  DISPUTED:       { bg: 'warning.50',   text: 'warning.700',   border: 'warning.200',  icon: 'alert-triangle',   label: 'Under Review' },
  RESOLVED:       { bg: 'info.50',       text: 'info.700',       border: 'info.200',     icon: 'check-square',     label: 'Resolved' },
  UNDER_REVIEW:   { bg: 'warning.50',   text: 'warning.700',   border: 'warning.200',  icon: 'alert-triangle',   label: 'Under Review' },
  OPEN:           { bg: 'warning.50',   text: 'warning.700',   border: 'warning.200',  icon: 'alert-circle',      label: 'Open' },
};

// === RESPONSIVE BREAKPOINTS (prototype) ===
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

export const responsive = {
  page: 'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8',
  pageNarrow: 'mx-auto w-full max-w-md px-4 sm:px-5',
  stack: 'flex flex-col gap-4',
  gridCards: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  driverTouchTarget: 'min-h-[48px] min-w-[48px]',
};
