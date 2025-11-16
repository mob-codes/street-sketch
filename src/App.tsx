// src/App.tsx
import './index.css'; // Make sure this is in src/main.tsx, not here
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

const productVariants = [
  { name: 'Postcard (4" x 6")', id: 7674 },
  { name: 'Small Print (8" x 10")', id: 10110 },
  { name: 'Medium Print (12" x 16")', id: 10113 },
  { name: 'Large Print (18" x 24")', id: 10116 },
];

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

const App: React.FC = () => {
  const [address, setAddress] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isStylizing, setIsStylizing] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [artStyle, setArtStyle] = useState<string>('Watercolor');
  const [selectedVariantId, setSelectedVariantId] = useState<number>(productVariants[0].id);
  const [appStep, setAppStep] = useState<AppStep>('initial');

  const [heading, setHeading] = useState(90);
  const [pitch, setPitch] = useState(0);
  const [fov, setFov] = useState(120);

  const step2Ref = useRef<HTMLDivElement>(null);
  const finalResultRef = useRef<HTMLDivElement>(null);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleRecapture = () => {
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    setGeneratedImageUrl(null);
    setAppStep('framing'); 
    setError(null);
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

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


  const handleStylizeImage = useCallback(async () => {
    if (!originalImageUrl) return;
    console.log('[App.tsx] handleStylizeImage called');
    
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    
    setAppStep('generating'); 
    setIsStylizing(true); 
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/stylize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streetViewUrl: originalImageUrl,
          artStyle: artStyle,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate image.');
      }

      const { generatedUrl } = await response.json();
      
      const blob = dataURLtoBlob(generatedUrl);
      const blobUrl = URL.createObjectURL(blob);
      
      setGeneratedImageUrl(blobUrl);
      setAppStep('done'); 

      setTimeout(() => {
        finalResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setAppStep('framing'); 
      if (errorMessage.includes("403")) {
           setError('Failed to load Street View image (Error 403). Check API key.');
      } else if (errorMessage.includes("404")) {
           setError('Could not find a Street View image for that address.');
      } else {
           setError(`Failed to generate the image: ${errorMessage}`);
      }
    } finally {
      setIsStylizing(false); 
    }
  }, [originalImageUrl, artStyle, generatedImageUrl]);


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
      
      {appStep !== 'generating' && appStep !== 'done' && (
        <header className="text-center mb-6 w-full max-w-4xl">
          <img 
            src={logoImage} 
            alt="StreetSketch Logo" 
            className="w-40 h-40 mx-auto mb-4 rounded-full shadow-lg border-4 border-white"
          />
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
           <img 
            src={logoImage} 
            alt="StreetSketch Logo" 
            className="w-40 h-40 mx-auto mb-4 rounded-full shadow-lg border-4 border-white"
          />
        </header>
      )}
      
      <main className="w-full max-w-4xl">
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

        {appStep === 'framing' && (
          <div className="mt-8 animate-fade-in" ref={step2Ref}>
            <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Step 2: Frame Your Shot</h3>
            
            {/* === LAYOUT FIX === */}
            {/* Use md:flex-row to put image/rotate and sliders side-by-side */}
            <div className="flex flex-col md:flex-row gap-6 justify-center">

              {/* Column 1: Image and Rotate Slider */}
              {/* This column will grow to fit image, rotate slider width matches */}
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

              {/* Column 2: Vertical Sliders */}
              {/* This column shrinks to fit content */}
              <div className="flex-shrink-0 flex flex-row md:flex-col justify-center items-start gap-8 p-4 bg-white rounded-xl shadow-lg">
                <PovSlider 
                  label="Tilt" 
                  icon={<MoveVertical className="w-4 h-4" />}
                  value={pitch} 
                  onChange={setPitch} 
                  min={-90} 
                  max={90}
                  orientation="vertical"
                />
                <PovSlider 
                  label="Zoom" 
                  icon={<Search className="w-4 h-4" />}
                  value={fov} 
                  onChange={setFov} 
                  min={10} 
                  max={120}
                  orientation="vertical"
                />
              </div>
            </div>
            {/* === END OF LAYOUT FIX === */}
            
            {/* Step 3: Style Options */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Step 3: Choose Your Style</h3>
              <FilterOptions 
                selectedStyle={artStyle} 
                onStyleChange={setArtStyle} 
                isLoading={isLoading}
              />
            </div>

            {/* Main CTA */}
            <div className="mt-6 flex justify-center">
              <ActionButton
                onClick={handleStylizeImage}
                text={`Stylize in ${artStyle}!`}
                icon={<Wand2 className="w-5 h-5 mr-2" />}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={isStylizing || isFetching}
              />
            </div>
          </div>
        )}

        {/* Generating Spinner */}
        {appStep === 'generating' && (
          <div className="flex flex-col items-center justify-center min-h-[300px] animate-fade-in">
            <LoadingSpinner 
              mainText="Generating your artwork..." 
              subText="This may take up to 30 seconds"
              size="large" 
            />
          </div>
        )}

        {/* Step 4: Final Result */}
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
            
            <div className="mt-6 max-w-sm mx-auto">
              <label htmlFor="product" className="block text-sm font-medium text-slate-700">
                Select Product
              </label>
              <select
                id="product"
                name="product"
                disabled={isPurchasing}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm"
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
            
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
              <ActionButton
                onClick={handleDownload}
                text="Download for Free"
                icon={<Download className="w-5 h-5 mr-2" />}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isPurchasing}
              />
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
            
            <div className="mt-8 text-center flex flex-col sm:flex-row justify-center gap-4">
              <ActionButton
                onClick={handleRecapture}
                text="Recapture"
                icon={<Camera className="w-4 h-4 mr-2" />}
                className="bg-slate-200 text-slate-800 hover:bg-slate-300"
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

      </main>
      
      <footer className="text-center mt-12 text-slate-500">
        <p>&copy; {new Date().getFullYear()} StreetSketch. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;