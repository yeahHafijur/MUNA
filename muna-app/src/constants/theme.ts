// ─── MUNA Theme Color Tokens ───
// Centralized color system for Light & Dark mode.
// Every screen/component should consume these tokens via useTheme().

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  elevated: string;

  // Brand
  primary: string;
  primaryMuted: string;
  accent: string;
  accentMuted: string;
  accentText: string;

  // Text
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;
  invertedText: string;

  // Borders & Dividers
  border: string;
  borderStrong: string;
  divider: string;

  // Status
  success: string;
  successMuted: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;
  info: string;
  infoMuted: string;

  // Disabled
  disabled: string;
  disabledText: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;

  // Overlay
  overlay: string;
  overlayStrong: string;

  // Skeleton
  skeleton: string;
  skeletonHighlight: string;

  // Tab Bar
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;

  // Status Bar
  statusBarStyle: 'light' | 'dark';

  // Icon defaults
  icon: string;
  iconMuted: string;

  // Misc
  shadow: string;
  badge: string;
  headerSolid: string;
}

export const lightTheme: ThemeColors = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#FFFFFF',

  // Brand
  primary: '#208AEF',
  primaryMuted: '#DBEAFE',
  accent: '#f59e0b',
  accentMuted: '#fef3c7',
  accentText: '#78350f',

  // Text
  primaryText: '#0f172a',
  secondaryText: '#64748b',
  tertiaryText: '#94a3b8',
  invertedText: '#FFFFFF',

  // Borders
  border: '#f1f5f9',
  borderStrong: '#e2e8f0',
  divider: '#f1f5f9',

  // Status
  success: '#10b981',
  successMuted: '#ecfdf5',
  danger: '#ef4444',
  dangerMuted: '#fef2f2',
  warning: '#f59e0b',
  warningMuted: '#fffbeb',
  info: '#3b82f6',
  infoMuted: '#eff6ff',

  // Disabled
  disabled: '#e2e8f0',
  disabledText: '#94a3b8',

  // Input
  inputBackground: '#f8fafc',
  inputBorder: '#e2e8f0',
  inputText: '#0f172a',
  placeholder: '#94a3b8',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayStrong: 'rgba(0,0,0,0.7)',

  // Skeleton
  skeleton: '#e2e8f0',
  skeletonHighlight: '#f1f5f9',

  // Tab Bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#f1f5f9',
  tabActive: '#f59e0b',
  tabInactive: '#94a3b8',

  // Status Bar
  statusBarStyle: 'dark',

  // Icon
  icon: '#475569',
  iconMuted: '#94a3b8',

  // Misc
  shadow: '#000',
  badge: '#ef4444',
  headerSolid: '#FFFFFF',
};

export const darkTheme: ThemeColors = {
  // Backgrounds
  background: '#0B1220',
  surface: '#121826',
  card: '#1A2333',
  elevated: '#1F2937',

  // Brand
  primary: '#3EA6FF',
  primaryMuted: '#1A2333',
  accent: '#f59e0b',
  accentMuted: '#422006',
  accentText: '#fde68a',

  // Text
  primaryText: '#FFFFFF',
  secondaryText: '#A1A1AA',
  tertiaryText: '#71717A',
  invertedText: '#0f172a',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  divider: 'rgba(255,255,255,0.06)',

  // Status
  success: '#34d399',
  successMuted: 'rgba(52,211,153,0.15)',
  danger: '#f87171',
  dangerMuted: 'rgba(248,113,113,0.15)',
  warning: '#fbbf24',
  warningMuted: 'rgba(251,191,36,0.15)',
  info: '#60a5fa',
  infoMuted: 'rgba(96,165,250,0.15)',

  // Disabled
  disabled: '#27303F',
  disabledText: '#52525B',

  // Input
  inputBackground: '#1A2333',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputText: '#FFFFFF',
  placeholder: '#52525B',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',
  overlayStrong: 'rgba(0,0,0,0.8)',

  // Skeleton
  skeleton: '#1A2333',
  skeletonHighlight: '#27303F',

  // Tab Bar
  tabBar: '#121826',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  tabActive: '#f59e0b',
  tabInactive: '#52525B',

  // Status Bar
  statusBarStyle: 'light',

  // Icon
  icon: '#A1A1AA',
  iconMuted: '#52525B',

  // Misc
  shadow: 'transparent',
  badge: '#ef4444',
  headerSolid: '#121826',
};
