// netlify/functions/create-printful-order.ts
import type { Context } from "@netlify/functions"; 

function dataURLtoBlob(dataurl: string): Blob {
  // ... (this function is unchanged) ...
  const arr = dataurl.split(',');
  if (arr.length < 2) { throw new Error('Invalid data URL'); }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) { throw new Error('Could not parse MIME type from data URL'); }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], { type: mime });
}

export default async (request: Request, context: Context) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  if (!PRINTFUL_API_KEY) {
    return new Response(JSON.stringify({ error: 'PRINTFUL_API_KEY is not set.' }), { status: 500 });
  }

  try {
    const { imageUrl, variantId } = await request.json();
    if (!imageUrl || !variantId) {
      return new Response(JSON.stringify({ error: 'Missing imageUrl or variantId' }), { status: 400 });
    }

    // --- THIS IS THE SUGGESTED CHANGE ---
    // 1. Validate image type
    // The app only generates PNGs, so we should only accept PNGs.
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('data:image/png;base64,')) {
        return new Response(JSON.stringify({ error: 'Invalid image format. Expected PNG data URL.' }), { status: 400 });
    }

    // 2. Validate image size (e.g., < 15MB)
    // This prevents abuse and oversized uploads.
    const base64Data = imageUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileSizeInMB = buffer.length / (1024 * 1024);

    if (fileSizeInMB > 15) { // 15MB limit
         return new Response(JSON.stringify({ error: 'Image file is too large (Max 15MB).' }), { status: 400 });
    }
    // --- END OF CHANGE ---

    const PRINTFUL_API_URL = 'https://api.printful.com';
    const AUTH_HEADERS = {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Upload Image
    console.log('Uploading file to Printful...');
    // We already have the buffer, but dataURLtoBlob is also fine
    const imageBlob = dataURLtoBlob(imageUrl); 
    const formData = new FormData();
    formData.append('file', imageBlob, 'artwork.png');

    const fileUploadResponse = await fetch(`${PRINTFUL_API_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PRINTFUL_API_KEY}` },
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      console.error('Printful file upload failed:', errorText);
      throw new Error(`Printful file API error (${fileUploadResponse.status})`);
    }

    const fileApiResult = await fileUploadResponse.json();
    const printfulFileUrl = fileApiResult.result.preview_url;
    console.log('File uploaded, URL:', printfulFileUrl);

    // 3. Create Draft Order
    const orderData = {
      items: [{
        variant_id: variantId,
        quantity: 1,
        files: [{ url: printfulFileUrl }],
      }],
      confirm: false,
    };

    const orderResponse = await fetch(`${PRINTFUL_API_URL}/orders`, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Printful order creation failed:', errorText);
      throw.new Error(`Printful order API error (${orderResponse.status})`);
    }

    const orderApiResult = await orderResponse.json();
    const checkoutUrl = orderApiResult.result.checkout_url;
    
    // 4. Send Checkout URL back
    return new Response(JSON.stringify({ checkoutUrl: checkoutUrl }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to create Printful order:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown server error' }), { status: 500 });
  }
};