import Mapbox, { Camera, CircleLayer, MapView, MarkerView, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PERSON_COLORS } from "@/components/PersonCard";
import { type ScoredRestaurant } from "@/context/AppContext";
import { type PersonLocation } from "@/services/routing";
import { useColors } from "@/hooks/useColors";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
Mapbox.setAccessToken(TOKEN);

interface Props {
  midpoint: { lat: number; lng: number };
  people: PersonLocation[];
  results: ScoredRestaurant[];
  onSelectResult: (index: number) => void;
}

export function MeetingMap({ midpoint, people, results, onSelectResult }: Props) {
  const colors = useColors();

  const midpointGeoJson: GeoJSON.Feature<GeoJSON.Point> = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [midpoint.lng, midpoint.lat] },
    properties: {},
  };

  return (
    <MapView style={styles.map} styleURL={Mapbox.StyleURL.Street} logoEnabled={false} attributionEnabled={false} scaleBarEnabled={false}>
      <Camera
        centerCoordinate={[midpoint.lng, midpoint.lat]}
        zoomLevel={12}
        animationMode="none"
      />

      {/* Midpoint pulse circle */}
      <ShapeSource id="midpoint-src" shape={midpointGeoJson}>
        <CircleLayer
          id="midpoint-circle-outer"
          style={{ circleRadius: 22, circleColor: "rgba(253,220,254,0.35)", circleStrokeWidth: 1.5, circleStrokeColor: "rgba(168,85,247,0.5)" }}
        />
        <CircleLayer
          id="midpoint-circle-inner"
          style={{ circleRadius: 6, circleColor: colors.primary, circleStrokeWidth: 2, circleStrokeColor: "#fff" }}
        />
      </ShapeSource>

      {/* Person origin pins */}
      {people.map((person, idx) => (
        <MarkerView
          key={`person-${person.id}`}
          coordinate={[person.from.lng, person.from.lat]}
        >
          <View style={[styles.personPin, { backgroundColor: PERSON_COLORS[idx % PERSON_COLORS.length] }]}>
            <Text style={styles.personPinText}>{idx + 1}</Text>
          </View>
        </MarkerView>
      ))}

      {/* Restaurant pins */}
      {results.slice(0, 8).map((r, idx) => (
        <MarkerView
          key={`restaurant-${r.id}`}
          coordinate={[r.lng, r.lat]}
        >
          <View
            style={[
              styles.restaurantPin,
              {
                backgroundColor: idx === 0 ? colors.primary : colors.card,
                borderColor: idx === 0 ? colors.primary : colors.border,
              },
            ]}
            onTouchEnd={() => onSelectResult(idx)}
          >
            <Text style={[styles.restaurantPinText, { color: idx === 0 ? "#fff" : colors.foreground }]}>
              {idx + 1}
            </Text>
          </View>
        </MarkerView>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 300 },
  personPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  personPinText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  restaurantPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  restaurantPinText: { fontSize: 11, fontWeight: "700" },
});
