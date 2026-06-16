import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { type Place } from "@/services/places";
import { type PersonLocation, type ScoredPlace } from "@/services/routing";

export interface ScoredRestaurant extends Place {
  scored: ScoredPlace;
}

export interface SavedMeeting {
  id: string;
  date: string;
  people: PersonLocation[];
  topResult?: ScoredRestaurant;
}

interface AppContextValue {
  people: PersonLocation[];
  setPeople: (people: PersonLocation[]) => void;
  results: ScoredRestaurant[];
  setResults: (results: ScoredRestaurant[]) => void;
  savedPlaces: Place[];
  addSavedPlace: (place: Place) => void;
  removeSavedPlace: (id: string) => void;
  recentMeetings: SavedMeeting[];
  saveMeeting: (meeting: SavedMeeting) => void;
  clearCurrentMeeting: () => void;
  isSavedPlace: (id: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVED_PLACES_KEY = "@meetmidway/saved_places";
const RECENT_MEETINGS_KEY = "@meetmidway/recent_meetings";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<PersonLocation[]>([]);
  const [results, setResults] = useState<ScoredRestaurant[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<SavedMeeting[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_PLACES_KEY).then((raw) => {
      if (raw) setSavedPlaces(JSON.parse(raw));
    });
    AsyncStorage.getItem(RECENT_MEETINGS_KEY).then((raw) => {
      if (raw) setRecentMeetings(JSON.parse(raw));
    });
  }, []);

  const addSavedPlace = useCallback(
    (place: Place) => {
      const updated = [...savedPlaces.filter((p) => p.id !== place.id), place];
      setSavedPlaces(updated);
      AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    },
    [savedPlaces]
  );

  const removeSavedPlace = useCallback(
    (id: string) => {
      const updated = savedPlaces.filter((p) => p.id !== id);
      setSavedPlaces(updated);
      AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    },
    [savedPlaces]
  );

  const saveMeeting = useCallback(
    (meeting: SavedMeeting) => {
      const updated = [meeting, ...recentMeetings.slice(0, 9)];
      setRecentMeetings(updated);
      AsyncStorage.setItem(RECENT_MEETINGS_KEY, JSON.stringify(updated));
    },
    [recentMeetings]
  );

  const clearCurrentMeeting = useCallback(() => {
    setPeople([]);
    setResults([]);
  }, []);

  const isSavedPlace = useCallback((id: string) => savedPlaces.some((p) => p.id === id), [savedPlaces]);

  return (
    <AppContext.Provider
      value={{
        people,
        setPeople,
        results,
        setResults,
        savedPlaces,
        addSavedPlace,
        removeSavedPlace,
        recentMeetings,
        saveMeeting,
        clearCurrentMeeting,
        isSavedPlace,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
