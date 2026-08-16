import React, { useEffect, useRef } from 'react';

interface MedicalWaveformProps {
  type?: 'ecg' | 'bp' | 'spo2' | 'glucose' | 'eeg' | 'respiratory' | 'simple';
  color?: string;
  height?: number;
  animated?: boolean;
  className?: string;
}

export const MedicalWaveform: React.FC<MedicalWaveformProps> = ({
  type = 'ecg',
  color = '#f43f5e',
  height = 36,
  animated = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offsetRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (animated) {
        offsetRef.current = (offsetRef.current + 1.2) % 200;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const midY = h / 2;

      for (let x = 0; x < w; x += 1) {
        const t = (x + offsetRef.current) % 180;
        let y = midY;

        if (type === 'ecg') {
          // P-Q-R-S-T cardiac cycle
          if (t >= 30 && t < 45) {
            // P wave
            y = midY - Math.sin(((t - 30) / 15) * Math.PI) * 4;
          } else if (t >= 55 && t < 60) {
            // Q wave
            y = midY + 4;
          } else if (t >= 60 && t < 68) {
            // R spike
            y = midY - (h * 0.42);
          } else if (t >= 68 && t < 74) {
            // S dip
            y = midY + 7;
          } else if (t >= 85 && t < 110) {
            // T wave
            y = midY - Math.sin(((t - 85) / 25) * Math.PI) * 6;
          }
        } else if (type === 'bp') {
          // Arterial dicrotic notch wave
          const cycle = t % 90;
          if (cycle < 35) {
            y = midY - Math.sin((cycle / 35) * Math.PI) * (h * 0.35);
          } else if (cycle >= 35 && cycle < 50) {
            // Dicrotic notch
            y = midY - 3 + Math.sin(((cycle - 35) / 15) * Math.PI) * 4;
          } else {
            y = midY + (cycle - 50) * 0.1;
          }
        } else if (type === 'spo2' || type === 'respiratory') {
          // Smooth sinusoidal respiratory wave
          y = midY + Math.sin(t * 0.08) * (h * 0.32);
        } else if (type === 'glucose') {
          // Mild metabolic trend curve
          y = midY + Math.sin(t * 0.04) * 5 + Math.cos(t * 0.09) * 3;
        } else if (type === 'eeg') {
          // High frequency neural EEG beta/alpha waves
          y = midY + Math.sin(t * 0.25) * 6 + Math.sin(t * 0.6) * 4 + (Math.random() - 0.5) * 1.5;
        } else {
          y = midY + Math.sin(t * 0.1) * 6;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      if (animated) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [type, color, animated]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={height}
      className={`w-full h-[${height}px] ${className}`}
      style={{ height: `${height}px` }}
    />
  );
};
