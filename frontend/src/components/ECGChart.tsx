import React, { useEffect, useState } from 'react';

interface ECGChartProps {
  type?: 'ecg' | 'eeg' | 'spiro' | 'nephron' | 'hepatic' | 'gastric';
  color?: string;
  height?: number;
  interactive?: boolean;
  bpm?: number;
}

export const ECGChart: React.FC<ECGChartProps> = ({
  type = 'ecg',
  color = '#38bdf8',
  height = 70,
  interactive = false,
  bpm = 78,
}) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 2) % 400);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const getPathData = () => {
    switch (type) {
      case 'ecg':
        // Standard P-Q-R-S-T cardiac waveform pattern repeated
        return 'M 0 35 L 20 35 L 25 33 L 30 35 L 45 35 L 50 40 L 55 5 L 62 60 L 68 35 L 75 35 L 85 28 L 95 35 L 130 35 L 150 35 L 155 33 L 160 35 L 175 35 L 180 40 L 185 5 L 192 60 L 198 35 L 205 35 L 215 28 L 225 35 L 260 35 L 280 35 L 285 33 L 290 35 L 305 35 L 310 40 L 315 5 L 322 60 L 328 35 L 335 35 L 345 28 L 355 35 L 400 35';

      case 'eeg':
        // Alpha/Beta brainwave frequency rhythms
        return 'M 0 35 Q 15 20, 30 35 T 60 35 T 90 20 T 120 48 T 150 35 T 180 18 T 210 50 T 240 35 T 270 22 T 300 46 T 330 35 T 360 20 T 400 35';

      case 'spiro':
        // Smooth sine respiratory inhalation/exhalation curve
        return 'M 0 35 C 30 10, 70 10, 100 35 C 130 60, 170 60, 200 35 C 230 10, 270 10, 300 35 C 330 60, 370 60, 400 35';

      case 'nephron':
        // Glomerular filtration pressure wave
        return 'M 0 35 Q 20 25, 40 35 T 80 40 T 120 28 T 160 35 T 200 30 T 240 38 T 280 32 T 320 36 T 360 30 T 400 35';

      default:
        return 'M 0 35 Q 25 20, 50 35 T 100 35 T 150 35 T 200 35 T 250 35 T 300 35 T 350 35 T 400 35';
    }
  };

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height }}>
      {/* Background medical grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      <svg
        viewBox="0 0 400 70"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      >
        <defs>
          <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="70%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
        </defs>

        <path
          d={getPathData()}
          fill="none"
          stroke={`url(#grad-${type})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Live scanning pulse dot */}
        <circle
          cx={offset}
          cy={type === 'ecg' ? 35 : 35}
          r="3"
          fill="#ffffff"
          className="animate-ping"
          opacity="0.75"
        />
        <circle
          cx={offset}
          cy={type === 'ecg' ? 35 : 35}
          r="2.5"
          fill={color}
        />
      </svg>
    </div>
  );
};
