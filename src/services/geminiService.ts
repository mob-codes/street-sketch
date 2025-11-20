// src/services/geminiService.ts

export interface StreetViewPov {
  heading: number;
  pitch: number;
  fov: number;
}

// UPDATED: Accepts string address OR LatLng object
export const fetchStreetViewImage = (
  location: string | google.maps.LatLng, 
  pov?: StreetViewPov
): { originalUrl: string } => {
  const apiKey = import.meta.env.VITE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('[geminiService] VITE_MAPS_API_KEY is not set.');
    throw new Error("VITE_MAPS_API_KEY is not set.");
  }
  
  let locationParam = '';
  
  if (typeof location === 'string') {
    locationParam = `location=${encodeURIComponent(location)}`;
  } else if (location && typeof location.lat === 'function') {
    // Handle Google Maps LatLng object
    locationParam = `location=${location.lat()},${location.lng()}`;
  }

  // We use 1024x768 for the 4:3 aspect ratio
  let streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=1024x768&${locationParam}&key=${apiKey}`;

  if (pov) {
    // Ensure integers/floats are formatted correctly
    streetViewUrl += `&heading=${pov.heading}&pitch=${pov.pitch}&fov=${pov.fov}`;
  }
  
  console.log('[geminiService] Built Street View URL:', streetViewUrl);
  return { originalUrl: streetViewUrl };
};