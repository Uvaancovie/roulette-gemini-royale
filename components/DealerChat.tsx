import React from 'react';
import { DealerEmotion, DealerAvatarConfig } from '../types';
import { AVATAR_DEFINITIONS } from '../constants';

interface DealerChatProps {
  message: string;
  isThinking: boolean;
  isTipMode: boolean;
  onAskForTip: () => void;
  canAsk: boolean;
  emotion: DealerEmotion;
  avatarConfig: DealerAvatarConfig;
  winAmount?: number | null;
}

export const DealerChat: React.FC<DealerChatProps> = ({ 
  message, 
  isThinking, 
  isTipMode, 
  onAskForTip,
  canAsk,
  emotion,
  avatarConfig,
  winAmount = 0
}) => {
  
  // Helper to parse the AI Strategy Message if it matches the new format
  const renderFormattedMessage = (msg: string) => {
    if (!msg.includes('ANALYSIS:')) return msg;

    // Simple parsing for the structured output
    const lines = msg.split('\n').filter(l => l.trim().length > 0);
    return (
      <div className="flex flex-col gap-1 text-xs md:text-sm font-mono">
        {lines.map((line, idx) => {
          const [key, ...val] = line.split(':');
          const value = val.join(':');
          return (
            <div key={idx} className="flex flex-col md:flex-row md:gap-2">
              <span className="text-cyan-500 font-bold">{key}:</span>
              <span className="text-cyan-100">{value}</span>
            </div>
          )
        })}
      </div>
    );
  };

  const renderAvatar = () => {
    if (isTipMode) {
      return <span className="text-4xl md:text-5xl">🤖</span>;
    }

    if (avatarConfig.type === 'UPLOAD' && avatarConfig.customSrc) {
      return (
        <img 
          src={avatarConfig.customSrc} 
          alt="Dealer" 
          className="w-full h-full object-cover"
        />
      );
    }

    const presetId = avatarConfig.type === 'PRESET' && avatarConfig.presetId ? avatarConfig.presetId : 'classic';
    const preset = AVATAR_DEFINITIONS[presetId];
    const emoji = preset.emotions[emotion] || preset.emotions.IDLE;
    
    return <span className="text-3xl md:text-5xl drop-shadow-md">{emoji}</span>;
  };

  // Visual State Calculations
  const isWin = emotion === 'WIN';
  const isLoss = emotion === 'LOSS';
  const isBigWin = isWin && (winAmount && winAmount > 100); // Threshold for visual flair

  return (
    <div className={`
      relative mx-auto mt-4 perspective-1000 z-20 transition-all duration-500 ease-out
      ${isTipMode ? 'max-w-2xl scale-105' : 'max-w-md'}
      ${isBigWin ? 'animate-bounce-short' : ''}
      ${isLoss ? 'animate-shake-tilt' : ''}
    `}>
      {/* Chat Bubble */}
      <div className={`
        relative rounded-2xl shadow-2xl border transition-all duration-500 overflow-hidden backdrop-blur-md
        ${isTipMode 
          ? 'bg-slate-950/95 border-cyan-400/50 shadow-[0_0_40px_rgba(34,211,238,0.15)] p-5 md:p-6' 
          : isBigWin 
            ? 'bg-yellow-900/90 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] p-4 md:p-5 animate-gold-pulse'
            : isLoss
              ? 'bg-red-950/80 border-red-900/50 shadow-none grayscale-[0.3] p-4'
              : 'bg-black/70 border-yellow-600/30 shadow-black/50 p-4'
        }
      `}>
        
        {/* AI Tech Background Overlay */}
        {isTipMode && (
          <>
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.5)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
          </>
        )}
        {/* Big Win Flash */}
        {isBigWin && (
           <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none"></div>
        )}

        <div className="flex items-start gap-4 md:gap-6 relative z-10">
          {/* Avatar Container */}
          <div className="relative shrink-0 group">
            <div className={`
              rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-500 overflow-hidden
              ${isTipMode 
                ? 'w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-slate-800 to-slate-950 border-cyan-400 animate-pulse-slow shadow-cyan-500/20' 
                : isBigWin
                  ? 'w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-300 to-yellow-600 border-white shadow-yellow-500/50 ring-4 ring-yellow-500/30'
                  : 'w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-700 border-yellow-200'}
            `}>
              {renderAvatar()}
            </div>
            {!isThinking && !isTipMode && !isLoss && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
            )}
            {isLoss && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black"></div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex justify-between items-center mb-2">
              <h3 className={`
                font-bold uppercase tracking-widest transition-colors duration-300 flex items-center gap-2
                ${isTipMode ? 'text-cyan-400 text-xs md:text-sm font-mono' : 'text-yellow-500 text-xs'}
                ${isBigWin ? 'text-yellow-100 drop-shadow-glow' : ''}
              `}>
                {isTipMode ? (
                  <>
                    <span className="animate-pulse">●</span> GEMINI_PROBABILITY_ENGINE
                  </>
                ) : (
                   avatarConfig.type === 'PRESET' && avatarConfig.presetId 
                   ? AVATAR_DEFINITIONS[avatarConfig.presetId].name 
                   : 'The Dealer'
                )}
              </h3>
              
              {/* Ask Button - Hidden during spinning or thinking */}
              {canAsk && !isThinking && !isTipMode && (
                <button 
                  onClick={onAskForTip}
                  className="group relative inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/60 transition-all hover:scale-105 overflow-hidden border border-indigo-400/30"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <span className="">🧠</span> STRATEGY
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              )}
            </div>

            <div className="min-h-[2.5rem] flex items-center">
              {isThinking ? (
                 isTipMode ? (
                   <div className="flex items-center gap-2 text-cyan-500 font-mono text-sm md:text-base">
                     <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></span>
                     <span className="animate-pulse">ANALYZING_VARIANCE...</span>
                   </div>
                 ) : (
                  <div className="flex space-x-1.5 items-center opacity-60">
                     <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s'}}></div>
                     <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s'}}></div>
                  </div>
                 )
              ) : (
                <div className={`
                  leading-relaxed animate-fade-in-up transition-all duration-500 w-full
                  ${isTipMode 
                    ? 'text-cyan-50 border-l-2 border-cyan-500 pl-3' 
                    : isBigWin
                      ? 'text-lg font-bold text-white drop-shadow-md'
                      : 'text-sm italic text-gray-200'}
                `}>
                  {isTipMode ? renderFormattedMessage(message) : `"${message}"`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative ambient glow behind for Tip Mode */}
      {isTipMode && (
        <div className="absolute inset-0 bg-cyan-500/10 blur-3xl -z-10 rounded-full animate-pulse-slow"></div>
      )}
    </div>
  );
};