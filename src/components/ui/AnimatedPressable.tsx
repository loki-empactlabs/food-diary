import { useCallback } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_PRESS, PRESS_SCALE } from '@/src/utils/animations';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableComponentProps extends PressableProps {
  /** Scale target on press (default: 0.96) */
  scaleTarget?: number;
}

export function AnimatedPressable({
  scaleTarget = PRESS_SCALE,
  onPressIn,
  onPressOut,
  style,
  disabled,
  children,
  ...rest
}: AnimatedPressableComponentProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(
    (e: any) => {
      scale.value = withSpring(scaleTarget, SPRING_PRESS);
      onPressIn?.(e);
    },
    [scaleTarget, onPressIn, scale]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, SPRING_PRESS);
      onPressOut?.(e);
    },
    [onPressOut, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style as any]}
      disabled={disabled}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}
