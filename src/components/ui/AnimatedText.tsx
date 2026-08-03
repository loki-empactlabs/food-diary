import { useEffect, useState } from 'react';
import { Text, TextProps } from 'react-native';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  Easing,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

interface AnimatedTextProps extends Omit<TextProps, 'children'> {
  /** Target number to animate to */
  targetValue: number;
  /** Animation duration in ms (default: 800) */
  duration?: number;
  /** Text to show before the number */
  prefix?: string;
  /** Text to show after the number */
  suffix?: string;
  /** Decimal places (default: 0) */
  decimals?: number;
}

export function AnimatedText({
  targetValue,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  ...rest
}: AnimatedTextProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  const updateDisplay = (val: number) => {
    setDisplayValue(val);
  };

  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      runOnJS(updateDisplay)(current);
    }
  );

  useEffect(() => {
    animatedValue.value = withTiming(targetValue, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetValue, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toString();

  return (
    <Text style={style} {...rest}>
      {prefix}{formatted}{suffix}
    </Text>
  );
}
