import React, { useEffect, useRef, useState } from 'react';

interface Organ3DHeartProps {
  bpm?: number;
  interactive?: boolean;
}

export const Organ3DHeart: React.FC<Organ3DHeartProps> = ({ bpm = 78, interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationY, setRotationY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const beatDuration = (60 / bpm) * 1000;

    const render = () => {
      time += 16;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 10;

      // Realistic cardiac dual-peak contraction (Systole / Diastole)
      const beatProg = (time % beatDuration) / beatDuration;
      let heartScale = 1;
      if (beatProg < 0.12) {
        heartScale = 1 + Math.sin((beatProg / 0.12) * Math.PI) * 0.085;
      } else if (beatProg > 0.18 && beatProg < 0.32) {
        heartScale = 1 + Math.sin(((beatProg - 0.18) / 0.14) * Math.PI) * 0.045;
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);

      // Deep volumetric ambient glow behind heart
      const ambientGlow = ctx.createRadialGradient(0, 0, 30, 0, 0, 220);
      ambientGlow.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
      ambientGlow.addColorStop(0.4, 'rgba(185, 28, 28, 0.1)');
      ambientGlow.addColorStop(0.8, 'rgba(15, 23, 42, 0.02)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 220, 0, Math.PI * 2);
      ctx.fill();

      // Interactive 3D Rotation transform
      ctx.rotate((rotationY * Math.PI) / 180);
      ctx.scale(heartScale, heartScale);

      // 1. Concentric Holographic 3D Depth Rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 130, 160, 42, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Ascending Aorta Arch & Branches (Deep Red & Oxygenated)
      ctx.save();
      // Main Arch
      const aortaGrad = ctx.createLinearGradient(-30, -120, 40, -40);
      aortaGrad.addColorStop(0, '#ef4444');
      aortaGrad.addColorStop(0.5, '#dc2626');
      aortaGrad.addColorStop(1, '#991b1b');
      ctx.strokeStyle = aortaGrad;
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-18, -40);
      ctx.bezierCurveTo(-35, -125, 45, -135, 38, -50);
      ctx.stroke();

      // Brachiocephalic trunk, Carotid, Subclavian arteries
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(-15, -108);
      ctx.lineTo(-26, -145);
      ctx.moveTo(3, -118);
      ctx.lineTo(3, -152);
      ctx.moveTo(22, -112);
      ctx.lineTo(32, -145);
      ctx.stroke();
      ctx.restore();

      // 3. Pulmonary Trunk (Cyan / Blue deoxygenated)
      ctx.save();
      const pulmGrad = ctx.createLinearGradient(0, -40, 70, -30);
      pulmGrad.addColorStop(0, '#0284c7');
      pulmGrad.addColorStop(1, '#0369a1');
      ctx.strokeStyle = pulmGrad;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(8, -42);
      ctx.bezierCurveTo(45, -75, 85, -55, 78, -25);
      ctx.stroke();

      // Superior Vena Cava
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-52, -90);
      ctx.lineTo(-44, -30);
      ctx.stroke();
      ctx.restore();

      // 4. Photorealistic Myocardial Ventricles & Atria Muscle Mass
      ctx.save();
      const heartMuscleGrad = ctx.createRadialGradient(-30, -10, 20, 0, 30, 140);
      heartMuscleGrad.addColorStop(0, '#fb7185');
      heartMuscleGrad.addColorStop(0.25, '#f43f5e');
      heartMuscleGrad.addColorStop(0.55, '#e11d48');
      heartMuscleGrad.addColorStop(0.8, '#be123c');
      heartMuscleGrad.addColorStop(1, '#881337');

      ctx.fillStyle = heartMuscleGrad;
      ctx.shadowColor = 'rgba(244, 63, 94, 0.4)';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      // Base at top
      ctx.moveTo(0, -32);
      // Right Atrium & Ventricle
      ctx.bezierCurveTo(-55, -55, -105, -12, -88, 45);
      ctx.bezierCurveTo(-75, 90, -35, 125, 0, 155);
      // Left Ventricle Apex to Left Atrium
      ctx.bezierCurveTo(35, 125, 88, 85, 88, 35);
      ctx.bezierCurveTo(88, -20, 52, -48, 0, -32);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 5. Coronary Artery Tree with Pulsing Blood Flow
      ctx.save();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(254, 226, 226, 0.9)';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      // Left Anterior Descending (LAD)
      ctx.moveTo(-6, -22);
      ctx.bezierCurveTo(-18, 20, -8, 70, -10, 128);
      // Diagonal branches
      ctx.moveTo(-12, 22);
      ctx.lineTo(-52, 45);
      ctx.moveTo(-9, 56);
      ctx.lineTo(-48, 85);
      ctx.moveTo(-8, 44);
      ctx.lineTo(32, 70);
      ctx.moveTo(-9, 82);
      ctx.lineTo(24, 108);
      ctx.stroke();

      // Right Coronary Artery (RCA)
      ctx.moveTo(-45, 0);
      ctx.bezierCurveTo(-65, 30, -50, 75, -20, 120);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 6. Streaming Oxygenated Erythrocyte Particles (Blood flow)
      for (let i = 0; i < 12; i++) {
        const pProg = ((time * 0.0008 + i * 0.08) % 1);
        const px = -22 + Math.sin(pProg * Math.PI) * 20;
        const py = -50 - pProg * 90;
        ctx.fillStyle = `rgba(248, 113, 113, ${1 - pProg})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Sinoatrial (SA) Node Cardiac Electrical Pulse
      if (beatProg < 0.16) {
        const flashAlpha = Math.sin((beatProg / 0.16) * Math.PI);
        ctx.fillStyle = `rgba(250, 204, 21, ${flashAlpha * 0.95})`;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(-42, -28, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [bpm, rotationY, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    setRotationY((prev) => prev + deltaX * 0.65);
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <canvas
          ref={canvasRef}
          width={560}
          height={560}
          className="w-full max-w-[480px] lg:max-w-[540px] h-auto aspect-square drop-shadow-[0_20px_50px_rgba(244,63,94,0.18)]"
        />
      </div>

      {/* Floating 3D Interaction Pill */}
      {interactive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300 shadow-xl pointer-events-auto">
          <button
            onClick={() => setRotationY((prev) => prev + 45)}
            className="flex items-center gap-1 hover:text-blue-400 px-1.5 py-0.5 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-400">rotate_right</span>
            Rotate
          </button>
          <span className="w-px h-3 bg-slate-700"></span>
          <button
            onClick={() => setZoom((prev) => (prev >= 1.3 ? 1 : prev + 0.15))}
            className="flex items-center gap-1 hover:text-blue-400 px-1.5 py-0.5 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-400">zoom_in</span>
            Zoom
          </button>
          <span className="w-px h-3 bg-slate-700"></span>
          <button
            onClick={() => {
              setRotationY(0);
              setZoom(1);
            }}
            className="flex items-center gap-1 hover:text-blue-400 px-1.5 py-0.5 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">restart_alt</span>
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
