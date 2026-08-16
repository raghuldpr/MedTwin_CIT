import React, { useEffect, useRef, useState } from 'react';

interface Organ3DBrainProps {
  interactive?: boolean;
}

export const Organ3DBrain: React.FC<Organ3DBrainProps> = ({ interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationY, setRotationY] = useState(0);
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

      // Indigo / Cyan holographic brain glow
      const brainGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
      brainGlow.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
      brainGlow.addColorStop(0.4, 'rgba(59, 130, 246, 0.12)');
      brainGlow.addColorStop(0.8, 'rgba(14, 165, 233, 0.02)');
      brainGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = brainGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 220, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotationY * Math.PI) / 180);

      // Depth rings
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 130, 150, 38, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Brain Silhouette (Cerebral hemispheres + Cerebellum + Brainstem)
      const gyriGrad = ctx.createRadialGradient(0, -20, 30, 0, 20, 160);
      gyriGrad.addColorStop(0, '#818cf8');
      gyriGrad.addColorStop(0.35, '#6366f1');
      gyriGrad.addColorStop(0.7, '#4f46e5');
      gyriGrad.addColorStop(1, '#312e81');

      ctx.fillStyle = gyriGrad;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      ctx.shadowBlur = 16;

      ctx.beginPath();
      // Frontal to Occipital cortex contour
      ctx.moveTo(0, -110);
      ctx.bezierCurveTo(70, -110, 125, -60, 125, 10);
      ctx.bezierCurveTo(125, 65, 95, 105, 50, 105);
      // Cerebellum & Brainstem
      ctx.bezierCurveTo(35, 135, 15, 150, 0, 150);
      ctx.bezierCurveTo(-15, 150, -35, 135, -50, 105);
      ctx.bezierCurveTo(-95, 105, -125, 65, -125, 10);
      ctx.bezierCurveTo(-125, -60, -70, -110, 0, -110);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Holographic Sulci & Gyri neural convolutions
      ctx.strokeStyle = 'rgba(199, 210, 254, 0.8)';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 6;

      // Central sulcus & lateral fissures
      const sulci = [
        [[-40, -80], [-10, -40], [-25, 10], [-5, 60]],
        [[40, -80], [10, -40], [25, 10], [5, 60]],
        [[-80, -30], [-50, -10], [-75, 25], [-40, 55]],
        [[80, -30], [50, -10], [75, 25], [40, 55]],
        [[-20, -95], [0, -70], [20, -95]],
        [[-95, 10], [-55, 15], [-20, 30]],
        [[95, 10], [55, 15], [20, 30]],
      ];

      sulci.forEach((curve) => {
        ctx.beginPath();
        ctx.moveTo(curve[0][0], curve[0][1]);
        for (let i = 1; i < curve.length; i++) {
          ctx.lineTo(curve[i][0], curve[i][1]);
        }
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Glowing Synaptic Axon Firings (Action potentials)
      for (let s = 0; s < 18; s++) {
        const sPhase = (time * 1.2 + s * 0.35) % 1;
        const angle = s * 0.35 + time * 0.1;
        const dist = 30 + Math.sin(s * 2.3 + time) * 60;
        const sx = Math.cos(angle) * dist;
        const sy = -20 + Math.sin(angle) * (dist * 0.75);

        if (sPhase < 0.6) {
          const sparkAlpha = Math.sin((sPhase / 0.6) * Math.PI);
          ctx.fillStyle = `rgba(167, 243, 208, ${sparkAlpha * 0.95})`;
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [rotationY]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={560}
        height={560}
        className="w-full max-w-[480px] lg:max-w-[540px] h-auto aspect-square drop-shadow-[0_20px_50px_rgba(99,102,241,0.22)]"
      />
    </div>
  );
};
