import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 18,
  base: 22,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 36,
  '3xl': 42,
} as const;

export const typography = {
  h1: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  } as TextStyle,
  h2: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  } as TextStyle,
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
  } as TextStyle,
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
  } as TextStyle,
  body: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
  } as TextStyle,
  bodyMedium: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
  } as TextStyle,
  bodySm: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
  } as TextStyle,
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
  } as TextStyle,
  button: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
  } as TextStyle,
  buttonSm: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
  } as TextStyle,
} as const;
