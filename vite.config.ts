import path from 'path';
import { defineConfig } from 'vite'; 
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Function to extract hostname from a URL
const getHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
};

export default defineConfig(({ mode }) => {
    const deployPrimeUrl = process.env.DEPLOY_PRIME_URL;
    const allowedHosts: string[] = ['devserver-main--street-sketch.netlify.app'];

    if (deployPrimeUrl) {
      const hostname = getHostname(deployPrimeUrl);
      if (hostname) {
        allowedHosts.push(hostname);
      }
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        ...(allowedHosts.length > 0 && { allowedHosts }), // Conditionally add allowedHosts
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), 
        }
      }
    };
});