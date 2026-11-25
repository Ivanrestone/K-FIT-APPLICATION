import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface TickerItem {
  title: string;
  body: string;
  created_at: string;
}

interface AnnouncementTickerProps {
  items: TickerItem[];
  accent: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  onPress?: () => void;
}

export function AnnouncementTicker({ items, accent, backgroundColor, borderColor, textColor, onPress }: AnnouncementTickerProps) {
  const [translateX] = useState(() => new Animated.Value(0));
  const [contentWidth, setContentWidth] = useState(0);
  const halfWidth = contentWidth / 2;

  const tickerText = items
    .map((item) => {
      const date = new Date(item.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return `${date}  •  ${item.title}${item.body ? ` — ${item.body}` : ''}`;
    })
    .join('      ✦      ');

  useEffect(() => {
    if (halfWidth <= 0) return;
    translateX.setValue(0);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -halfWidth,
        duration: Math.max(halfWidth * 18, 8000),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [halfWidth, translateX]);

  if (items.length === 0) return null;

  const content = (
    <>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
          tintColor={accent}
          size={15}
        />
      </View>
      <View style={styles.marquee} pointerEvents="none">
        <Animated.View
          style={[styles.marqueeTrack, { transform: [{ translateX }] }]}
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
        >
          <Text style={[styles.tickerText, textColor ? { color: textColor } : null]} numberOfLines={1}>
            {tickerText}
          </Text>
          <Text style={[styles.tickerText, textColor ? { color: textColor } : null]} numberOfLines={1}>
            {tickerText}
          </Text>
        </Animated.View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.ticker,
          backgroundColor ? { backgroundColor } : null,
          borderColor ? { borderColor } : null,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <View
      style={[
        styles.ticker,
        backgroundColor ? { backgroundColor } : null,
        borderColor ? { borderColor } : null,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 201, 117, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(242, 201, 117, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  iconWrap: {
    marginRight: 10,
  },
  marquee: {
    flex: 1,
    overflow: 'hidden',
  },
  marqueeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    fontWeight: '600',
    color: '#F2C975',
    flexShrink: 0,
    paddingRight: 24,
  },
});
