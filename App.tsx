
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

  // Cek status kunci saat aplikasi dimuat
  useEffect(() => {
    const checkKeyStatus = async () => {
      try {
        if ((window as any).aistudio?.hasSelectedApiKey) {
          const has = await (window as any).aistudio.hasSelectedApiKey();
          setHasProKey(has);
        }
      } catch (e) {
        console.warn("Gagal mengecek status kunci Pro:", e);
      }
    };
    checkKeyStatus();
  }, []);

  const openKeySelection = async () => {
    setError(null);
    const aiStudio = (window as any).aistudio;
    
    if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
      try {
        await aiStudio.openSelectKey();
        // Berdasarkan pedoman: Asumsikan sukses setelah trigger dibuka
        setHasProKey(true);
        return true;
      } catch (e) {
        setError("Gagal membuka jendela pemilihan kunci.");
        return false;
      }
    } else {
      // Jika tidak ada respon saat diklik, ini biasanya alasannya:
      const msg = "Fitur 'Pilih API Key' hanya tersedia jika aplikasi dijalankan di dalam lingkungan AI Studio/Preview. Pastikan Anda tidak membukanya di tab browser biasa.";
      setError(msg);
      console.error(msg);
      alert(msg);
      return false;
    }
  };

  const generate = async () => {
    if (!sourceImage) {
      setError("Silakan unggah foto produk terlebih dahulu.");
      return;
    }
    if (!config.productName.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }

    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      // Gunakan hasProKey untuk menentukan apakah akan menggunakan model gemini-3-pro
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
      if (errMsg.includes("Requested entity was not found") || errMsg.includes("404")) {
        setError("Model Pro tidak ditemukan. Mencoba membuka pemilihan API Key...");
        openKeySelection();
      } else if (errMsg.includes("SAFETY")) {
        setError("Gambar diblokir oleh filter keamanan AI. Coba gunakan produk/kata-kata lain.");
      } else if (errMsg.includes("API key not found") || errMsg.includes("invalid")) {
        setError("API Key tidak valid. Silakan klik 'Pilih API Key' di pojok kanan atas.");
      } else {
        setError(errMsg || "Terjadi kesalahan sistem AI.");
      }
    }
  };

  const downloadPoster = () => {
    if (!generatedPoster) return;
    const link = document.createElement('a');
    link.href = generatedPoster;
    link.download = `adcraft-${config.productName.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 bg-[#0f172a] text-slate-100">
      <nav className="flex items-center justify-between py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-wand-magic-sparkles text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AdCraft <span className="text-blue-500">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={openKeySelection}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border shadow-sm ${
              hasProKey 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-blue-500/50 hover:bg-slate-700'
            }`}
          >
            <i className={`fa-solid ${hasProKey ? 'fa-circle-check animate-pulse' : 'fa-key'}`}></i>
            {hasProKey ? 'Mode Pro Aktif' : 'Pilih API Key (Wajib Pro)'}
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

          <section className="glass-panel p-6 rounded-2xl space-y-5 border border-white/5 shadow-xl">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="fa-solid fa-pen-nib text-blue-500"></i>
              2. Konfigurasi Iklan
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nama Produk</label>
                <input 
                  type="text" 
                  value={config.productName}
                  onChange={e => setConfig({...config, productName: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Contoh: Kopi Gula Aren Premium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Harga</label>
                  <input 
                    type="text" 
                    value={config.price}
                    onChange={e => setConfig({...config, price: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                    placeholder="Rp 25.000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Rasio Poster</label>
                  <select 
                    value={config.ratio}
                    onChange={e => setConfig({...config, ratio: e.target.value as AspectRatio})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="1:1">1:1 Square (Feed)</option>
                    <option value="9:16">9:16 Portrait (Story)</option>
                    <option value="16:9">16:9 Landscape (Ads)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Keunggulan Produk</label>
                <textarea 
                  value={config.details}
                  onChange={e => setConfig({...config, details: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm h-24 resize-none focus:border-blue-500 outline-none"
                  placeholder="Ceritakan mengapa produk ini istimewa..."
                />
              </div>
            </div>

            <button
              onClick={generate}
              disabled={status === AppStatus.GENERATING || !sourceImage}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                status === AppStatus.GENERATING || !sourceImage 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25'
              }`}
            >
              {status === AppStatus.GENERATING ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Mendesain...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-magic-wand-sparkles"></i>
                  Hasilkan Poster Premium
                </>
              )}
            </button>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                <i className="fa-solid fa-circle-exclamation mt-0.5 text-sm"></i>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl min-h-[550px] flex flex-col border border-white/5 relative shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa-solid fa-palette text-blue-500"></i>
                Pratinjau Desain
              </h2>
              {generatedPoster && (
                <button 
                  onClick={downloadPoster} 
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md"
                >
                  <i className="fa-solid fa-download"></i>
                  Download PNG
                </button>
              )}
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-slate-950/40 rounded-xl overflow-hidden border border-white/5 group shadow-inner">
              {status === AppStatus.GENERATING ? (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <i className="fa-solid fa-wand-magic-sparkles absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 text-xl animate-pulse"></i>
                  </div>
                  <p className="text-slate-400 font-medium animate-pulse">Menerapkan pencahayaan studio...</p>
                </div>
              ) : generatedPoster ? (
                <div className="p-4 w-full h-full flex items-center justify-center relative">
                  <img 
                    src={generatedPoster} 
                    alt="Poster Hasil AI" 
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10 transition-transform duration-700 group-hover:scale-[1.01]" 
                  />
                </div>
              ) : (
                <div className="text-center p-12 max-w-sm">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-600 border border-white/5">
                    <i className="fa-solid fa-image text-4xl"></i>
                  </div>
                  <h3 className="text-slate-300 font-semibold text-lg">Studio Poster Siap</h3>
                  <p className="text-slate-500 text-sm mt-2">Isi detail di samping dan biarkan AI mengubah foto produk biasa menjadi iklan kelas dunia.</p>
                </div>
              )}
            </div>
          </div>
          
          {history.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left"></i>
                Riwayat Sesi Ini
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {history.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => setGeneratedPoster(item.url)}
                    className="flex-shrink-0 group"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 group-hover:border-blue-500 transition-all shadow-md">
                      <img src={item.url} alt="History" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 truncate max-w-[96px] text-center font-medium">{item.config.productName}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
