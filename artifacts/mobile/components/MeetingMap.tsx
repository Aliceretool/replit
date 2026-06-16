import React from "react";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { StyleSheet } from "react-native";
import { PERSON_COLORS } from "@/components/PersonCard";
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
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: midpoint.lat,
        longitude: midpoint.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }}
    >
      {people.map((person, idx) => (
        <Marker
          key={person.id}
          coordinate={{ latitude: person.from.lat, longitude: person.from.lng }}
          title={person.name}
          pinColor={PERSON_COLORS[idx % PERSON_COLORS.length]}
        />
      ))}
      {results.slice(0, 5).map((r, idx) => (
        <Marker
          key={r.id}
          coordinate={{ latitude: r.lat, longitude: r.lng }}
          title={r.name}
          pinColor={idx === 0 ? colors.primary : "#8B8B9A"}
          onPress={() => onSelectResult(idx)}
        />
      ))}
      <Circle
        center={{ latitude: midpoint.lat, longitude: midpoint.lng }}
        radius={300}
        fillColor="rgba(249,115,22,0.10)"
        strokeColor="rgba(249,115,22,0.35)"
        strokeWidth={1.5}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 280 },
});
