import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';

interface AddressInputFormProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
  // NEW: Props to customize the button
  buttonText?: string;
  buttonIcon?: React.ReactNode;
}

const AddressInputForm: React.FC<AddressInputFormProps> = ({ 
  onSubmit, 
  isLoading, 
  buttonText = 'CREATE', // Default text
  buttonIcon = <Sparkles className="w-5 h-5 mr-2" /> // Default icon
}) => {
  const [address, setAddress] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isTouched, setIsTouched] = useState<boolean>(false);
  
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);

  const validateAddress = (addr: string): boolean => {
    return addr.trim().length > 10 && addr.includes(',');
  };

  useEffect(() => {
    setIsValid(validateAddress(address));
  }, [address]);
  
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (formRef.current && !formRef.current.contains(event.target as Node)) {
            setSuggestions([]);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = useCallback((value: string) => {
    if (autocompleteService.current && value.length > 2) {
      autocompleteService.current.getPlacePredictions(
        { input: value },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } else {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(address);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [address, fetchSuggestions]);


  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
  };

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    setAddress(suggestion.description);
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTouched(true);
    
    let finalAddress = address;
    if (suggestions.length > 0) {
      finalAddress = suggestions[0].description;
      setAddress(finalAddress);
    }
    
    setSuggestions([]);
    
    const finalValid = validateAddress(finalAddress);
    setIsValid(finalValid);

    if (finalValid && !isLoading) {
      onSubmit(finalAddress);
    }
  };
  
  const handleBlur = () => {
    setIsTouched(true);
  };

  const showError = isTouched && !isValid && address.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4" ref={formRef}>
      <div className="w-full">
        <input
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
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full sm:w-[calc(100%-150px)] bg-white border border-slate-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li 
                key={suggestion.place_id || index} 
                className="px-4 py-2 cursor-pointer hover:bg-indigo-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
              >
                {suggestion.description}
              </li>
            ))}
          </ul>
        )}
        {showError && (
          <p id="address-error" className="text-red-600 text-sm mt-1" role="alert">
            Please enter a full address, e.g., Street, City, State.
          </p>
        )}
      </div>
      {/* UPDATED: Button now uses props */}
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