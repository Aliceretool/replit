import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RestaurantCard } from "@/components/RestaurantCard";
import { MeetingMap } from "@/components/MeetingMap";
import { type ScoredRestaurant, useApp } from "@/context/AppContext";
import { type Place, findRestaurantsNear } from "@/services/places";
import { getGeographicMidpoint, rankPlaces } from "@/services/routing";
import { useColors } from "@/hooks/useColors";

type Status = "loading" | "done" | "error" | "no_results";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { people, results, setResults, isSavedPlace, addSavedPlace, removeSavedPlace, saveMeeting } = useApp();

  const [status, setStatus] = useState<Status>("loading");
  const [statusMsg, setStatusMsg] = useState("Finding restaurants near everyone…");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const flatListRef = useRef<FlatList<ScoredRestaurant>>(null);
  const hasSaved = useRef(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const compute = useCallback(async () => {
    if (people.length === 0) {
      router.replace("/setup");
      return;
    }
    try {
      setStatus("loading");
      setStatusMsg("Calculating the fairest midpoint…");
      const midpoint = getGeographicMidpoint(people);

      setStatusMsg("Finding restaurants near everyone…");
      let places: Place[] = await findRestaurantsNear(midpoint.lat, midpoint.lng, 2000);

      if (places.length === 0) {
        places = await findRestaurantsNear(midpoint.lat, midpoint.lng, 4000);
      }

      if (places.length === 0) {
        setStatus("no_results");
        return;
      }

      setStatusMsg("Ranking by fairness…");
      const ranked = rankPlaces(places, people);
      const scored: ScoredRestaurant[] = ranked.slice(0, 15).map((s) => ({
        ...places.find((p) => p.id === s.placeId)!,
        scored: s,
      }));

      setResults(scored);
      setStatus("done");

      if (!hasSaved.current) {
        hasSaved.current = true;
        saveMeeting({
          id: makeId(),
          date: new Date().toISOString(),
          people,
          topResult: scored[0],
        });
      }
    } catch {
      setStatus("error");
    }
  }, [people, router, setResults, saveMeeting]);

  useEffect(() => {
    if (results.length > 0) {
      setStatus("done");
    } else {
      compute();
    }
  }, []);

  const midpoint = people.length > 0 ? getGeographicMidpoint(people) : null;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      position: "absolute",
      top: topPad + 8,
      left: 12,
      right: 12,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      ...(Platform.OS === "ios"
        ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }
        : { elevation: 3 }),
    },
    headerTitle: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      ...(Platform.OS === "ios"
        ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }
        : { elevation: 3 }),
    },
    headerTitleText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    headerSubText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    map: {
      height: 280,
    },
    loadingOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingTop: topPad,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingHorizontal: 40,
      paddingTop: topPad,
    },
    errorTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center",
    },
    errorText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
    retryBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    retryBtnText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.primaryForeground,
    },
    listHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      gap: 4,
    },
    listHeaderTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    listHeaderSub: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    cardWrapper: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    footer: {
      height: bottomPad + 20,
    },
  });

  if (status === "loading") {
    return (
      <View style={[s.container, s.loadingOverlay]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>{statusMsg}</Text>
      </View>
    );
  }

  if (status === "error" || status === "no_results") {
    return (
      <View style={[s.container, s.errorContainer]}>
        <Feather
          name={status === "no_results" ? "map-pin" : "wifi-off"}
          size={48}
          color={colors.mutedForeground}
        />
        <Text style={s.errorTitle}>
          {status === "no_results" ? "No restaurants found nearby" : "Something went wrong"}
        </Text>
        <Text style={s.errorText}>
          {status === "no_results"
            ? "We couldn't find restaurants near the midpoint. Try expanding the search or adjusting the locations."
            : "We couldn't reach the restaurant database. Please check your connection and try again."}
        </Text>
        <Pressable style={s.retryBtn} onPress={compute}>
          <Text style={s.retryBtnText}>Try Again</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={[s.errorText, { color: colors.primary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const top = results[0];
  const selectedPlace = results[selectedIdx];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        {top && (
          <View style={s.headerTitle}>
            <Text style={s.headerTitleText} numberOfLines={1}>
              Best spot: {top.name}
            </Text>
            <Text style={s.headerSubText}>max {top.scored.maxTravelMins} min travel</Text>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={results}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {midpoint && (
              <MeetingMap
                midpoint={midpoint}
                people={people}
                results={results}
                onSelectResult={(idx) => {
                  setSelectedIdx(idx);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
                }}
              />
            )}
            <View style={s.listHeader}>
              <Text style={s.listHeaderTitle}>
                {results.length} spot{results.length !== 1 ? "s" : ""} found
              </Text>
              <Text style={s.listHeaderSub}>
                Sorted by fairness — the top result minimises wait for everyone
              </Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={s.cardWrapper}>
            <RestaurantCard
              place={item}
              scored={item.scored}
              rank={index}
              isSaved={isSavedPlace(item.id)}
              onToggleSave={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isSavedPlace(item.id)) {
                  removeSavedPlace(item.id);
                } else {
                  addSavedPlace(item);
                }
              }}
            />
          </View>
        )}
        ListFooterComponent={<View style={s.footer} />}
        onScrollToIndexFailed={() => {}}
      />
    </View>
  );
}
