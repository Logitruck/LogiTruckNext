import { Platform } from 'react-native';

const HORIZONTAL_SPACING_BASE = Platform.OS === 'web' ? 4 : 2;
const VERTICAL_SPACING_BASE = 4;

export const navContainerTheme = {
  dark: {
    colors: {
      primary: '#704BFF',
      background: '#000000',
      card: '#000000',
      text: '#ffffff',
      border: '#f5f5f5',
      notification: '#ea0606',
    },
    dark: true,
  },
  light: {
    colors: {
      primary: '#704BFF',
      background: '#ffffff',
      card: '#ffffff',
      text: '#000000',
      border: '#d6d6d6',
      notification: '#ea0606',
    },
    dark: false,
  },
};

const baseTheme = {
  navContainerTheme,
  colors: {
    light: {
      primaryBackground: '#ffffff',
      secondaryBackground: '#F4F6FA',
      tertiaryBackground: '#EEF2F7',
      primaryForeground: '#704BFF',
      secondaryForeground: '#8442bd',
      foregroundContrast: 'white',
      primaryText: '#000000',
      secondaryText: '#7e7e7e',
      hairline: '#efefef',
      inputBackground: '#F5F5F5',
      border: '#D6D6D6',
      buttonText: '#FFFFFF',
      grey0: '#fafafa',
      grey3: '#f5f5f5',
      grey6: '#d6d6d6',
      grey9: '#939393',
      red: '#ea0606',
      green: '#1E8C4E',
      white: '#ffffff',

      offerNew: '#FFB3B3',
      offerOffered: '#B3D9FF',
      offerAccepted: '#B3FFDA',
      offerReview: '#FFD9B3',
      offerApproved: '#B3FFB3',

      notificationNewOffer: '#FFF0F0',
      notificationInspectionApproved: '#FFF9E6',
      notificationNewMessage: '#F0E6FF',

      jobsActiveBackground: '#E6FAF5',
      jobsScheduledBackground: '#FFF6E6',

      quickActionBackground: '#F5F7FA',
      quickActionBorder: '#E0E0E0',
    },
    dark: {
      primaryBackground: '#000000',
      secondaryBackground: '#121212',
      tertiaryBackground: '#1A1A1A',
      primaryForeground: '#704BFF',
      secondaryForeground: '#8442bd',
      foregroundContrast: 'white',
      primaryText: '#ffffff',
      secondaryText: '#dddddd',
      hairline: '#303030',
      inputBackground: '#1E1E1E',
      border: '#333333',
      buttonText: '#FFFFFF',
      grey0: '#0a0a0a',
      grey3: '#2a2a2a',
      grey6: '#f5f5f5',
      grey9: '#eaeaea',
      red: '#ea0606',
      green: '#1E8C4E',

      offerNew: '#FF4C4C',
      offerOffered: '#4C9AFF',
      offerAccepted: '#4CFFA5',
      offerReview: '#FF914C',
      offerApproved: '#4CFF4C',

      notificationNewOffer: '#3A2A2A',
      notificationInspectionApproved: '#3A3526',
      notificationNewMessage: '#2E2A3A',

      jobsActiveBackground: '#1F2D2B',
      jobsScheduledBackground: '#3A3326',

      quickActionBackground: '#1A1A1A',
      quickActionBorder: '#333333',
    },
  },
  roleThemes: {
    finder: {
      primaryForeground: '#434343',
      secondaryForeground: '#595959',
      primaryText: '#434343',
      secondaryText: '#7e7e7e',
    },
    carrier: {
      primaryForeground: '#1E8C4E',
      secondaryForeground: '#0F6B3C',
    },
    dispatcher: {
      primaryForeground: '#1E8C4E',
      secondaryForeground: '#0F6B3C',
    },
    driver: {
      primaryForeground: '#704BFF',
      secondaryForeground: '#5A3AD1',
    },
    admin: {
      primaryForeground: '#434343',
      secondaryForeground: '#595959',
    },
  },
  spaces: {
    horizontal: {
      s: 2 * HORIZONTAL_SPACING_BASE,
      m: 4 * HORIZONTAL_SPACING_BASE,
      l: 6 * HORIZONTAL_SPACING_BASE,
      xl: 8 * HORIZONTAL_SPACING_BASE,
    },
    vertical: {
      s: 2 * VERTICAL_SPACING_BASE,
      m: 4 * VERTICAL_SPACING_BASE,
      l: 6 * VERTICAL_SPACING_BASE,
      xl: 8 * VERTICAL_SPACING_BASE,
    },
  },
  fontSizes: {
    xxs: 8,
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 24,
    xxl: 32,
  },
  fontWeights: {
    s: '400',
    m: '600',
    l: '800',
  },
  icons: {},
  button: {
    borderRadius: 8,
  },
  webContainerStyle: {
    backgroundColor: '#FFFFFF',
    maxWidth: 1024,
    height: '100%',
    width: '100%',
    alignSelf: 'center',
  },
};

export default baseTheme;