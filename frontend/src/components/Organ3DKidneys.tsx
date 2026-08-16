import React, { useEffect, useRef } from 'react';

export const Organ3DKidneys: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 10;

      // Deep cyan/blue back glow
      const renalGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
      renalGlow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      renalGlow.addColorStop(0.4, 'rgba(37, 99, 235, 0.12)');
      renalGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = renalGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 220, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);

      // Central Aorta & Inferior Vena Cava
      // Vena Cava (Blue)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-10, -140);
      ctx.lineTo(-10, 140);
      ctx.stroke();

      // Abdominal Aorta (Red)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(10, -140);
      ctx.lineTo(10, 140);
      ctx.stroke();

      // Left & Right Renal Organs
      const drawKidney = (isRight: boolean) => {
        ctx.save();
        const dir = isRight ? 1 : -1;
        const kx = dir * 90;
        const ky = 0;

        // Renal Artery (Red branch)
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(dir * 10, -15);
        ctx.lineTo(kx - dir * 20, ky);
        ctx.stroke();

        // Renal Vein (Blue branch)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(dir * -10, 15);
        ctx.lineTo(kx - dir * 20, ky + 10);
        ctx.stroke();

        // Ureter (descending)
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(kx - dir * 15, ky + 25);
        ctx.bezierCurveTo(kx - dir * 30, ky + 80, dir * 15, ky + 120, dir * 12, ky + 160);
        ctx.stroke();

        // Bean-shaped Kidney Cortex
        const kGrad = ctx.createRadialGradient(kx, ky, 10, kx, ky, 65);
        kGrad.addColorStop(0, '#f87171');
        kGrad.addColorStop(0.35, '#dc2626');
        kGrad.addColorStop(0.7, '#991b1b');
        kGrad.addColorStop(1, '#450a0a');

        ctx.fillStyle = kGrad;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.moveTo(kx - dir * 15, ky - 60);
        ctx.bezierCurveTo(kx + dir * 65, ky - 50, kx + dir * 65, ky + 50, kx - dir * 15, ky + 60);
        // Medial hilum concavity
        ctx.bezierCurveTo(kx + dir * 5, ky + 30, kx + dir * 5, ky - 30, kx - dir * 15, ky - 60);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Glomerular filtration light sparks
        for (let g = 0; g < 6; g++) {
          const gProg = (time * 0.9 + g * 0.25) % 1;
          const gx = kx + (Math.sin(g * 1.7) * 20);
          const gy = ky + (Math.cos(g * 2.1) * 35);
          ctx.fillStyle = `rgba(56, 189, 248, ${Math.sin(gProg * Math.PI)})`;
          ctx.beginPath();
          ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      };

      drawKidney(false);
      drawKidney(true);

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={560}
        height={560}
        className="w-full max-w-[480px] lg:max-w-[540px] h-auto aspect-square drop-shadow-[0_20px_50px_rgba(239,68,68,0.2)]"
      />
    </div>
  );
};
