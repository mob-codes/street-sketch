import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* This Provider wrapper is REQUIRED for AddressInputForm to work */}
    <GoogleMapsProvider>
      <App />
    </GoogleMapsProvider>
  </React.StrictMode>
);