// src/components/AddressInputForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useGoogleMaps } from '../contexts/GoogleMapsContext'; // <--- UPDATED: Import Hook

interface AddressInputFormProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  initialValue?: string;
}

const AddressInputForm: React.FC<AddressInputFormProps> = ({ 
  onSubmit, 
  isLoading, 
  buttonText = 'CREATE',
  buttonIcon = <Sparkles className="w-5 h-5 mr-2" />,
  initialValue = '' 
}) => {
  const { isLoaded } = useGoogleMaps(); // <--- UPDATED: Get loaded state
  const [address, setAddress] = useState<string>(initialValue); 
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isTouched, setIsTouched] = useState<boolean>(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const validateAddress = (addr: string): boolean => {
    return addr.trim().length > 10 && addr.includes(',');
  };

  useEffect(() => {
    setAddress(initialValue);
  }, [initialValue]);
  
  useEffect(() => {
    // 1. Check if the input ref is ready AND Google Maps is loaded
    if (!inputRef.current || !isLoaded) { // <--- UPDATED: Check isLoaded
      return;
    }
    
    const setupAutocomplete = async () => {
      try {
        if (window.google && window.google.maps) {
          const { Autocomplete } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

          // Prevent multiple instances
          if (autocompleteRef.current) return; 

          autocompleteRef.current = new Autocomplete(
            inputRef.current,
            {
              types: ['address'],
              fields: ['formatted_address'],
            }
          );

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place && place.formatted_address) {
              setAddress(place.formatted_address);
              setIsTouched(true);
              setIsValid(validateAddress(place.formatted_address));
            }
          });
        }
      } catch (error) {
        console.error("Error loading Google Places library", error);
      }
    };

    setupAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        // Note: Google Maps instances don't strictly need "destruction", but clearing listeners is good practice
      }
    };
  }, [isLoading, isLoaded]); // <--- UPDATED: Add isLoaded to dependency array


  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (isTouched) {
      setIsValid(validateAddress(e.target.value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTouched(true);
    
    const finalValid = validateAddress(address);
    setIsValid(finalValid);

    if (finalValid && !isLoading) {
      onSubmit(address);
    }
  };
  
  constSX_handleBlur = () => {
    setIsTouched(true);
    setIsValid(validateAddress(address));
  };

  const showError = isTouched && !isValid && address.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-full">
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={handleAddressChange}
          onBlur={handleBlur}
          placeholder={isLoaded ? "E.g., 1600 Amphitheatre Pkwy, Mountain View, CA" : "Loading maps..."} 
          className={`w-full bg-white px-4 py-3 border rounded-lg focus:ring-2 focus:border-indigo-500 transition duration-200 ${
            showError ? 'border-red-500 ring-red-500/50' : 'border-slate-300 focus:ring-indigo-500'
          }`}
          disabled={isLoading || !isLoaded} // <--- UPDATED: Disable while map loads
          aria-invalid={showError}
          autoComplete="off"
        />
        
        {showError && (
          <p className="text-red-600 text-sm mt-1" role="alert">
            Please enter a full address, e.g., Street, City, State.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading || (isTouched && !isValid) || !isLoaded}
        className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
      >
        {buttonIcon}
        {isLoading ? 'Fetching...' : buttonText}
      </button>
    </form>
  );
};

export default AddressInputForm;