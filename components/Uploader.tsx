
import React, { useCallback } from 'react';

interface UploaderProps {
  onImageSelect: (base64: string) => void;
  currentImage: string | null;
}

export const Uploader: React.FC<UploaderProps> = ({ onImageSelect, currentImage }) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  return (
    <div className="w-full">
      <label className={`
        relative flex flex-col items-center justify-center w-full h-64 
        border-2 border-dashed rounded-xl cursor-pointer
        transition-all duration-300 overflow-hidden
        ${currentImage ? 'border-blue-500/50' : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50'}
      `}>
        {currentImage ? (
          <div className="relative w-full h-full">
            <img src={currentImage} alt="Preview" className="w-full h-full object-contain p-4" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white font-medium">Change Image</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 rounded-full bg-blue-500/10 mb-4">
              <i className="fa-solid fa-cloud-arrow-up text-3xl text-blue-500"></i>
            </div>
            <p className="mb-2 text-sm text-slate-300">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">PNG, JPG or WebP (Max 10MB)</p>
          </div>
        )}
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
};
