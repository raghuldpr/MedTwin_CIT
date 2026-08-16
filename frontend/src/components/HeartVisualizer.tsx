import React, { useEffect, useRef, useState } from 'react';

interface HeartVisualizerProps {
  bpm?: number;
  interactive?: boolean;
}

export const HeartVisualizer: React.FC<HeartVisualizerProps> = ({ bpm = 78, interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const beatInterval = (60 / bpm) * 1000;

    const render = () => {
      time += 16;
      const beatProgress = (time % beatInterval) / beatInterval;
      // Dual peak heartbeat scale simulation (lub-dub)
      let heartScale = 1;
      if (beatProgress < 0.12) {
        heartScale = 1 + Math.sin((beatProgress / 0.12) * Math.PI) * 0.09;
      } else if (beatProgress > 0.2 && beatProgress < 0.35) {
        heartScale = 1 + Math.sin(((beatProgress - 0.2) / 0.15) * Math.PI) * 0.05;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background ambient cardiac glow
      const cx = width / 2;
      const cy = height / 2;

      const bgGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.min(width, height) * 0.5);
      bgGlow.addColorStop(0, 'rgba(37, 99, 235, 0.18)');
      bgGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.06)');
      bgGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotation.y * Math.PI) / 180);
      ctx.scale(heartScale, heartScale);

      // Subtle 3D grid depth rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 110, 140, 35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Blood vessel particles flow upwards
      for (let i = 0; i < 8; i++) {
        const pProgress = ((time * 0.001 + i * 0.12) % 1);
        const px = -20 + Math.sin(pProgress * Math.PI) * 15;
        const py = -60 - pProgress * 80;
        ctx.fillStyle = `rgba(239, 68, 68, ${1 - pProgress})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Main Aorta Arch
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-15, -40);
      ctx.bezierCurveTo(-25, -110, 35, -120, 30, -50);
      ctx.stroke();

      // Aorta Branching Vessels (Brachiocephalic, Left Common Carotid, Left Subclavian)
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(-10, -95);
      ctx.lineTo(-20, -125);
      ctx.moveTo(2, -102);
      ctx.lineTo(2, -132);
      ctx.moveTo(15, -98);
      ctx.lineTo(24, -125);
      ctx.stroke();

      // Pulmonary Artery (Blue/Cyan)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(10, -40);
      ctx.bezierCurveTo(45, -70, 75, -50, 70, -30);
      ctx.stroke();

      // Superior Vena Cava
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(-45, -80);
      ctx.lineTo(-40, -30);
      ctx.stroke();

      // Heart Muscle Mass Body (Stylized 3D Volume)
      const heartGrad = ctx.createRadialGradient(-20, -10, 15, 0, 20, 120);
      heartGrad.addColorStop(0, '#f43f5e');
      heartGrad.addColorStop(0.35, '#e11d48');
      heartGrad.addColorStop(0.7, '#be123c');
      heartGrad.addColorStop(1, '#881337');

      ctx.fillStyle = heartGrad;
      ctx.beginPath();
      // Anatomical heart silhouette
      ctx.moveTo(0, -30);
      // Right atrium & ventricle curve
      ctx.bezierCurveTo(-50, -50, -90, -10, -75, 40);
      ctx.bezierCurveTo(-65, 80, -30, 110, 0, 135);
      // Left ventricle & atrium curve (apex to top)
      ctx.bezierCurveTo(30, 110, 75, 75, 75, 30);
      ctx.bezierCurveTo(75, -20, 45, -45, 0, -30);
      ctx.closePath();
      ctx.fill();

      // Coronary Arteries network (Glowing red/gold branches across myocardium)
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(254, 205, 211, 0.85)';
      ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      // Left anterior descending artery
      ctx.moveTo(-5, -20);
      ctx.bezierCurveTo(-15, 20, -5, 60, -8, 110);
      // Diagonal branches
      ctx.moveTo(-10, 20);
      ctx.lineTo(-45, 40);
      ctx.moveTo(-8, 50);
      ctx.lineTo(-40, 75);
      ctx.moveTo(-7, 40);
      ctx.lineTo(25, 65);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Holographic Digital Twin wireframe mesh overlay
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      for (let y = -20; y <= 110; y += 22) {
        const progress = (y + 20) / 130;
        const hw = Math.sin(progress * Math.PI) * 65;
        if (hw > 5) {
          ctx.beginPath();
          ctx.ellipse(0, y, hw, hw * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Cardiac electrical node flash (SA Node pulse)
      if (beatProgress < 0.18) {
        const pulseAlpha = Math.sin((beatProgress / 0.18) * Math.PI);
        ctx.fillStyle = `rgba(250, 204, 21, ${pulseAlpha * 0.9})`;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-35, -25, 6, 0, Math.PI * 2);
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
  }, [bpm, rotation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    setRotation(prev => ({
      ...prev,
      y: prev.y + deltaX * 0.6,
    }));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={540}
        height={540}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full max-w-[500px] h-auto aspect-square cursor-grab active:cursor-grabbing touch-none"
      />
      {interactive && (
        <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5 pointer-events-none">
          <span className="material-symbols-outlined text-[16px] text-blue-400">3d_rotation</span>
          Drag to inspect 3D Twin
        </div>
      )}
    </div>
  );
};
