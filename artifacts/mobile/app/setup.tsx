import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonCard } from "@/components/PersonCard";
import { useApp } from "@/context/AppContext";
import { type PersonLocation } from "@/services/routing";
import { useColors } from "@/hooks/useColors";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makePerson(index: number): PersonLocation {
  return {
    id: makeId(),
    name: `Person ${index + 1}`,
    from: { lat: 0, lng: 0, address: "" },
  };
}

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setPeople } = useApp();

  const [people, setLocalPeople] = useState<PersonLocation[]>([makePerson(0), makePerson(1)]);

  const addPerson = () => {
    if (people.length >= 8) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalPeople((prev) => [...prev, makePerson(prev.length)]);
  };

  const removePerson = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePerson = (id: string, updated: PersonLocation) => {
    setLocalPeople((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleFind = () => {
    const missing = people.filter((p) => !p.from.address || p.from.lat === 0);
    if (missing.length > 0) {
      Alert.alert(
        "Missing Locations",
        `Please enter a starting location for: ${missing.map((p) => p.name).join(", ")}`,
        [{ text: "OK" }]
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPeople(people);
    router.push("/results");
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    titleBlock: { flex: 1 },
    title: {
      fontSize: 20,
      fontWeight: "700" as const,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.foreground,
    },
    subtitle: {
      fontSize: 13,
      fontFamily: "SpaceGrotesk_400Regular",
      color: colors.mutedForeground,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 120,
      gap: 12,
    },
    addPersonBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: colors.radius,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderStyle: "dashed",
    },
    addPersonText: {
      fontSize: 15,
      fontFamily: "SpaceGrotesk_600SemiBold",
      color: colors.primary,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingBottom: bottomPad + 16,
      paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    findBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 17,
      ...(Platform.OS === "ios"
        ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }
        : { elevation: 5 }),
    },
    findBtnText: {
      fontSize: 17,
      fontWeight: "700" as const,
      fontFamily: "SpaceGrotesk_700Bold",
      color: colors.primaryForeground,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={s.titleBlock}>
          <Text style={s.title}>Plan a Meeting</Text>
          <Text style={s.subtitle}>{people.length} people · tap a name to edit</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {people.map((person, index) => (
            <PersonCard
              key={person.id}
              person={person}
              index={index}
              onChange={(updated) => updatePerson(person.id, updated)}
              onRemove={() => removePerson(person.id)}
              canRemove={people.length > 2}
            />
          ))}

          {people.length < 8 && (
            <Pressable
              style={({ pressed }) => [s.addPersonBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={addPerson}
            >
              <Feather name="user-plus" size={16} color={colors.primary} />
              <Text style={s.addPersonText}>Add another person</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <Pressable
          style={({ pressed }) => [s.findBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={handleFind}
        >
          <Feather name="search" size={18} color={colors.primaryForeground} />
          <Text style={s.findBtnText}>Find the Perfect Spot</Text>
        </Pressable>
      </View>
    </View>
  );
}
