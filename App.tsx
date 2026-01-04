
import React, { useState, useCallback, useEffect } from 'react';
import { Uploader } from './components/Uploader';
import { GeminiService } from './services/geminiService';
import { AppStatus, PosterConfig, GeneratedPoster, AspectRatio } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedPoster[]>([]);
  
  const [config, setConfig] = useState<PosterConfig>({
    productName: '',
    price: '',
    details: '',
    ratio: '1:1',
    quality: '1K'
  });

  const [hasProKey, setHasProKey] = useState(false);

  useEffect(() => {
    // Check if Pro Key selection might be needed
    const checkProKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasProKey(has);
      }
    };
    checkProKey();
  }, []);

  const handleProKeyToggle = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success as per guidelines to mitigate race condition
      setHasProKey(true);
    } else {
      alert("Billing system interface not available in this environment.");
    }
  };

  const generate = async () => {
    if (!sourceImage) return;
    if (!config.productName) {
      setError("Product name is required.");
      return;
    }

    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      const result = await GeminiService.generatePoster(sourceImage, config, hasProKey);
      setGeneratedPoster(result);
      
      const newEntry: GeneratedPoster = {
        id: Math.random().toString(36).substr(2, 9),
        url: result,
        timestamp: Date.now(),
        config: { ...config }
      };
      
      setHistory(prev => [newEntry, ...prev]);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      if (err.message?.includes("Requested entity was not found")) {
        setError("API Key Error. Please re-select your Pro Key.");
        setHasProKey(false);
      } else {
        setError("Failed to generate poster. Please try again.");
      }
    }
  };

  const downloadPoster = () => {
    if (!generatedPoster) return;
    const link = document.createElement('a');
    link.href = generatedPoster;
    link.download = `adcraft-poster-${Date.now()}.png`;
    link.click();
  };

  const loadingMessages = [
    "Analyzing your product details...",
    "Designing custom studio background...",
    "Perfecting commercial lighting...",
    "Applying high-end typography...",
    "Polishing final render..."
  ];
  
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  useEffect(() => {
    if (status === AppStatus.GENERATING) {
      const interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8">
      {/* Header */}
      <nav className="flex items-center justify-between py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AdCraft <span className="text-blue-500">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleProKeyToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              hasProKey ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <i className={`fa-solid ${hasProKey ? 'fa-check-circle' : 'fa-gem'}`}></i>
            {hasProKey ? 'Pro Mode Active' : 'Upgrade to Pro (2K/4K)'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Left Column - Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-camera text-blue-500"></i>
              Product Photography
            </h2>
            <Uploader currentImage={sourceImage} onImageSelect={setSourceImage} />
          </section>

          <section className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="fa-solid fa-pen-nib text-blue-500"></i>
              Marketing Copy
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Product Name</label>
                <input 
                  type="text" 
                  value={config.productName}
                  onChange={e => setConfig({...config, productName: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Premium Matcha Latte"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Price Badge</label>
                  <input 
                    type="text" 
                    value={config.price}
                    onChange={e => setConfig({...config, price: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. $4.99"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Aspect Ratio</label>
                  <select 
                    value={config.ratio}
                    onChange={e => setConfig({...config, ratio: e.target.value as AspectRatio})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="1:1">1:1 Square (Feed)</option>
                    <option value="9:16">9:16 Portrait (Story)</option>
                    <option value="16:9">16:9 Landscape (Ads)</option>
                    <option value="4:3">4:3 Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Short Description</label>
                <textarea 
                  value={config.details}
                  onChange={e => setConfig({...config, details: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none"
                  placeholder="e.g. Locally sourced, organic, and delicious."
                />
              </div>

              {hasProKey && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Resolution</label>
                  <div className="flex gap-2">
                    {(['1K', '2K', '4K'] as const).map(q => (
                      <button
                        key={q}
                        onClick={() => setConfig({...config, quality: q})}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold border transition-all ${
                          config.quality === q 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generate}
              disabled={status === AppStatus.GENERATING || !sourceImage}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all
                ${status === AppStatus.GENERATING || !sourceImage 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99]'}
              `}
            >
              {status === AppStatus.GENERATING ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-sparkles"></i>
                  Create High-End Poster
                </>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-xs text-center mt-2 flex items-center justify-center gap-2 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </p>
            )}
          </section>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa-solid fa-display text-blue-500"></i>
                Studio Preview
              </h2>
              {generatedPoster && (
                <button 
                  onClick={downloadPoster}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-download"></i>
                  Download
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center relative bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
              {status === AppStatus.GENERATING ? (
                <div className="flex flex-col items-center gap-6 px-10 text-center">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-palette text-blue-500 text-2xl animate-pulse"></i>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Creating Magic</h3>
                    <p className="text-slate-400 text-sm animate-fade-in">{loadingMessages[loadingMsgIdx]}</p>
                  </div>
                </div>
              ) : generatedPoster ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={generatedPoster} 
                    alt="Generated Advertisement" 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                  />
                </div>
              ) : (
                <div className="text-center p-12 opacity-40">
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-image text-4xl text-slate-600"></i>
                  </div>
                  <h3 className="text-lg font-medium text-slate-300">Your design will appear here</h3>
                  <p className="text-sm text-slate-500 mt-1">Upload a photo and fill in the details to start</p>
                </div>
              )}
            </div>
          </div>

          {/* History / Gallery */}
          {history.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                Recently Created
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {history.map(item => (
                  <div 
                    key={item.id} 
                    className="flex-shrink-0 w-24 group cursor-pointer"
                    onClick={() => setGeneratedPoster(item.url)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 hover:border-blue-500 transition-colors">
                      <img src={item.url} alt="History item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 truncate font-medium">{item.config.productName || 'Unnamed'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar for Mobile Prompt */}
      {sourceImage && !generatedPoster && status === AppStatus.IDLE && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50 animate-bounce">
          <div className="bg-blue-600 text-white p-3 rounded-full shadow-2xl text-center text-sm font-bold">
            Scroll down to generate! <i className="fa-solid fa-arrow-down ml-2"></i>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
