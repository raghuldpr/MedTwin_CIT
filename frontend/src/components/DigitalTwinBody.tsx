import React, { useEffect, useRef } from 'react';

interface DigitalTwinBodyProps {
  selectedOrgan?: string;
  onSelectOrgan?: (organ: string) => void;
}

export const DigitalTwinBody: React.FC<DigitalTwinBodyProps> = ({
  selectedOrgan = 'Heart',
  onSelectOrgan,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let animId: number;

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 10;

      // Draw subtle holographic scan lines
      const scanY = (Math.sin(time * 0.8) * 0.5 + 0.5) * (h - 100) + 50;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, 'rgba(59, 130, 246, 0)');
      scanGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.12)');
      scanGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(cx - 140, scanY - 30, 280, 60);

      // Body silhouette background glow
      const bodyGlow = ctx.createRadialGradient(cx, cy - 20, 20, cx, cy - 20, 180);
      bodyGlow.addColorStop(0, 'rgba(239, 246, 255, 0.9)');
      bodyGlow.addColorStop(0.6, 'rgba(219, 234, 254, 0.4)');
      bodyGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = bodyGlow;
      ctx.fillRect(0, 0, w, h);

      // Human Body Silhouette
      ctx.save();
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;

      // Head
      ctx.beginPath();
      ctx.ellipse(cx, cy - 160, 28, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Neck
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 126);
      ctx.lineTo(cx - 14, cy - 105);
      ctx.lineTo(cx + 14, cy - 105);
      ctx.lineTo(cx + 12, cy - 126);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Torso & Shoulders
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 105);
      ctx.bezierCurveTo(cx - 50, cy - 100, cx - 85, cy - 85, cx - 92, cy - 50); // Left shoulder
      ctx.bezierCurveTo(cx - 98, cy + 20, cx - 85, cy + 80, cx - 78, cy + 130); // Left arm
      ctx.lineTo(cx - 62, cy + 130); // Left hand
      ctx.bezierCurveTo(cx - 65, cy + 80, cx - 60, cy + 30, cx - 48, cy + 30); // Left inner arm/waist
      ctx.bezierCurveTo(cx - 45, cy + 70, cx - 45, cy + 100, cx - 48, cy + 140); // Left hip
      ctx.bezierCurveTo(cx - 50, cy + 190, cx - 42, cy + 240, cx - 35, cy + 280); // Left leg
      ctx.lineTo(cx - 10, cy + 280);
      ctx.bezierCurveTo(cx - 12, cy + 230, cx - 15, cy + 180, cx - 4, cy + 145); // Groin
      ctx.bezierCurveTo(cx + 4, cy + 145, cx + 12, cy + 180, cx + 10, cy + 280); // Right leg
      ctx.lineTo(cx + 35, cy + 280);
      ctx.bezierCurveTo(cx + 42, cy + 240, cx + 50, cy + 190, cx + 48, cy + 140); // Right hip
      ctx.bezierCurveTo(cx + 45, cy + 100, cx + 45, cy + 70, cx + 48, cy + 30); // Right waist
      ctx.bezierCurveTo(cx + 60, cy + 30, cx + 65, cy + 80, cx + 62, cy + 130); // Right inner arm
      ctx.lineTo(cx + 78, cy + 130); // Right hand
      ctx.bezierCurveTo(cx + 85, cy + 80, cx + 98, cy + 20, cx + 92, cy - 50); // Right arm
      ctx.bezierCurveTo(cx + 85, cy - 85, cx + 50, cy - 100, cx + 14, cy - 105); // Right shoulder
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Organ Nodes Glowing Points & Connecting Pulses
      const nodes = [
        { id: 'Brain', x: cx, y: cy - 160, color: '#3b82f6' },
        { id: 'Lungs', x: cx - 18, y: cy - 55, color: '#ef4444' },
        { id: 'Heart', x: cx + 4, y: cy - 40, color: '#2563eb', pulse: true, isHeart: true },
        { id: 'Liver', x: cx - 16, y: cy - 10, color: '#10b981' },
        { id: 'Stomach', x: cx + 12, y: cy - 5, color: '#f59e0b' },
        { id: 'Kidneys', x: cx + 18, y: cy + 25, color: '#ef4444' },
        { id: 'Bladder', x: cx, y: cy + 85, color: '#06b6d4' },
      ];

      nodes.forEach(node => {
        const isSelected = selectedOrgan === node.id;
        const pulseVal = Math.sin(time * 3) * 0.5 + 0.5;

        // Node Glow Ring
        if (node.isHeart || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, isSelected ? 18 + pulseVal * 8 : 14 + pulseVal * 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? 'rgba(37, 99, 235, 0.28)'
            : 'rgba(59, 130, 246, 0.2)';
          ctx.fill();
        }

        // Center dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, isSelected ? 8 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#2563eb' : node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isSelected ? 12 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner white highlight
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedOrgan]);

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <canvas
        ref={canvasRef}
        width={340}
        height={560}
        className="w-full max-w-[280px] md:max-w-[340px] h-auto"
      />
    </div>
  );
};
