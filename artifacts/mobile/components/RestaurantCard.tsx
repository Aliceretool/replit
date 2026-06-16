import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { type Place } from "@/services/places";
import { type ScoredPlace } from "@/services/routing";
import { useColors } from "@/hooks/useColors";

interface Props {
  place: Place;
  scored: ScoredPlace;
  rank: number;
  isSaved: boolean;
  onToggleSave: () => void;
}

function amenityIcon(amenity: string): keyof typeof Feather.glyphMap {
  if (amenity === "cafe") return "coffee";
  if (amenity === "bar" || amenity === "pub") return "zap";
  return "shopping-bag";
}

export function RestaurantCard({ place, scored, rank, isSaved, onToggleSave }: Props) {
  const colors = useColors();
  const isTop = rank === 0;

  const maxMins = scored.maxTravelMins;

  const fairnessLabel =
    scored.scores.length > 1
      ? (() => {
          const times = scored.scores.map((s) => s.travelTimeMins);
          const diff = Math.max(...times) - Math.min(...times);
          if (diff <= 3) return "Very fair";
          if (diff <= 8) return "Fair";
          return "Uneven";
        })()
      : null;

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSave();
  };

  const openMaps = () => {
    const query = encodeURIComponent(`${place.name}, ${place.lat},${place.lng}`);
    const url =
      Platform.OS === "ios"
        ? `maps:?q=${query}`
        : `geo:${place.lat},${place.lng}?q=${query}`;
    Linking.openURL(url);
  };

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: isTop ? 2 : 1,
      borderColor: isTop ? colors.primary : colors.border,
      overflow: "hidden",
    },
    topBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    topBadgeText: {
      color: colors.primaryForeground,
      fontSize: 12,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    body: {
      padding: 16,
      gap: 10,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    name: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      lineHeight: 22,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.muted,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    tagText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      textTransform: "capitalize",
    },
    fairnessTag: {
      backgroundColor: colors.accent,
    },
    fairnessText: {
      color: colors.accentForeground,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    travelsRow: {
      gap: 6,
    },
    travelsLabel: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
    },
    personRows: {
      gap: 4,
    },
    personRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    personName: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      flex: 1,
    },
    timeBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    timeTrack: {
      width: 80,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: "hidden",
    },
    timeFill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    timeText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      width: 36,
      textAlign: "right",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: colors.radius - 4,
      backgroundColor: colors.muted,
    },
    actionBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    saveBtn: {
      backgroundColor: isSaved ? colors.accent : colors.muted,
    },
    saveBtnText: {
      color: isSaved ? colors.accentForeground : colors.foreground,
    },
  });

  return (
    <View style={s.card}>
      {isTop && (
        <View style={s.topBadge}>
          <Feather name="star" size={12} color={colors.primaryForeground} />
          <Text style={s.topBadgeText}>BEST SPOT FOR EVERYONE</Text>
        </View>
      )}
      <View style={s.body}>
        <View style={s.titleRow}>
          <Text style={s.name}>{place.name}</Text>
          <Pressable hitSlop={10} onPress={handleSave}>
            <Feather name={isSaved ? "bookmark" : "bookmark"} size={20} color={isSaved ? colors.primary : colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={s.metaRow}>
          <View style={s.tag}>
            <Feather name={amenityIcon(place.amenity)} size={11} color={colors.mutedForeground} />
            <Text style={s.tagText}>{place.cuisine ?? place.amenity}</Text>
          </View>
          {fairnessLabel && (
            <View style={[s.tag, s.fairnessTag]}>
              <Text style={[s.tagText, s.fairnessText]}>{fairnessLabel}</Text>
            </View>
          )}
          <View style={s.tag}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={s.tagText}>max {maxMins} min</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.travelsRow}>
          <Text style={s.travelsLabel}>Travel times</Text>
          <View style={s.personRows}>
            {scored.scores.map((ps) => {
              const pct = maxMins > 0 ? ps.travelTimeMins / maxMins : 1;
              return (
                <View key={ps.personId} style={s.personRow}>
                  <Text style={s.personName} numberOfLines={1}>
                    {ps.personName}
                  </Text>
                  <View style={s.timeBar}>
                    <View style={s.timeTrack}>
                      <View style={[s.timeFill, { width: `${Math.round(pct * 100)}%` }]} />
                    </View>
                    <Text style={s.timeText}>{ps.travelTimeMins} min</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={s.actionsRow}>
          <Pressable
            style={({ pressed }) => [s.actionBtn, s.saveBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleSave}
          >
            <Feather name="bookmark" size={14} color={isSaved ? colors.accentForeground : colors.foreground} />
            <Text style={[s.actionBtnText, s.saveBtnText]}>{isSaved ? "Saved" : "Save"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={openMaps}
          >
            <Feather name="map" size={14} color={colors.foreground} />
            <Text style={s.actionBtnText}>Open Maps</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
