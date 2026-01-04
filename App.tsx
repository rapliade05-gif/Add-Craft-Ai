
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
    const checkKeyStatus = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasProKey(has);
      }
    };
    checkKeyStatus();
  }, []);

  const openKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasProKey(true);
      return true;
    }
    return false;
  };

  const generate = async () => {
    if (!sourceImage) {
      setError("Silakan unggah foto produk.");
      return;
    }
    if (!config.productName.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }

    // Jika API Key benar-benar kosong, paksa buka pilihan kunci
    if (!process.env.API_KEY) {
      const triggered = await openKeySelection();
      if (!triggered) {
        setError("API Key tidak tersedia. Harap hubungkan API Key Anda.");
        return;
      }
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
      console.error("Generation Error:", err);
      setStatus(AppStatus.ERROR);
      
      const errMsg = err.message || "";
      // Penanganan khusus jika entitas tidak ditemukan (biasanya masalah API Key/Project)
      if (errMsg.includes("Requested entity was not found") || errMsg.includes("404")) {
        setError("Sesi API bermasalah. Membuka pemilihan API Key...");
        setTimeout(() => openKeySelection(), 1500);
      } else if (errMsg.includes("SAFETY")) {
        setError("Gambar diblokir oleh filter keamanan AI.");
      } else {
        setError(errMsg || "Terjadi kesalahan pada server AI.");
      }
    }
  };

  const downloadPoster = () => {
    if (!generatedPoster) return;
    const link = document.createElement('a');
    link.href = generatedPoster;
    link.download = `poster-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 bg-[#0f172a] text-slate-100">
      <nav className="flex items-center justify-between py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AdCraft <span className="text-blue-500">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={openKeySelection}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              hasProKey ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <i className={`fa-solid ${hasProKey ? 'fa-check-circle' : 'fa-key'}`}></i>
            {hasProKey ? 'Kunci Pro Aktif' : 'Pilih API Key (Wajib)'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-camera text-blue-500"></i>
              1. Foto Produk
            </h2>
            <Uploader currentImage={sourceImage} onImageSelect={setSourceImage} />
          </section>

          <section className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="fa-solid fa-pen-nib text-blue-500"></i>
              2. Detail Iklan
            </h2>
            
            <div className="space-y-3">
              <input 
                type="text" 
                value={config.productName}
                onChange={e => setConfig({...config, productName: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Nama Produk"
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={config.price}
                  onChange={e => setConfig({...config, price: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm"
                  placeholder="Harga"
                />
                <select 
                  value={config.ratio}
                  onChange={e => setConfig({...config, ratio: e.target.value as AspectRatio})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="9:16">9:16 Story</option>
                  <option value="16:9">16:9 Landscape</option>
                </select>
              </div>
              <textarea 
                value={config.details}
                onChange={e => setConfig({...config, details: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm h-20 resize-none"
                placeholder="Deskripsi/Keunggulan"
              />
            </div>

            <button
              onClick={generate}
              disabled={status === AppStatus.GENERATING || !sourceImage}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                status === AppStatus.GENERATING || !sourceImage 
                ? 'bg-slate-800 text-slate-500' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20'
              }`}
            >
              {status === AppStatus.GENERATING ? "Memproses..." : "Hasilkan Poster"}
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <p>{error}</p>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl min-h-[500px] flex flex-col border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Pratinjau Studio</h2>
              {generatedPoster && (
                <button onClick={downloadPoster} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">
                  Download
                </button>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center bg-slate-900/30 rounded-xl overflow-hidden border border-white/5">
              {status === AppStatus.GENERATING ? (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Sedang mendesain...</p>
                </div>
              ) : generatedPoster ? (
                <img src={generatedPoster} alt="Poster" className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <p className="text-slate-500">Hasil desain akan muncul di sini</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
