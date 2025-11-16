import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface AddressInputFormProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
}

const AddressInputForm: React.FC<AddressInputFormProps> = ({ 
  onSubmit, 
  isLoading, 
  buttonText = 'CREATE',
  buttonIcon = <Sparkles className="w-5 h-5 mr-2" />
}) => {
  const [address, setAddress] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isTouched, setIsTouched] = useState<boolean>(false);
  
  // Create a ref for the <input> element
  const inputRef = useRef<HTMLInputElement>(null);
  
  // This ref will hold the Google Autocomplete instance
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const validateAddress = (addr: string): boolean => {
    // A simple check to ensure it's a full-looking address
    return addr.trim().length > 10 && addr.includes(',');
  };

  useEffect(() => {
    setIsValid(validateAddress(address));
  }, [address]);
  
  // This new effect sets up the Google Autocomplete widget
  useEffect(() => {
    // Wait for the Google Maps script (and the input ref) to be ready
    if (window.google && window.google.maps && window.google.maps.places && inputRef.current) {
      
      // Create the Autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'], // Only search for addresses
          fields: ['formatted_address'], // Only request the data we need
        }
      );
      autocompleteRef.current = autocomplete;

      // Add a listener for when the user selects a place
      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          // Set our React state with the official, formatted address
          setAddress(place.formatted_address);
          setIsTouched(true);
        }
      });

      // Clean up the listener when the component unmounts
      return () => {
        if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    }
  }, [isLoading]); // We re-run this if `isLoading` changes, to re-enable the input

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    // Re-validate as the user types
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
  
  const handleBlur = () => {
    setIsTouched(true);
    // Also validate on blur
    setIsValid(validateAddress(address));
  };

  const showError = isTouched && !isValid && address.length > 0;

  return (
    // The form no longer needs a ref
    <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-full">
        <input
          ref={inputRef} // <-- Connect the ref to the input
          type="text"
          value={address}
          onChange={handleAddressChange}
          onBlur={handleBlur}
          placeholder="E.g., 1600 Amphitheatre Pkwy, Mountain View, CA"
          className={`w-full bg-white px-4 py-3 border rounded-lg focus:ring-2 focus:border-indigo-500 transition duration-200 ${
            showError ? 'border-red-500 ring-red-500/50' : 'border-slate-300 focus:ring-indigo-500'
          }`}
          disabled={isLoading}
          aria-invalid={showError}
          aria-describedby="address-error"
          autoComplete="off"
        />
        
        {/* The custom <ul> suggestion list is no longer needed.
          The Google Autocomplete widget will automatically create and manage its own.
        */}

        {showError && (
          <p id="address-error" className="text-red-600 text-sm mt-1" role="alert">
            Please enter a full address, e.g., Street, City, State.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
      >
        {buttonIcon}
        {isLoading ? 'Fetching...' : buttonText}
      </button>
    </form>
  );
};

export default AddressInputForm;