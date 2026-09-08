import * as Location from "expo-location";

// Fallback coordinates (Johannesburg) used if permission is denied or unavailable
const FALLBACK_COORDS = { lng: 28.0473, lat: -26.2041 };

export async function getCurrentLocation(): Promise<{
  lng: number;
  lat: number;
  usedFallback: boolean;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("Location permission denied, using fallback coordinates");
      return { ...FALLBACK_COORDS, usedFallback: true };
    }

    const position = await Location.getCurrentPositionAsync({});
    return {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
      usedFallback: false,
    };
  } catch (error) {
    console.log("Location error, using fallback coordinates:", error);
    return { ...FALLBACK_COORDS, usedFallback: true };
  }
}
