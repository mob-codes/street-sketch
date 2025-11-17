// src/services/geminiService.ts

// This interface is used by App.tsx
export interface StreetViewPov {
  heading: number;
  pitch: number;
  fov: number;
}

export const fetchStreetViewImage = (address: string, pov?: StreetViewPov): { originalUrl: string } => {
  // Vite replaces this with your VITE_MAPS_API_KEY from Netlify
  const apiKey = import.meta.env.VITE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('[geminiService] VITE_MAPS_API_KEY is not set.');
    throw new Error("VITE_MAPS_API_KEY is not set.");
  }
  
  // === UPDATED ===
  // We now request a 1024x768 image, which is a high-res 4:3 aspect ratio.
  let streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=1024x768&location=${encodeURIComponent(address)}&key=${apiKey}`;

  if (pov) {
    streetViewUrl += `&heading=${pov.heading}&pitch=${pov.pitch}&fov=${pov.fov}`;
  }
  
  console.log('[geminiService] Built Street View URL:', streetViewUrl);
  return { originalUrl: streetViewUrl };
};