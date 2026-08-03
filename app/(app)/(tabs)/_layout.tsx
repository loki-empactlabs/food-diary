import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';

const TAB_ICONS: Record<string, { default: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = {
  'home/index': { default: 'home-outline', active: 'home' },
  'map/index': { default: 'location-outline', active: 'location' },
  'camera/index': { default: 'add-circle-outline', active: 'add-circle' },
  'profile/index': { default: 'person-outline', active: 'person' },
};

// Tab widths: 50px each, 4px gap, 6px padding
const TAB_WIDTH = 50;
const TAB_GAP = 4;
const PILL_PADDING = 6;

function AnimatedTabIcon({ isFocused, icons, color }: { isFocused: boolean; icons: { default: string; active: string }; color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      scale.value = 1.3;
      scale.value = withSpring(1, { damping: 28, stiffness: 400, overshootClamping: true });
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={(isFocused ? icons.active : icons.default) as any}
        size={20}
        color={color}
      />
    </Animated.View>
  );
}

function FloatingTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const indicatorX = useSharedValue(state.index * (TAB_WIDTH + TAB_GAP));

  useEffect(() => {
    indicatorX.value = withSpring(
      state.index * (TAB_WIDTH + TAB_GAP),
      { damping: 28, stiffness: 300, mass: 0.9 }
    );
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  // Hide tab bar on camera screen
  const currentRoute = state.routes[state.index]?.name;
  if (currentRoute === 'camera/index') return null;

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={[styles.pill, { borderColor: '#FFFFFF10', backdropFilter: 'blur(7.5px)', WebkitBackdropFilter: 'blur(7.5px)' } as any]}>
        {/* Sliding indicator */}
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.primary },
            indicatorStyle,
          ]}
        />

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name] ?? { default: 'help-circle-outline', active: 'help-circle' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <AnimatedPressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <AnimatedTabIcon
                isFocused={isFocused}
                icons={icons}
                color={isFocused ? '#FFFFFF' : colors.textTertiary}
              />
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home/index" options={{ title: '홈' }} />
      <Tabs.Screen name="map/index" options={{ title: '지도' }} />
      <Tabs.Screen name="camera/index" options={{ title: '기록' }} />
      <Tabs.Screen name="profile/index" options={{ title: '프로필' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1AE6',
    borderRadius: 26,
    borderWidth: 1,
    padding: PILL_PADDING,
    gap: TAB_GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 16,
  },
  indicator: {
    position: 'absolute',
    top: PILL_PADDING,
    left: PILL_PADDING,
    width: TAB_WIDTH,
    height: 40,
    borderRadius: 20,
  },
  tabItem: {
    width: TAB_WIDTH,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
