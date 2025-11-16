import { GoogleGenAI, Modality } from "@google/genai";

// Utility function to fetch an image from a URL and convert it to a base64 string
const imageUrlToBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
  console.log('[geminiService] Fetching image for conversion:', url);
  const response = await fetch(url);
  if (!response.ok) {
    console.error('[geminiService] Failed to fetch image:', response.status, response.statusText);
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  
  // Simple 404 check
  if (blob.type === 'image/png' && blob.size < 20000) {
      throw new Error("404: No Street View imagery available for this location.");
  }
  
  console.log('[geminiService] Image fetched and converted to blob.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        resolve({
            base64: result.split(',')[1],
            mimeType: blob.type
        });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// UPDATED: This function now accepts an optional 'pov' (Point of View) object
export interface StreetViewPov {
  heading: number;
  pitch: number;
  fov: number;
}

export const fetchStreetViewImage = (address: string, pov?: StreetViewPov): { originalUrl: string } => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('[geminiService] API_KEY environment variable is not set.');
    throw new Error("API_KEY environment variable is not set.");
  }
  
  // Start with the base URL
  let streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${encodeURIComponent(address)}&key=${apiKey}`;

  // If POV is provided, add the parameters
  if (pov) {
    streetViewUrl += `&heading=${pov.heading}&pitch=${pov.pitch}&fov=${pov.fov}`;
  }
  
  console.log('[geminiService] Built Street View URL:', streetViewUrl);
  return { originalUrl: streetViewUrl };
};

// This function (stylizeImage) is unchanged and perfect
export const stylizeImage = async (streetViewUrl: string, artStyle: string): Promise<{ generatedUrl: string }> => {
  console.log('[geminiService] stylizeImage called with:', artStyle);
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('[geminiService] API_KEY environment variable is not set.');
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const { base64: base64Image, mimeType } = await imageUrlToBase64(streetViewUrl);

  let styleDescription = '';
  switch (artStyle) {
    case 'Oil Painting':
      styleDescription = 'transform the result into a rich and textured oil painting. The style should feature visible, impasto brushstrokes and a deep color palette.';
      break;
    case 'Pencil Sketch':
      styleDescription = 'transform the result into a detailed pencil sketch. The style should be monochromatic, emphasizing lines, shading, and texture to create a hand-drawn, artistic feel.';
      break;
    case 'Watercolor':
    default:
      styleDescription = 'transform the result into a vibrant and artistic watercolor painting. The style should be loose and expressive, with visible brushstrokes and color bleeds, typical of a real watercolor painting.';
      break;
  }

  const prompt = `
    Analyze the provided street view image of a property.
    
    First, digitally remove all transient Street View objects 
    specifacally people, moving or parked cars, bicycles, and garbage cans to create a clean, timeless,
    architectural front-on view of the property and its immediate, natural surroundings (trees, sky, lawn) that fade to white. 
    
    Do not remove aesthetic features: flag poles, fences, trees or bushes, and don't add any that aren't present.
    
    After cleaning the image, ${styleDescription} Ensure the final output is only the generated image itself, with no text or borders.
  `;

  console.log('[geminiService] Calling Gemini API for stylization...');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  console.log('[geminiService] Gemini API response received.');

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      console.log('[geminiService] Image data found in response.');
      const base64ImageBytes: string = part.inlineData.data;
      const generatedMimeType = part.inlineData.mimeType;
      return {
        generatedUrl: `data:${generatedMimeType};base64,${base64ImageBytes}`
      };
    }
  }

  console.error('[geminiService] No image data found in Gemini response.');
  throw new Error("No image was generated by the API.");
};