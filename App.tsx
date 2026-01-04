
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
      // Asumsikan sukses untuk menghindari race condition
      setHasProKey(true);
    }
  };

  const generate = async () => {
    if (!sourceImage) {
      setError("Silakan unggah foto produk terlebih dahulu.");
      return;
    }
    if (!config.productName.trim()) {
      setError("Nama produk tidak boleh kosong.");
      return;
    }

    setStatus(AppStatus.GENERATING);
    setError(null);
    setGeneratedPoster(null);

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
      console.error("App Generate Error:", err);
      setStatus(AppStatus.ERROR);
      
      // Menangani error spesifik
      const errMsg = err.message || "";
      if (errMsg.includes("Requested entity was not found") || errMsg.includes("404")) {
        setError("Error: Model tidak ditemukan atau API Key salah. Pastikan Anda menggunakan kunci dari proyek Google Cloud yang aktif.");
      } else if (errMsg.includes("SAFETY")) {
        setError("Gagal: Konten Anda ditolak oleh filter keamanan AI. Coba gunakan kata-kata yang lebih umum.");
      } else if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("key is invalid")) {
        setError("Error: API Key Anda tidak valid. Silakan atur ulang kunci Anda.");
      } else {
        setError(errMsg || "Terjadi kesalahan saat menghubungi server AI. Coba lagi beberapa saat lagi.");
      }
    }
  };

  const downloadPoster = () => {
    if (!generatedPoster) return;
    const link = document.createElement('a');
    link.href = generatedPoster;
    link.download = `poster-${config.productName.replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.click();
  };

  const loadingMessages = [
    "Menganalisis pencahayaan produk...",
    "Menciptakan komposisi visual...",
    "Merender latar belakang studio...",
    "Menyempurnakan tipografi...",
    "Hampir selesai..."
  ];
  
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  useEffect(() => {
    let interval: any;
    if (status === AppStatus.GENERATING) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 bg-[#0f172a] text-slate-100">
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
            {hasProKey ? 'Mode Pro Aktif' : 'Gunakan API Key Sendiri (Pro)'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        {/* Editor Side */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-camera text-blue-500"></i>
              1. Unggah Produk
            </h2>
            <Uploader currentImage={sourceImage} onImageSelect={setSourceImage} />
          </section>

          <section className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <i className="fa-solid fa-pen-nib text-blue-500"></i>
              2. Detail Iklan
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Nama Produk</label>
                <input 
                  type="text" 
                  value={config.productName}
                  onChange={e => setConfig({...config, productName: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Contoh: Parfum Luxury Oud"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Harga</label>
                  <input 
                    type="text" 
                    value={config.price}
                    onChange={e => setConfig({...config, price: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Contoh: Rp 199.000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Rasio</label>
                  <select 
                    value={config.ratio}
                    onChange={e => setConfig({...config, ratio: e.target.value as AspectRatio})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="9:16">9:16 Story</option>
                    <option value="16:9">16:9 Landscape</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Keunggulan</label>
                <textarea 
                  value={config.details}
                  onChange={e => setConfig({...config, details: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none"
                  placeholder="Contoh: Wangi tahan 24 jam, elegan, premium."
                />
              </div>
            </div>

            <button
              onClick={generate}
              disabled={status === AppStatus.GENERATING || !sourceImage}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all
                ${status === AppStatus.GENERATING || !sourceImage 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-xl shadow-blue-500/20 active:scale-95'}
              `}
            >
              {status === AppStatus.GENERATING ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-sparkles"></i>
                  Hasilkan Poster Iklan
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex gap-2 items-start animate-shake">
                <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                <p>{error}</p>
              </div>
            )}
          </section>
        </div>

        {/* Preview Side */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl min-h-[500px] flex flex-col border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <i className="fa-solid fa-display text-blue-500"></i>
                Pratinjau Hasil
              </h2>
              {generatedPoster && (
                <button 
                  onClick={downloadPoster}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <i className="fa-solid fa-download"></i>
                  Download Poster
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center relative bg-slate-900/30 rounded-xl overflow-hidden border border-white/5">
              {status === AppStatus.GENERATING ? (
                <div className="flex flex-col items-center gap-6 text-center animate-pulse">
                  <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Membuat Karya...</h3>
                    <p className="text-slate-400 text-sm italic">{loadingMessages[loadingMsgIdx]}</p>
                  </div>
                </div>
              ) : generatedPoster ? (
                <div className="w-full h-full flex items-center justify-center p-2 group">
                  <img 
                    src={generatedPoster} 
                    alt="Poster Iklan" 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              ) : (
                <div className="text-center p-12 space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
                    <i className="fa-solid fa-image text-3xl"></i>
                  </div>
                  <div className="max-w-xs mx-auto">
                    <p className="text-slate-400 font-medium">Belum ada desain</p>
                    <p className="text-slate-500 text-xs mt-1">Isi detail produk di sebelah kiri lalu klik tombol hasilkan untuk melihat keajaiban.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mini Gallery */}
          {history.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Riwayat Terakhir</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {history.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => setGeneratedPoster(item.url)}
                    className="flex-shrink-0 group relative"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 group-hover:border-blue-500 transition-colors">
                      <img src={item.url} alt="History" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-eye text-white text-xs"></i>
                    </div>
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
