import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { FoodPost } from '@/src/types/post';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const RATING_COLORS = ['#FF4444', '#FF8844', '#FFBB33', '#88CC44', '#44DD66'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const posts = usePostStore((s) => s.posts);

  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Group posts by date string (YYYY-MM-DD)
  const postsByDate = useMemo(() => {
    const map = new Map<string, FoodPost[]>();
    posts.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [posts]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Build calendar grid rows
  const calendarRows = useMemo(() => {
    const rows: (number | null)[][] = [];
    let currentRow: (number | null)[] = [];

    // Fill empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      currentRow.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentRow.push(day);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }

    // Fill remaining empty cells
    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      rows.push(currentRow);
    }

    return rows;
  }, [daysInMonth, firstDay]);

  const getDateKey = useCallback((day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [currentYear, currentMonth]);

  const selectedDatePosts = useMemo(() => {
    const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return postsByDate.get(key) ?? [];
  }, [selectedDate, postsByDate]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  const isToday = (day: number) => {
    return currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      day === today.getDate();
  };

  const isSelected = (day: number) => {
    return currentYear === selectedDate.getFullYear() &&
      currentMonth === selectedDate.getMonth() &&
      day === selectedDate.getDate();
  };

  const selectDay = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const getDayColor = (day: number, dayOfWeek: number) => {
    if (isToday(day) || isSelected(day)) return '#FFFFFF';
    if (dayOfWeek === 0) return '#FF6B6B'; // Sunday
    if (dayOfWeek === 6) return '#4A90FF'; // Saturday
    return colors.text;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status bar spacer */}
      <View style={styles.statusBarSpacer} />

      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </AnimatedPressable>

        <View style={styles.monthNav}>
          <AnimatedPressable onPress={goToPrevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </AnimatedPressable>
          <Text style={[styles.monthText, { color: colors.text }]}>
            {currentYear}년 {currentMonth + 1}월
          </Text>
          <AnimatedPressable onPress={goToNextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </AnimatedPressable>
        </View>

        <AnimatedPressable
          onPress={goToToday}
          style={[styles.todayBtn, { backgroundColor: '#ff6b6b20' }]}
        >
          <Text style={styles.todayText}>오늘</Text>
        </AnimatedPressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Weekday row */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day, i) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={[
                styles.weekdayText,
                { color: i === 0 ? '#FF6B6B' : i === 6 ? '#4A90FF' : colors.textSecondary },
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <Animated.View entering={FadeInDown.duration(200)} style={styles.calendarGrid}>
          {calendarRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.calendarRow}>
              {row.map((day, colIndex) => {
                if (day === null) {
                  return <View key={`empty-${colIndex}`} style={styles.dayCell} />;
                }

                const dateKey = getDateKey(day);
                const hasPosts = postsByDate.has(dateKey);
                const dayIsToday = isToday(day);
                const dayIsSelected = isSelected(day) && !dayIsToday;

                return (
                  <AnimatedPressable
                    key={day}
                    style={styles.dayCell}
                    onPress={() => selectDay(day)}
                  >
                    <View style={[
                      styles.dayCircle,
                      dayIsToday && styles.todayCircle,
                      dayIsSelected && [styles.selectedCircle, { borderColor: colors.textSecondary }],
                    ]}>
                      <Text style={[
                        styles.dayText,
                        { color: getDayColor(day, colIndex) },
                        (dayIsToday || dayIsSelected) && { fontWeight: '700' },
                      ]}>
                        {day}
                      </Text>
                    </View>
                    {hasPosts && (
                      <View style={[
                        styles.dot,
                        { backgroundColor: dayIsToday ? '#FFFFFF' : '#FF6B6B' },
                      ]} />
                    )}
                  </AnimatedPressable>
                );
              })}
            </View>
          ))}
        </Animated.View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Selected day entries */}
        <Animated.View entering={FadeInDown.delay(40).duration(200)} style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <Text style={[styles.entriesTitle, { color: colors.text }]}>
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일의 기록
            </Text>
            <Text style={[styles.entriesCount, { color: colors.textSecondary }]}>
              {selectedDatePosts.length}개
            </Text>
          </View>

          {selectedDatePosts.length === 0 ? (
            <View style={styles.emptyEntries}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                이 날의 기록이 없어요
              </Text>
            </View>
          ) : (
            selectedDatePosts.map((post) => (
              <AnimatedPressable
                key={post.id}
                style={styles.entryCard}
                onPress={() => router.push(`/(app)/post/${post.id}` as any)}
              >
                <Image
                  source={{ uri: post.thumbnail_urls[0] || post.image_urls[0] }}
                  style={styles.entryThumb}
                  contentFit="cover"
                />
                <View style={styles.entryInfo}>
                  {post.menu_name ? (
                    <Text style={[styles.entryName, { color: colors.text }]} numberOfLines={1}>
                      {post.menu_name}
                    </Text>
                  ) : null}
                  <View style={styles.entryRatingRow}>
                    <Text style={{ color: RATING_COLORS[Math.min(Math.round(post.rating) - 1, 4)], fontSize: 11 }}>
                      {formatStars(post.rating)}
                    </Text>
                    <Text style={[styles.entryScore, { color: colors.textSecondary }]}>
                      {post.rating.toFixed(1)}
                    </Text>
                  </View>
                  {post.comment ? (
                    <Text
                      style={[styles.entryComment, { color: '#555555' }]}
                      numberOfLines={1}
                    >
                      {post.comment}
                    </Text>
                  ) : null}
                </View>
              </AnimatedPressable>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpacer: {
    height: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
  },
  todayBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    paddingHorizontal: 20,
    gap: 4,
  },
  calendarRow: {
    flexDirection: 'row',
    height: 46,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: '#FF6B6B',
  },
  selectedCircle: {
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 15,
  },
  entriesSection: {
    paddingHorizontal: 20,
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  entriesCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyEntries: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  entryCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  entryThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#211F1E',
  },
  entryInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  entryRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryScore: {
    fontSize: 15,
    fontWeight: '500',
  },
  entryComment: {
    fontSize: 12,
  },
});
