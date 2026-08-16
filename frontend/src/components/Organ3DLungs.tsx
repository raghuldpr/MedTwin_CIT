import React, { useEffect, useRef } from 'react';

export const Organ3DLungs: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.025;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 10;

      // Respiratory expansion cycle (Inspiration / Expiration)
      const breathScale = 1 + Math.sin(time * 1.6) * 0.055;

      // Cyan / Blue back ambient glow
      const lungGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
      lungGlow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      lungGlow.addColorStop(0.4, 'rgba(14, 165, 233, 0.12)');
      lungGlow.addColorStop(0.8, 'rgba(15, 23, 42, 0.02)');
      lungGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lungGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 220, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathScale, breathScale);

      // Trachea & Main Bronchi
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -140);
      ctx.lineTo(0, -50);
      ctx.stroke();

      // Bifurcation into Left & Right Main Bronchus
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.lineTo(-45, -15);
      ctx.moveTo(0, -50);
      ctx.lineTo(45, -15);
      ctx.stroke();

      // Left & Right Lung Lobes (Holographic Blue/Reddish alveolar network)
      const drawLungLobe = (isRight: boolean) => {
        ctx.save();
        const dir = isRight ? 1 : -1;
        const lobeGrad = ctx.createRadialGradient(dir * 60, 20, 10, dir * 60, 20, 120);
        lobeGrad.addColorStop(0, '#38bdf8');
        lobeGrad.addColorStop(0.4, '#0284c7');
        lobeGrad.addColorStop(0.75, 'rgba(239, 68, 68, 0.65)');
        lobeGrad.addColorStop(1, 'rgba(15, 23, 42, 0.4)');

        ctx.fillStyle = lobeGrad;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.moveTo(dir * 12, -40);
        ctx.bezierCurveTo(dir * 25, -95, dir * 105, -75, dir * 115, 0);
        ctx.bezierCurveTo(dir * 125, 65, dir * 115, 125, dir * 55, 140);
        ctx.bezierCurveTo(dir * 25, 145, dir * 15, 115, dir * 12, 45);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bronchial Tree Branches
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(dir * 45, -15);
        ctx.lineTo(dir * 80, 20);
        ctx.lineTo(dir * 95, 60);

        ctx.moveTo(dir * 80, 20);
        ctx.lineTo(dir * 65, 75);

        ctx.moveTo(dir * 45, -15);
        ctx.lineTo(dir * 40, 50);
        ctx.lineTo(dir * 30, 95);

        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      };

      drawLungLobe(false);
      drawLungLobe(true);

      // Oxygen stream particles
      for (let i = 0; i < 14; i++) {
        const pProg = (time * 0.8 + i * 0.15) % 1;
        const side = i % 2 === 0 ? 1 : -1;
        const px = side * (20 + pProg * 60);
        const py = -40 + pProg * 120;
        ctx.fillStyle = `rgba(56, 189, 248, ${Math.sin(pProg * Math.PI) * 0.9})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

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
        className="w-full max-w-[480px] lg:max-w-[540px] h-auto aspect-square drop-shadow-[0_20px_50px_rgba(56,189,248,0.2)]"
      />
    </div>
  );
};
