import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { type PersonLocation } from "@/services/routing";
import { type ScoredRestaurant } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  midpoint: { lat: number; lng: number };
  people: PersonLocation[];
  results: ScoredRestaurant[];
  onSelectResult: (index: number) => void;
}

export function MeetingMap({ midpoint, people, results, onSelectResult }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
      <Feather name="map" size={28} color={colors.mutedForeground} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Map view available in the Expo Go app
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Midpoint: {midpoint.lat.toFixed(4)}, {midpoint.lng.toFixed(4)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderBottomWidth: 1,
  },
  text: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
