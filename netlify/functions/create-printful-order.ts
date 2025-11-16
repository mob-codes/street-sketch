// netlify/functions/create-printful-order.ts

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Helper function to convert data URL to a Blob
// This is needed for uploading to the Printful File API
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  if (arr.length < 2) {
    throw new Error('Invalid data URL');
  }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Could not parse MIME type from data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// The main serverless function handler
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // 1. Get API Key and Parse Request
  // ---
  // NEVER expose this key on the frontend.
  // We get it from Netlify's environment variables.
  const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  if (!PRINTFUL_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'PRINTFUL_API_KEY is not set.' }),
    };
  }

  const { imageUrl, variantId } = JSON.parse(event.body || '{}');
  if (!imageUrl || !variantId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing imageUrl or variantId' }),
    };
  }

  const PRINTFUL_API_URL = 'https://api.printful.com';
  const AUTH_HEADERS = {
    'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // 2. Upload Image to Printful File API
    // ---
    // We must first upload the image file to Printful
    // before we can use it in an order.
    
    console.log('Uploading file to Printful...');
    
    const imageBlob = dataURLtoBlob(imageUrl);
    const formData = new FormData();
    // 'artwork.png' is just a placeholder filename
    formData.append('file', imageBlob, 'artwork.png');

    const fileUploadResponse = await fetch(`${PRINTFUL_API_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        // Note: No 'Content-Type' header here,
        // fetch will set the correct 'multipart/form-data' boundary.
      },
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
    // ---
    // Now we create the order using the file URL from step 2.
    // We set 'confirm: false' to create a draft and get a checkout_url.
    
    console.log('Creating draft order...');
    
    const orderData = {
      // We don't have a recipient, which is fine!
      // Printful will ask the user for it at the checkout_url.
      items: [
        {
          variant_id: variantId, // The ID for "Postcard" or "Small Print"
          quantity: 1,
          files: [
            {
              url: printfulFileUrl, // The URL from the File API response
            },
          ],
        },
      ],
      // This is the magic part:
      // 'confirm: false' creates a draft order
      // and returns a 'checkout_url'
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
      throw new Error(`Printful order API error (${orderResponse.status})`);
    }

    const orderApiResult = await orderResponse.json();
    const checkoutUrl = orderApiResult.result.checkout_url;
    console.log('Draft order created! Checkout URL:', checkoutUrl);
    
    // 4. Send Checkout URL back to Frontend
    // ---
    return {
      statusCode: 200,
      body: JSON.stringify({ checkoutUrl: checkoutUrl }),
    };

  } catch (error) {
    console.error('Failed to create Printful order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown server error' }),
    };
  }
};

export { handler };