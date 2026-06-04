import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatItem {
  value: number;
  label: string;
}

interface ProfileStatsRowProps {
  stats: [StatItem, StatItem, StatItem];
}

export default function ProfileStatsRow({ stats }: ProfileStatsRowProps) {
  return (
    <View
      className="flex-row justify-around bg-surface mx-6 mt-4 p-4 rounded-2xl border border-border/40"
      style={styles.cardShadow}
    >
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          {index > 0 && (
            <View className="w-px bg-border/40 h-8 self-center" />
          )}
          <View className="items-center flex-1">
            <Text className="text-h1 text-accent font-bold">{stat.value}</Text>
            <Text className="text-caption text-secondary mt-1 text-center font-medium">
              {stat.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
});
