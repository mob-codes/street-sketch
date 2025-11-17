// src/App.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fetchStreetViewImage, StreetViewPov } from './services/geminiService';
import AddressInputForm from './components/AddressInputForm';
import LoadingSpinner from './components/LoadingSpinner';
import ActionButton from './components/ActionButton';
import FilterOptions from './components/FilterOptions';
import PovSlider from './components/PovSlider';
import { 
  Download, ShoppingCart, Loader2, Wand2, 
  MoveVertical, ArrowLeftRight, Search, RefreshCcw, MapPin, Camera
} from 'lucide-react'; 
import logoImage from '/street-sketch_logo.webp'; 

// ... (dataURLtoBlob function is unchanged) ...
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  if (arr.length < 2) { throw new Error('Invalid data URL'); }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) { throw new Error('Could not parse MIME type'); }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], { type: mime });
}


type AppStep = 'initial' | 'framing' | 'generating' | 'done';

const productVariants = [
  { name: 'Postcard (4" x 6")', id: 7674 },
  { name: 'Small Print (8" x 10")', id: 10110 },
  { name: 'Medium Print (12" x 16")', id: 10113 },
  { name: 'Large Print (18" x 24")', id: 10116 },
];

// Custom hook for polling
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const App: React.FC = () => {
  const [address, setAddress] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isStylizing, setIsStylizing] = useState<boolean>(false); // This is now the "generating" state
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [artStyle, setArtStyle] = useState<string>('Watercolor');
  const [selectedVariantId, setSelectedVariantId] = useState<number>(productVariants[0].id);
  const [appStep, setAppStep] = useState<AppStep>('initial');

  const [heading, setHeading] = useState(90);
  const [pitch, setPitch] = useState(0);
  const [fov, setFov] = useState(120);

  // === NEW STATE FOR POLLING ===
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const pollCountRef = useRef<number>(0);
  // === END OF NEW STATE ===

  const step2Ref = useRef<HTMLDivElement>(null);
  const finalResultRef = useRef<HTMLDivElement>(null);

  // ... (handleStartOver and handleRecapture are unchanged) ...
  const handleStartOver = () => {
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    setAddress('');
    setOriginalImageUrl(null);
    setGeneratedImageUrl(null);
    setIsFetching(false);
    setIsStylizing(false);
    setIsPurchasing(false);
    setError(null);
    setAppStep('initial');
    setJobId(null); // Clear job
    setIsPolling(false); // Stop polling
    pollCountRef.current = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleRecapture = () => {
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    setGeneratedImageUrl(null);
    setAppStep('framing'); 
    setError(null);
    setJobId(null); // Clear job
    setIsPolling(false); // Stop polling
    pollCountRef.current = 0;
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };


  // ... (handleAddressSubmit and useEffect for fetchStreetViewImage are unchanged) ...
  const handleAddressSubmit = useCallback(async (newAddress: string) => {
    console.log('[App.tsx] handleAddressSubmit called with:', newAddress);
    if (!newAddress.trim()) {
      setError('Please enter a valid address.');
      return;
    }
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    setIsFetching(true);
    setError(null);
    setGeneratedImageUrl(null);
    setOriginalImageUrl(null);
    setAppStep('framing'); 
    setHeading(90);
    setPitch(0);
    setFov(120);
    setAddress(newAddress);
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [generatedImageUrl]);

  useEffect(() => {
    if (appStep === 'framing' && address) {
      setIsFetching(true);
      setError(null);
      try {
        const pov: StreetViewPov = { heading, pitch, fov };
        const { originalUrl } = fetchStreetViewImage(address, pov);
        setOriginalImageUrl(originalUrl);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        setIsFetching(false);
      }
    }
  }, [address, heading, pitch, fov, appStep]);


  // === UPDATED handleStylizeImage ===
  // This now *starts* the job and *starts* polling
  const handleStylizeImage = useCallback(async () => {
    if (!originalImageUrl) return;
    
    console.log('[App.tsx] handleStylizeImage called');
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    
    const newJobId = crypto.randomUUID(); // Generate a unique ID on the client
    setJobId(newJobId);
    setAppStep('generating'); 
    setIsStylizing(true); // This shows the spinner
    setIsPolling(true); // This starts the polling interval
    pollCountRef.current = 0; // Reset poll count
    setError(null);

    try {
      // Call the NEW background function
      const response = await fetch('/.netlify/functions/stylize-run-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streetViewUrl: originalImageUrl,
          artStyle: artStyle,
          jobId: newJobId, // Send the job ID
        }),
      });

      // A 202 "Accepted" response is expected from a background function
      if (response.status !== 202) {
        throw new Error("Failed to start the image generation job.");
      }
      
      console.log('Job started successfully. Now polling...');
      // Polling will handle the rest (see the useInterval hook)

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to start the job: ${errorMessage}`);
      setAppStep('framing'); // Go back to framing step
      setIsStylizing(false);
      setIsPolling(false);
    }
  }, [originalImageUrl, artStyle, generatedImageUrl]);
  // === END OF UPDATED FUNCTION ===


  // === NEW POLLING LOGIC ===
  useInterval(() => {
    // This function runs every 3 seconds IF isPolling is true
    const checkJobStatus = async () => {
      if (!jobId) {
        setIsPolling(false);
        return;
      }
      
      pollCountRef.current += 1; // Increment poll count

      // Timeout after 40 polls (2 minutes)
      if (pollCountRef.current > 40) {
        setIsPolling(false);
        setIsStylizing(false);
        setAppStep('framing');
        setError("The request timed out. Please try again.");
        return;
      }

      try {
        const response = await fetch(`/.netlify/functions/stylize-check?jobId=${jobId}`);
        
        // If status is 200, the job is complete
        if (response.status === 200) {
          const data = await response.json();
          if (data.status === 'complete') {
            console.log("Polling success: Job is complete!");
            setIsPolling(false);
            setIsStylizing(false);
            
            const blob = dataURLtoBlob(data.generatedUrl);
            const blobUrl = URL.createObjectURL(blob);
            setGeneratedImageUrl(blobUrl);
            setAppStep('done');
            
            setTimeout(() => {
              finalResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        } else if (response.status === 500) {
          // The job failed
          const data = await response.json();
          console.error("Polling error: Job failed", data.message);
          setIsPolling(false);
          setIsStylizing(false);
          setAppStep('framing');
          setError(`Image generation failed: ${data.message}`);
        }
        // If status is 202, we just keep polling (do nothing)
        
      } catch (e) {
        console.error("Polling request failed:", e);
        // Don't stop polling on a single failed network request, just try again
      }
    };
    
    checkJobStatus();
  }, isPolling ? 3000 : null); // Run every 3 seconds, or not at all
  // === END OF NEW POLLING LOGIC ===


  // ... (handleDownload and handlePurchase are unchanged) ...
  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    const fileName = address.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'artwork';
    link.download = `${fileName}_${artStyle.toLowerCase().replace(' ','_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePurchase = async () => {
    if (!generatedImageUrl) return;
    setIsPurchasing(true);
    setError(null);
    let dataUrlForPurchase: string;
    try {
        const blobResponse = await fetch(generatedImageUrl);
        const blob = await blobResponse.blob();
        dataUrlForPurchase = await new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => resolve(reader.result as string);
             reader.onerror = reject;
             reader.readAsDataURL(blob);
        });
    } catch (e) {
         console.error('Failed to convert blob back to data URL for purchase:', e);
         setError('Purchase failed. Please try again.');
         setIsPurchasing(false);
         return;
    }
    try {
      const response = await fetch('/.netlify/functions/create-printful-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: dataUrlForPurchase,
          variantId: selectedVariantId,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create purchase link.');
      }
      const { checkoutUrl } = await response.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Could not retrieve checkout URL.');
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Purchase failed: ${errorMessage} Please try again.`);
      setIsPurchasing(false);
    }
  };


  const isLoading = isFetching || isStylizing;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col items-center pt-16 pb-4 px-4 sm:px-6 lg:px-8">
      
      {/* --- HEADER (Unchanged) --- */}
      {appStep !== 'generating' && appStep !== 'done' && (
        <header className="text-center mb-6 w-full max-w-4xl">
          <img src={logoImage} alt="StreetSketch Logo" className="w-40 h-40 mx-auto mb-4 rounded-full shadow-lg border-4 border-white" />
          <h1 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 leading-tight">
            Turn your favorite place into beautiful art.
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Enter a location then frame and stylize your shot.
          </p>
        </header>
      )}
      {(appStep === 'generating' || appStep === 'done') && (
        <header className="text-center mb-6 w-full max-w-4xl">
           <img src={logoImage} alt="StreetSketch Logo" className="w-40 h-40 mx-auto mb-4 rounded-full shadow-lg border-4 border-white" />
        </header>
      )}
      
      <main className="w-full max-w-4xl">
        {/* --- STEP 1 (Unchanged) --- */}
        {(appStep === 'initial' || appStep === 'framing') && (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Step 1: Choose a Location</h3>
            <AddressInputForm 
              onSubmit={handleAddressSubmit} 
              isLoading={isFetching} 
              buttonText="Locate"
              buttonIcon={<MapPin className="w-5 h-5 mr-2" />}
            />
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Oh no!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {/* === STEP 2 (FRAMING) - UI FIXES APPLIED === */}
        {appStep === 'framing' && (
          <div className="mt-8 animate-fade-in" ref={step2Ref}>
            <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Step 2: Frame Your Shot</h3>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center">

              {/* Column 1: Image and Rotate Slider */}
              <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Image Container */}
                <div className="relative w-full aspect-video bg-slate-200 rounded-xl shadow-lg border-4 border-white overflow-hidden">
                  {originalImageUrl && (
                    <img 
                      src={originalImageUrl} 
                      alt="Original Street View" 
                      className="w-full h-full object-cover"
                      onLoad={() => setIsFetching(false)}
                      onError={() => {
                        setError("Could not find a Street View image for this address.");
                        setIsFetching(false);
                      }}
                    />
                  )}
                  {isFetching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Horizontal Rotate Slider (MOVED) */}
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  <PovSlider 
                    label="Rotate" 
                    icon={<ArrowLeftRight className="w-4 h-4" />}
                    value={heading} 
                    onChange={setHeading} 
                    min={0} 
                    max={360}
                    orientation="horizontal"
                  />
                </div>
              </div>

              {/* Column 2: Vertical Sliders (side-by-side) */}
              <div className="flex-shrink-0 flex flex-row justify-center items-start gap-6 p-4 bg-white rounded-xl shadow-lg">
                <PovSlider 
                  label="Tilt" 
                  icon={<MoveVertical className="w-5 h-5" />}
                  value={pitch} 
                  onChange={setPitch} 
                  min={-90} 
                  max={90}
                  orientation="vertical"
                />
                <PovSlider 
                  label="Zoom" 
                  icon={<Search className="w-5 h-5" />}
                  value={fov} 
                  onChange={setFov} 
                  min={10}  /* <-- THE FIX: min must be the smaller number */
                  max={120} /* <-- THE FIX: max must be the larger number */
                  orientation="vertical"
                />
              </div>
            </div>
            
            {/* === STEP 3: RE-ORDERED === */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 sm:p-8">
              {/* 1. Title */}
              <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Step 3: Choose Your Style</h3>
              
              {/* 2. Stylize CTA (MOVED UP) */}
              <div className="mt-6 flex justify-center">
                <ActionButton
                  onClick={handleStylizeImage}
                  text={`Stylize in ${artStyle}!`}
                  icon={<Wand2 className="w-5 h-5 mr-2" />}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={isStylizing || isFetching}
                />
              </div>

              {/* 3. Style Options (MOVED DOWN) */}
              <FilterOptions 
                selectedStyle={artStyle} 
                onStyleChange={setArtStyle} 
                isLoading={isLoading}
              />
            </div>

          </div>
        )}
        {/* === END OF STEP 2/3 (FRAMING) === */}

        {/* Generating Spinner (Unchanged, but text is updated) */}
        {appStep === 'generating' && (
          <div className="flex flex-col items-center justify-center min-h-[300px] animate-fade-in">
            <LoadingSpinner 
              mainText="Generating your artwork..." 
              subText="This may take up to 30 seconds"
              size="large" 
            />
          </div>
        )}

        {/* === STEP 4 (DONE) - REORDERED === */}
        {appStep === 'done' && generatedImageUrl && (
          <div className="mt-8 animate-fade-in" ref={finalResultRef}>
            <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Your {artStyle} Masterpiece</h3>
              <img 
                src={generatedImageUrl} 
                alt={`Generated ${artStyle}`}
                className="rounded-xl shadow-2xl border-4 border-white object-cover aspect-video"
              />
            </div>
            
            {/* 1. Download Button */}
            <div className="mt-8 flex justify-center">
              <ActionButton
                onClick={handleDownload}
                text="Download for Free"
                icon={<Download className="w-5 h-5 mr-2" />}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isPurchasing}
              />
            </div>

            {/* 2. Select Product */}
            <div className="mt-6 max-w-sm mx-auto">
              {/* UPDATED: Added text-center to label */}
              <label htmlFor="product" className="block text-sm font-medium text-slate-700 text-center">
                Select Product
              </label>
              <select
                id="product"
                name="product"
                disabled={isPurchasing}
                /* UPDATED: Added select-text-center class */
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm select-text-center"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              >
                {productVariants.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 3. Purchase Button */}
            <div className="mt-6 flex justify-center">
              <ActionButton
                onClick={handlePurchase}
                text={isPurchasing ? "Creating Order..." : "Purchase Print"}
                icon={
                  isPurchasing ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5 mr-2" />
                  )
                }
                className="bg-sky-600 hover:bg-sky-700"
                disabled={isPurchasing}
              />
            </div>
            
            {/* 4. Recapture / Start Over Buttons */}
            <div className="mt-8 text-center flex flex-col sm:flex-row justify-center gap-4">
              <ActionButton
                onClick={handleRecapture}
                text="Recapture"
                icon={<Camera className="w-4 h-4 mr-2" />}
                /* UPDATED: Changed color to indigo */
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={isPurchasing}
              />
              <ActionButton
                onClick={handleStartOver}
                text="Start Over"
                icon={<RefreshCcw className="w-4 h-4 mr-2" />}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={isPurchasing}
              />
            </div>

          </div>
        )}
        {/* === END OF STEP 4 === */}

      </main>
      
      <footer className="text-center mt-12 text-slate-500">
        <p>&copy; {new Date().getFullYear()} StreetSketch. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;