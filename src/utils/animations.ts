import { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

// Spring presets
export const SPRING_PRESS: WithSpringConfig = { damping: 15, stiffness: 150 };
export const SPRING_BOUNCE: WithSpringConfig = { damping: 12, stiffness: 200 };
export const SPRING_SMOOTH: WithSpringConfig = { damping: 20, stiffness: 180 };
export const SPRING_ENTRANCE: WithSpringConfig = { damping: 18, stiffness: 200 };
export const SPRING_SNAP: WithSpringConfig = { damping: 15, stiffness: 300, mass: 0.8 };

// Timing presets
export const TIMING_FAST: WithTimingConfig = { duration: 150 };
export const TIMING_MEDIUM: WithTimingConfig = { duration: 250 };
export const TIMING_SLOW: WithTimingConfig = { duration: 400 };

// Stagger delay between list items (ms)
export const STAGGER_DELAY = 35;

// Press scale target
export const PRESS_SCALE = 0.96;
