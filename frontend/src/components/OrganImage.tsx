import React, { useState, useEffect } from 'react';
import { getAssetCandidates } from '../config/assets';

interface OrganImageProps {
  organ: string; // 'heart' | 'brain' | 'lungs' | 'kidneys' | 'liver' | 'stomach' | 'body' | 'upperBody' | 'upper-body'
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'full';
  floating?: boolean;
  pulse?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const OrganImage: React.FC<OrganImageProps> = ({
  organ,
  className = '',
  size = 'lg',
  floating = true,
  pulse = false,
  interactive = false,
  onClick,
}) => {
  const candidates = getAssetCandidates(organ);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [allFailed, setAllFailed] = useState(false);

  // Reset when organ changes
  useEffect(() => {
    setCandidateIndex(0);
    setHasLoaded(false);
    setAllFailed(false);
  }, [organ]);

  const currentSrc = candidates[candidateIndex] || '';

  const handleImageError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1);
      setHasLoaded(false);
    } else {
      setAllFailed(true);
    }
  };

  const handleImageLoad = () => {
    setHasLoaded(true);
    setAllFailed(false);
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-56 h-56 md:w-72 md:h-72',
    hero: 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[440px] lg:h-[440px]',
    full: 'w-full h-full',
  };

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none ${sizeClasses[size]} ${
        interactive ? 'cursor-pointer transition-transform duration-300 hover:scale-105' : ''
      } ${className}`}
    >
      {/* Subtle floating medical render */}
      <div
        className={`w-full h-full flex items-center justify-center ${
          floating ? 'animate-medtwin-float' : ''
        } ${pulse ? 'animate-medtwin-pulse' : ''}`}
      >
        {!allFailed ? (
          <img
            src={currentSrc}
            alt=""
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-opacity duration-300 ${
              hasLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            referrerPolicy="no-referrer"
          />
        ) : (
          /* Clean subtle fallback when asset cannot be loaded */
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xs text-slate-400 max-w-[280px]">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-slate-300">Anatomical image unavailable</p>
            <span className="text-[10px] text-slate-500 mt-0.5 capitalize">{organ} stream awaiting asset</span>
          </div>
        )}
      </div>
    </div>
  );
};
