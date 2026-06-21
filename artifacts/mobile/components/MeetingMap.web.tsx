import { Feather } from "@expo/vector-icons";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
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

  const openMapboxEmbed = () => {
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=false&zoomwheel=false&access_token=${token}#12/${midpoint.lat}/${midpoint.lng}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
      <Feather name="map" size={28} color={colors.primary} />
      <Text style={[styles.text, { color: colors.foreground }]}>
        Interactive map available in Expo Go
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Midpoint: {midpoint.lat.toFixed(4)}, {midpoint.lng.toFixed(4)}
      </Text>
      <Pressable
        onPress={openMapboxEmbed}
        style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Feather name="external-link" size={13} color={colors.primary} />
        <Text style={[styles.linkText, { color: colors.primary }]}>Open in Mapbox</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderBottomWidth: 1,
  },
  text: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  link: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  linkText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
