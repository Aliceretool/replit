import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LocationInput } from "@/components/LocationInput";
import { type GeoResult } from "@/services/geocoding";
import { type PersonLocation } from "@/services/routing";
import { useColors } from "@/hooks/useColors";

const PERSON_COLORS = ["#a855f7", "#8B5CF6", "#06B6D4", "#EC4899", "#22C55E", "#EAB308", "#EF4444", "#14B8A6"];

interface Props {
  person: PersonLocation;
  index: number;
  onChange: (updated: PersonLocation) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function PersonCard({ person, index, onChange, onRemove, canRemove }: Props) {
  const colors = useColors();
  const accentColor = PERSON_COLORS[index % PERSON_COLORS.length]!;
  const [showTo, setShowTo] = useState(!!person.to);

  const updateFrom = (result: GeoResult) => {
    onChange({ ...person, from: { lat: result.lat, lng: result.lng, address: result.shortName } });
  };
  const clearFrom = () => {
    onChange({ ...person, from: { lat: 0, lng: 0, address: "" } });
  };
  const updateTo = (result: GeoResult) => {
    onChange({ ...person, to: { lat: result.lat, lng: result.lng, address: result.shortName } });
  };
  const clearTo = () => {
    onChange({ ...person, to: undefined });
  };

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
    },
    dotText: {
      color: "#FFF",
      fontSize: 13,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    nameInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      paddingVertical: 0,
    },
    removePressable: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    addDestRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    addDestText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: "Inter_500Medium",
    },
  });

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.dot}>
          <Text style={s.dotText}>{index + 1}</Text>
        </View>
        <TextInput
          style={s.nameInput}
          value={person.name}
          onChangeText={(name) => onChange({ ...person, name })}
          placeholder={`Person ${index + 1}`}
          placeholderTextColor={colors.mutedForeground}
        />
        {canRemove && (
          <Pressable style={({ pressed }) => [s.removePressable, { opacity: pressed ? 0.7 : 1 }]} onPress={onRemove}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <LocationInput
        label="Starting from"
        value={person.from.address}
        placeholder="Home, office, or any address…"
        onSelect={updateFrom}
        onClear={clearFrom}
        icon="home"
      />

      {showTo ? (
        <View style={{ gap: 6 }}>
          <LocationInput
            label="Going to (optional)"
            value={person.to?.address ?? ""}
            placeholder="Destination after the meeting…"
            onSelect={updateTo}
            onClear={clearTo}
            icon="navigation"
          />
          {!person.to && (
            <Pressable onPress={() => setShowTo(false)} style={s.addDestRow}>
              <Feather name="x-circle" size={14} color={colors.mutedForeground} />
              <Text style={[s.addDestText, { color: colors.mutedForeground }]}>Remove destination</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable onPress={() => setShowTo(true)} style={({ pressed }) => [s.addDestRow, { opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="plus-circle" size={14} color={colors.primary} />
          <Text style={s.addDestText}>Add destination (optimize as a stop)</Text>
        </Pressable>
      )}
    </View>
  );
}

export { PERSON_COLORS };
