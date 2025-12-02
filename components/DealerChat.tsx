import React from 'react';
import { DealerEmotion, DealerAvatarConfig } from '../types';
import { AVATAR_DEFINITIONS } from '../constants';

interface DealerChatProps {
  message: string;
  isThinking: boolean;
  emotion: DealerEmotion;
  avatarConfig?: DealerAvatarConfig;
  winAmount?: number | null;
  userName?: string;
  userAge?: number;
  userCountry?: string;
}

export const DealerChat: React.FC<DealerChatProps> = ({ 
  message, 
  isThinking, 
  emotion,
  avatarConfig,
  winAmount = 0,
  userName,
  userAge,
  userCountry
}) => {

  // Use a safe default if avatarConfig not provided
  const config: DealerAvatarConfig = avatarConfig ?? { type: 'PRESET', presetId: 'classic' };

  // Calculate win/loss states (use a safe local value because winAmount can be null)
  const safeWinAmount = winAmount ?? 0; // default to 0 if null
  const isBigWin = safeWinAmount > 500; // Consider wins over R500 as big wins
  const isLoss = safeWinAmount < 0;

  const renderAvatar = () => {
    if (config.type === 'UPLOAD' && config.customSrc) {
      return (
        <img 
          src={config.customSrc} 
          alt="Dealer" 
          className="w-full h-full object-cover"
        />
      );
    }
    const presetId = config.type === 'PRESET' && config.presetId ? config.presetId : 'classic';
    const preset = AVATAR_DEFINITIONS[presetId];
    const emoji = preset.emotions[emotion] || preset.emotions.IDLE;
    
    return <span className="text-3xl md:text-5xl drop-shadow-md">{emoji}</span>;
  };

  // Personalize messages with user information
  const personalizeMessage = (msg: string) => {
    if (!userName) return msg;
    
    // Replace generic greetings with personalized ones
    let personalizedMsg = msg;
    
    // Replace "Welcome" with personalized greeting
    if (msg.includes("Welcome")) {
      personalizedMsg = msg.replace("Welcome", `Welcome ${userName}`);
    }
    
    // Add age-appropriate context if available
    if (userAge && userAge < 25) {
      personalizedMsg = personalizedMsg.replace("high rollers table", "exciting gaming table");
    }
    
    // Add country context if available
    if (userCountry) {
      // Could add country-specific greetings or references here
    }
    
    return personalizedMsg;
  };

  return (
    <div className={`
      relative mx-auto mt-4 perspective-1000 z-20 transition-all duration-500 ease-out max-w-md
      ${isBigWin ? 'animate-bounce-short' : ''}
      ${isLoss ? 'animate-shake-tilt' : ''}
    `}>
      {/* Chat Bubble */}
      <div className={`
        relative rounded-2xl shadow-2xl border transition-all duration-500 overflow-hidden backdrop-blur-md
        ${isBigWin 
          ? 'bg-yellow-900/90 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] p-4 md:p-5 animate-gold-pulse'
          : isLoss
            ? 'bg-red-950/80 border-red-900/50 shadow-none grayscale-[0.3] p-4'
            : 'bg-black/70 border-yellow-600/30 shadow-black/50 p-4'
        }
      `}>
        
        {/* Big Win Flash */}
        {isBigWin && (
           <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none"></div>
        )}

        <div className="flex items-start gap-4 md:gap-6 relative z-10">
          {/* Avatar Container */}
          <div className="relative shrink-0 group">
            <div className={`
              rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-500 overflow-hidden
              ${isBigWin
                ? 'w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-300 to-yellow-600 border-white shadow-yellow-500/50 ring-4 ring-yellow-500/30'
                : 'w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-700 border-yellow-200'}
            `}>
              {renderAvatar()}
            </div>
            {!isThinking && !isLoss && (
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
                text-yellow-500 text-xs
                ${isBigWin ? 'text-yellow-100 drop-shadow-glow' : ''}
              `}>
                {config.type === 'PRESET' && config.presetId 
                 ? AVATAR_DEFINITIONS[config.presetId].name 
                 : 'The Dealer'}
              </h3>
            </div>

            <div className="min-h-[2.5rem] flex items-center">
              {isThinking ? (
                <div className="flex space-x-1.5 items-center opacity-60">
                   <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s'}}></div>
                   <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s'}}></div>
                </div>
              ) : (
                <div className={`
                  leading-relaxed animate-fade-in-up transition-all duration-500 w-full
                  ${isBigWin
                    ? 'text-lg font-bold text-white drop-shadow-md'
                    : 'text-sm italic text-gray-200'}
                `}>
                  "{personalizeMessage(message)}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};