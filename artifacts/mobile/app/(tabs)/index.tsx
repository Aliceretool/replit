import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentMeetings, savedPlaces } = useApp();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: topPad + 24,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "web" ? 120 : 100 + insets.bottom,
      gap: 28,
    },
    hero: {
      gap: 8,
    },
    appName: {
      fontSize: 38,
      fontWeight: "800" as const,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.foreground,
      letterSpacing: -1,
    },
    appNameAccent: {
      color: colors.primary,
    },
    tagline: {
      fontSize: 17,
      fontFamily: "SpaceGrotesk_400Regular",
      color: colors.mutedForeground,
      lineHeight: 24,
    },
    ctaButton: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 18,
      ...(Platform.OS === "ios"
        ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 }
        : { elevation: 6 }),
    },
    ctaText: {
      fontSize: 17,
      fontWeight: "700" as const,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.primaryForeground,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
      color: colors.mutedForeground,
      fontFamily: "SpaceGrotesk_600SemiBold",
      marginBottom: 4,
    },
    meetingCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    meetingTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    meetingSpotName: {
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "SpaceGrotesk_600SemiBold",
      color: colors.foreground,
      flex: 1,
    },
    meetingDate: {
      fontSize: 12,
      fontFamily: "SpaceGrotesk_400Regular",
      color: colors.mutedForeground,
    },
    meetingPeople: {
      fontSize: 13,
      fontFamily: "SpaceGrotesk_400Regular",
      color: colors.mutedForeground,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: colors.radius - 4,
      padding: 14,
      gap: 4,
    },
    statNumber: {
      fontSize: 22,
      fontWeight: "700" as const,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.foreground,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: "SpaceGrotesk_400Regular",
      color: colors.mutedForeground,
    },
    emptyCard: {
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      padding: 24,
      alignItems: "center",
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "SpaceGrotesk_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.appName}>
            Meeting <Text style={s.appNameAccent}>Miday</Text>
          </Text>
          <Text style={s.tagline}>Find the fairest meeting spot for everyone in your group.</Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.ctaButton, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={() => router.push("/setup")}
        >
          <Feather name="users" size={20} color={colors.primaryForeground} />
          <Text style={s.ctaText}>Start a Meeting</Text>
        </Pressable>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{recentMeetings.length}</Text>
            <Text style={s.statLabel}>Meetings planned</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{savedPlaces.length}</Text>
            <Text style={s.statLabel}>Saved places</Text>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={s.sectionHeader}>Recent Meetings</Text>
          {recentMeetings.length === 0 ? (
            <View style={s.emptyCard}>
              <Feather name="calendar" size={24} color={colors.mutedForeground} />
              <Text style={s.emptyText}>Your past meetings will appear here once you've planned one.</Text>
            </View>
          ) : (
            recentMeetings.map((m) => (
              <View key={m.id} style={s.meetingCard}>
                <View style={s.meetingTopRow}>
                  <Text style={s.meetingSpotName} numberOfLines={1}>
                    {m.topResult?.name ?? "Meeting"}
                  </Text>
                  <Text style={s.meetingDate}>{formatDate(m.date)}</Text>
                </View>
                <Text style={s.meetingPeople}>
                  {m.people.map((p) => p.name).join(", ")} — {m.people.length} people
                </Text>
              </View>
            ))
          )}
        </View>

        {savedPlaces.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={s.sectionHeader}>Saved Places</Text>
            {savedPlaces.map((place) => (
              <View key={place.id} style={s.meetingCard}>
                <View style={s.meetingTopRow}>
                  <Text style={s.meetingSpotName}>{place.name}</Text>
                  <Feather name="bookmark" size={14} color={colors.primary} />
                </View>
                <Text style={s.meetingPeople}>{place.cuisine ?? place.amenity}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
