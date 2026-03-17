export const colors = {
  surface: {
    bg: '#f7f5ee',
    card: '#ffffff',
    sheet: '#f7f7f5',
  },
  content: '#312a47',
  border: '#e8e7e3',
  borderDk: '#d4d3cf',
  types: {
    red: '#b73c3c',
    orange: '#b7613c',
    yellow: '#c19224',
    lime: '#a9b11d',
    avocado: '#62911b',
    green: '#5eaf43',
    forest: '#2e6d34',
    mint: '#229558',
    teal: '#149882',
    aqua: '#2d8ba3',
    blue: '#114486',
    royal: '#1a239f',
    indigo: '#492e97',
    grape: '#691ba0',
    magenta: '#a721ae',
    pink: '#c0188a',
    rose: '#a82d56',
  },
} as const;

export const typeColorsList = Object.values(colors.types);

export const typography = {
  headlineMedium: {
    fontFamily: 'NunitoSans_900Black',
    fontSize: 16,
  },
  bodyLarge: {
    fontFamily: 'NunitoSans_900Black',
    fontSize: 13,
  },
  bodySmall: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 13,
    lineHeight: 16,
  },
  titleMedium: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 16,
    lineHeight: 20,
  },
  titleSmall: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 13,
    lineHeight: 16,
  },
} as const;

export const shadows = {
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.22 },
    shadowOpacity: 0.07,
    shadowRadius: 15,
    elevation: 3,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
