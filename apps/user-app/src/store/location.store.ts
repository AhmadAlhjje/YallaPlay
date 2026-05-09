import { create } from 'zustand';
import * as Location from 'expo-location';
import { usersApi } from '../api/users.api';

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  permissionGranted: boolean;
  requestLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  permissionGranted: false,

  requestLocation: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ permissionGranted: false });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      set({ coords, permissionGranted: true });

      // Update server-side location for nearby search
      await usersApi.updateLocation(coords.longitude, coords.latitude);
    } catch {
      // Location unavailable — searches fall back to no geo filter
    }
  },
}));
