import React, { useEffect, useState } from 'react';
import { WHEEL_ORDER, getNumberColor } from '../constants';

interface RouletteWheelProps {
  targetNumber: number | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
}

// Particle component for the winning explosion
const WinParticles = () => {
  const particles = Array.from({ length: 30 }).map((_, i) => {
    const angle = Math.random() * 360;
    const distance = 50 + Math.random() * 100; // Distance to travel
    const tx = `${Math.cos(angle * Math.PI / 180) * distance}px`;
    const ty = `${Math.sin(angle * Math.PI / 180) * distance}px`;
    const color = Math.random() > 0.5 ? '#fbbf24' : '#ffffff'; // Gold or White
    const size = 3 + Math.random() * 4;
    
    return (
      <div 
        key={i}
        className="absolute top-0 left-1/2 rounded-full animate-particle-explode"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          '--tx': tx,
          '--ty': ty,
          animationDelay: `${Math.random() * 0.1}s`
        } as React.CSSProperties}
      />
    );
  });

  return <>{particles}</>;
};

export const RouletteWheel: React.FC<RouletteWheelProps> = ({ targetNumber, isSpinning, onSpinComplete }) => {
  const [rotation, setRotation] = useState(0);
  const [showEffects, setShowEffects] = useState(false);
  const radius = 150;
  const center = 160; 
  const sliceAngle = 360 / 37;

  useEffect(() => {
    if (isSpinning && targetNumber !== null) {
      // Reset effects
      setShowEffects(false);

      // Calculate rotation physics
      const fullRotations = 5 * 360; 
      const anglePerSlice = 360 / 37;
      const idx = WHEEL_ORDER.indexOf(targetNumber);
      
      // Randomize slightly within the slice to avoid looking robotic
      const randomOffset = (Math.random() * 0.8 - 0.4) * anglePerSlice; 
      const finalAngle = fullRotations + (360 - (idx * anglePerSlice)) + randomOffset;
      
      setRotation(prev => prev + finalAngle);

      const timer = setTimeout(() => {
        setShowEffects(true);
        onSpinComplete();
      }, 4000); // Match CSS duration

      return () => clearTimeout(timer);
    } else if (targetNumber === null) {
        setShowEffects(false);
    }
  }, [isSpinning, targetNumber, onSpinComplete]);

  // Construct the wheel slices
  const slices = WHEEL_ORDER.map((num, i) => {
    const a1 = (i * sliceAngle) - 90 - (sliceAngle / 2);
    const a2 = a1 + sliceAngle;
    
    const x1 = center + radius * Math.cos(a1 * Math.PI / 180);
    const y1 = center + radius * Math.sin(a1 * Math.PI / 180);
    const x2 = center + radius * Math.cos(a2 * Math.PI / 180);
    const y2 = center + radius * Math.sin(a2 * Math.PI / 180);

    const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
    const color = getNumberColor(num);
    const isWinner = showEffects && !isSpinning && num === targetNumber;

    return (
      <g key={num} className={`transition-all duration-500 ${isWinner ? 'animate-flash-slice' : ''}`}>
        <path 
          d={d} 
          fill={color === 'red' ? '#e11d48' : color === 'black' ? '#171717' : '#16a34a'} 
          stroke={isWinner ? "#fff" : "#fbbf24"} 
          strokeWidth={isWinner ? "3" : "1"}
          className="transition-all"
        />
        {/* Text Number */}
        <text 
          x={center + (radius * 0.85) * Math.cos((a1 + a2)/2 * Math.PI / 180)} 
          y={center + (radius * 0.85) * Math.sin((a1 + a2)/2 * Math.PI / 180)} 
          fill="white" 
          fontSize={isWinner ? "18" : "12"} 
          fontWeight="bold"
          textAnchor="middle" 
          dominantBaseline="middle"
          transform={`rotate(${90 + (a1 + a2)/2}, ${center + (radius * 0.85) * Math.cos((a1 + a2)/2 * Math.PI / 180)}, ${center + (radius * 0.85) * Math.sin((a1 + a2)/2 * Math.PI / 180)})`}
          style={{ textShadow: isWinner ? '0 0 5px black' : 'none' }}
        >
          {num}
        </text>
      </g>
    );
  });

  return (
    <div className="relative w-[320px] h-[320px] mx-auto mb-8">
      {/* Outer Bezel */}
      <div className="absolute inset-0 rounded-full border-8 border-yellow-700 shadow-2xl bg-yellow-900"></div>
      
      {/* The Spinning Part */}
      <div 
        className={`absolute inset-2 transition-transform cubic-bezier(0.25, 0.1, 0.25, 1) will-change-transform ${isSpinning ? 'blur-[1px]' : ''}`}
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transitionDuration: isSpinning ? '4s' : '0s' 
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 320 320">
          <g>{slices}</g>
          {/* Center Hub */}
          <circle cx={center} cy={center} r="20" fill="#b45309" stroke="#fcd34d" strokeWidth="2" />
          <circle cx={center} cy={center} r="10" fill="#fbbf24" />
        </svg>
      </div>

      {/* The Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-6 h-12 z-20 drop-shadow-lg">
        <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-400 clip-path-polygon" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
      </div>

      {/* Particles container - centered at the top where the pointer is */}
      {showEffects && (
        <div className="absolute top-0 left-1/2 z-30 w-0 h-0">
          <WinParticles />
        </div>
      )}
    </div>
  );
};