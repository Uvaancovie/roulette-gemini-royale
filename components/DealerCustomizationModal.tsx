import React, { useRef } from 'react';
import { AvatarPresetId, DealerAvatarConfig } from '../types';
import { AVATAR_DEFINITIONS } from '../constants';
import { toast } from 'react-hot-toast';

interface DealerCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: DealerAvatarConfig;
  onSave: (config: DealerAvatarConfig) => void;
}

export const DealerCustomizationModal: React.FC<DealerCustomizationModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (id: AvatarPresetId) => {
    onSave({ type: 'PRESET', presetId: id });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image too large. Max 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        onSave({ type: 'UPLOAD', customSrc: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-gray-900 border border-yellow-600/30 rounded-xl w-full max-w-md p-6 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 uppercase tracking-widest">
            Dealer Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            &times;
          </button>
        </div>

        <div className="space-y-6">
          {/* Presets Section */}
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Select Character</h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(AVATAR_DEFINITIONS) as AvatarPresetId[]).map((id) => {
                const def = AVATAR_DEFINITIONS[id];
                const isSelected = currentConfig.type === 'PRESET' && currentConfig.presetId === id;
                return (
                  <button
                    key={id}
                    onClick={() => handlePresetSelect(id)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                      ${isSelected 
                        ? 'bg-yellow-900/40 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                        : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20'}
                    `}
                  >
                    <span className="text-3xl mb-2 drop-shadow-lg">{def.emotions.IDLE}</span>
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {def.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Section */}
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Or Upload Your Own</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden group transition-colors
                ${currentConfig.type === 'UPLOAD' ? 'border-green-500 bg-green-900/20' : 'border-gray-600 hover:border-gray-400 hover:bg-white/5'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              
              {currentConfig.type === 'UPLOAD' && currentConfig.customSrc ? (
                <>
                  <img src={currentConfig.customSrc} alt="Custom Avatar" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-2xl mb-1">✅</span>
                    <span className="text-xs font-bold text-green-400 uppercase">Image Loaded</span>
                    <span className="text-[9px] text-gray-400 mt-1">Click to change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-500 group-hover:text-gray-300">
                  <span className="text-2xl mb-1">📤</span>
                  <span className="text-xs font-bold uppercase">Upload Image</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-full text-sm uppercase tracking-wider hover:scale-105 transition-transform shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
