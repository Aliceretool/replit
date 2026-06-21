import { Feather } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { type GeoResult, searchLocation } from "@/services/geocoding";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  placeholder?: string;
  onSelect: (result: GeoResult) => void;
  onClear: () => void;
  icon?: keyof typeof Feather.glyphMap;
}

export function LocationInput({ label, value, placeholder, onSelect, onClear, icon = "map-pin" }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState(value ? "" : "");
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocation(text);
      setSuggestions(results);
      setIsSearching(false);
    }, 500);
  }, []);

  const handleSelect = useCallback(
    (result: GeoResult) => {
      setQuery("");
      setSuggestions([]);
      setIsEditing(false);
      Keyboard.dismiss();
      onSelect(result);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setIsEditing(false);
    onClear();
  }, [onClear]);

  const s = StyleSheet.create({
    wrapper: { gap: 4 },
    label: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
      color: colors.mutedForeground,
      fontFamily: "SpaceGrotesk_600SemiBold",
    },
    inputRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: colors.radius - 2,
      borderWidth: 1.5,
      borderColor: isEditing ? colors.primary : colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inputText: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "SpaceGrotesk_400Regular",
    },
    placeholderText: {
      flex: 1,
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "SpaceGrotesk_400Regular",
    },
    valueText: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "SpaceGrotesk_500Medium",
    },
    dropdown: {
      backgroundColor: colors.card,
      borderRadius: colors.radius - 2,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden" as const,
      ...(Platform.OS === "ios"
        ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 }
        : { elevation: 6 }),
    },
    suggestion: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "SpaceGrotesk_400Regular",
      lineHeight: 20,
    },
  });

  return (
    <View style={s.wrapper}>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={() => !value && setIsEditing(true)}>
        <View style={s.inputRow}>
          <Feather name={icon} size={16} color={isEditing ? colors.primary : colors.mutedForeground} />
          {isEditing || !value ? (
            <TextInput
              style={s.inputText}
              value={query}
              onChangeText={handleChangeText}
              placeholder={placeholder ?? "Search for a location…"}
              placeholderTextColor={colors.mutedForeground}
              autoFocus={isEditing}
              onFocus={() => setIsEditing(true)}
              returnKeyType="search"
            />
          ) : (
            <Text style={s.valueText} numberOfLines={1}>
              {value}
            </Text>
          )}
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : value ? (
            <Pressable hitSlop={10} onPress={handleClear}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </Pressable>

      {suggestions.length > 0 && isEditing && (
        <View style={s.dropdown}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
            {suggestions.map((result) => (
              <Pressable
                key={result.placeId}
                style={({ pressed }) => [s.suggestion, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleSelect(result)}
              >
                <Text style={s.suggestionText}>{result.shortName}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
