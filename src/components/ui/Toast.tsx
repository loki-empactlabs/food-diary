import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

interface ToastMessage {
  id: number;
  text: string;
}

let _showToast: (msg: string) => void = () => {};
let _id = 0;

/**
 * Call this anywhere to show a toast message.
 * The ToastProvider must be mounted in the app root.
 */
export function showToast(message: string) {
  _showToast(message);
}

/**
 * Mount this once in your root layout to enable toasts.
 */
export function ToastProvider() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const show = useCallback((text: string) => {
    const id = ++_id;
    setMessages((prev) => [...prev, { id, text }]);
    timers.current[id] = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      delete timers.current[id];
    }, 2500);
  }, []);

  useEffect(() => {
    _showToast = show;
    return () => {
      _showToast = () => {};
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, [show]);

  if (messages.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {messages.map((m) => (
        <Animated.View
          key={m.id}
          entering={FadeInDown.duration(200).springify()}
          exiting={FadeOutDown.duration(200)}
          style={styles.toast}
        >
          <Text style={styles.text}>{m.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    backgroundColor: 'rgba(33, 31, 30, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
    maxWidth: 340,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
