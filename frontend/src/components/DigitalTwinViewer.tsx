import React, { useEffect, useRef, useState } from 'react';
import { OrganId } from '../types';

interface DigitalTwinViewerProps {
  selectedOrgan?: OrganId | string;
  onSelectOrgan?: (organId: OrganId) => void;
  showControls?: boolean;
  viewMode?: 'standard' | 'xray' | 'bloodflow' | 'isolated';
  height?: number | string;
  interactive?: boolean;
}

export const DigitalTwinViewer: React.FC<DigitalTwinViewerProps> = ({
  selectedOrgan = 'heart',
  onSelectOrgan,
  showControls = true,
  viewMode = 'standard',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<'standard' | 'xray' | 'bloodflow'>(viewMode as any);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
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
      const cy = h / 2 - 15;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      // 1. Concentric Holographic Floor Projection Rings
      const floorY = cy + 245;
      for (let r = 1; r <= 3; r++) {
        const ringRadius = 70 + r * 35;
        const ringPulse = Math.sin(time * 2 - r * 0.5) * 0.15 + 0.85;

        // Radial glow ellipse
        ctx.beginPath();
        ctx.ellipse(cx, floorY, ringRadius, ringRadius * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * ringPulse * (4 - r) / 3})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // High-tech floor tick dashes
        if (r === 2) {
          ctx.setLineDash([6, 10]);
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Vertical Upward Holographic Scan Beam
      const scanY = (Math.sin(time * 0.9) * 0.5 + 0.5) * 360 + (cy - 180);
      const scanGrad = ctx.createLinearGradient(0, scanY - 25, 0, scanY + 25);
      scanGrad.addColorStop(0, 'rgba(59, 130, 246, 0)');
      scanGrad.addColorStop(0.5, mode === 'xray' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(59, 130, 246, 0.14)');
      scanGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(cx - 150, scanY - 25, 300, 50);

      // Floor center light pool
      const floorGlow = ctx.createRadialGradient(cx, floorY, 10, cx, floorY, 130);
      floorGlow.addColorStop(0, 'rgba(96, 165, 250, 0.45)');
      floorGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
      floorGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = floorGlow;
      ctx.beginPath();
      ctx.ellipse(cx, floorY, 130, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floating bio-data particle motes
      for (let i = 0; i < 14; i++) {
        const pPhase = (time * 0.4 + i * 0.22) % 1;
        const px = cx + Math.sin(i * 1.5 + time) * (60 + (i % 5) * 12);
        const py = floorY - pPhase * 380;
        const pAlpha = Math.sin(pPhase * Math.PI) * 0.7;
        ctx.fillStyle = mode === 'bloodflow' ? `rgba(239, 68, 68, ${pAlpha})` : `rgba(56, 189, 248, ${pAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Anatomical Male Silhouette Rendering
      ctx.save();
      const isXray = mode === 'xray';
      const isBloodFlow = mode === 'bloodflow';

      // Soft volumetric body shadow / back-glow
      const bodyGlow = ctx.createRadialGradient(cx, cy - 20, 20, cx, cy - 20, 160);
      bodyGlow.addColorStop(0, isXray ? 'rgba(14, 165, 233, 0.15)' : 'rgba(239, 246, 255, 0.95)');
      bodyGlow.addColorStop(0.7, isXray ? 'rgba(14, 165, 233, 0.04)' : 'rgba(219, 234, 254, 0.35)');
      bodyGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = bodyGlow;
      ctx.fillRect(0, 0, w, h);

      // Anatomical Silhouette Path
      ctx.beginPath();
      // Head / Cranium
      ctx.ellipse(cx, cy - 165, 24, 30, 0, 0, Math.PI * 2);
      // Neck
      ctx.moveTo(cx - 10, cy - 138);
      ctx.lineTo(cx - 12, cy - 118);
      // Left Trapezius & Shoulder
      ctx.bezierCurveTo(cx - 35, cy - 116, cx - 68, cy - 102, cx - 74, cy - 75);
      // Left Arm & Bicep / Forearm
      ctx.bezierCurveTo(cx - 82, cy - 20, cx - 74, cy + 35, cx - 68, cy + 85);
      // Left Hand
      ctx.lineTo(cx - 56, cy + 85);
      // Left Inner Arm
      ctx.bezierCurveTo(cx - 58, cy + 40, cx - 56, cy - 5, cx - 44, cy - 10);
      // Left Latissimus / Waist
      ctx.bezierCurveTo(cx - 40, cy + 25, cx - 40, cy + 55, cx - 44, cy + 85);
      // Left Thigh / Quad
      ctx.bezierCurveTo(cx - 46, cy + 130, cx - 40, cy + 175, cx - 32, cy + 225);
      // Left Calf & Ankle
      ctx.bezierCurveTo(cx - 30, cy + 245, cx - 30, cy + 250, cx - 22, cy + 250);
      // Left Inner Leg to Groin
      ctx.bezierCurveTo(cx - 16, cy + 210, cx - 14, cy + 150, cx - 2, cy + 105);
      // Right Groin to Inner Leg
      ctx.bezierCurveTo(cx + 14, cy + 150, cx + 16, cy + 210, cx + 22, cy + 250);
      // Right Foot / Calf
      ctx.bezierCurveTo(cx + 30, cy + 250, cx + 30, cy + 245, cx + 32, cy + 225);
      // Right Quad / Thigh
      ctx.bezierCurveTo(cx + 40, cy + 175, cx + 46, cy + 130, cx + 44, cy + 85);
      // Right Waist & Lat
      ctx.bezierCurveTo(cx + 40, cy + 55, cx + 40, cy + 25, cx + 44, cy - 10);
      // Right Inner Arm
      ctx.bezierCurveTo(cx + 56, cy - 5, cx + 58, cy + 40, cx + 56, cy + 85);
      // Right Hand
      ctx.lineTo(cx + 68, cy + 85);
      // Right Outer Arm
      ctx.bezierCurveTo(cx + 74, cy + 35, cx + 82, cy - 20, cx + 74, cy - 75);
      // Right Shoulder & Trap
      ctx.bezierCurveTo(cx + 68, cy - 102, cx + 35, cy - 116, cx + 12, cy - 118);
      ctx.lineTo(cx + 10, cy - 138);
      ctx.closePath();

      if (isXray) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Realistic skin-tone gradient
        const skinGrad = ctx.createLinearGradient(0, cy - 180, 0, cy + 250);
        skinGrad.addColorStop(0, '#fcd3b6');
        skinGrad.addColorStop(0.3, '#f9be99');
        skinGrad.addColorStop(0.65, '#e09873');
        skinGrad.addColorStop(1, '#c87c53');
        ctx.fillStyle = skinGrad;
        ctx.fill();
        ctx.strokeStyle = '#e2b397';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Athletic shorts
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - 38, cy + 62);
        ctx.lineTo(cx + 38, cy + 62);
        ctx.lineTo(cx + 36, cy + 115);
        ctx.lineTo(cx + 6, cy + 115);
        ctx.lineTo(cx, cy + 100);
        ctx.lineTo(cx - 6, cy + 115);
        ctx.lineTo(cx - 36, cy + 115);
        ctx.closePath();
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.restore();
      }

      // 3. Circulatory / Blood Flow overlay if enabled
      if (isBloodFlow || !isXray) {
        ctx.strokeStyle = isBloodFlow ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = isBloodFlow ? 2 : 1.2;
        // Central Aorta & Iliac bifurcation
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy - 45);
        ctx.lineTo(cx, cy + 45);
        ctx.lineTo(cx - 18, cy + 120);
        ctx.moveTo(cx, cy + 45);
        ctx.lineTo(cx + 18, cy + 120);
        // Subclavian to arms
        ctx.moveTo(cx + 2, cy - 50);
        ctx.lineTo(cx - 50, cy - 40);
        ctx.moveTo(cx + 2, cy - 50);
        ctx.lineTo(cx + 50, cy - 40);
        // Carotid to brain
        ctx.moveTo(cx + 2, cy - 60);
        ctx.lineTo(cx, cy - 140);
        ctx.stroke();
      }

      // 4. Glowing Organ Diagnostic Nodes
      const organNodes: { id: OrganId; x: number; y: number; color: string; label: string }[] = [
        { id: 'brain', x: cx, y: cy - 165, color: '#6366f1', label: 'Brain' },
        { id: 'lungs', x: cx - 18, y: cy - 65, color: '#f43f5e', label: 'Lungs' },
        { id: 'heart', x: cx + 3, y: cy - 50, color: '#2563eb', label: 'Heart' },
        { id: 'liver', x: cx - 16, y: cy - 20, color: '#854d0e', label: 'Liver' },
        { id: 'stomach', x: cx + 12, y: cy - 15, color: '#ef4444', label: 'Stomach' },
        { id: 'kidneys', x: cx + 15, y: cy + 15, color: '#ef4444', label: 'Kidneys' },
        { id: 'bladder', x: cx, y: cy + 70, color: '#06b6d4', label: 'Bladder' },
        { id: 'muscles', x: cx + 45, y: cy + 30, color: '#f43f5e', label: 'Muscles' },
        { id: 'bones', x: cx - 22, y: cy + 180, color: '#38bdf8', label: 'Bones' },
        { id: 'skin', x: cx + 22, y: cy + 180, color: '#f97316', label: 'Skin' },
      ];

      organNodes.forEach((node) => {
        const isSelected = selectedOrgan?.toLowerCase() === node.id.toLowerCase();
        const pulse = Math.sin(time * 3 + (isSelected ? 1 : 0)) * 0.5 + 0.5;

        // Halo circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, isSelected ? 16 + pulse * 6 : 10 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? 'rgba(37, 99, 235, 0.35)'
          : `rgba(59, 130, 246, ${0.15 + pulse * 0.1})`;
        ctx.fill();

        // Node center core
        ctx.beginPath();
        ctx.arc(node.x, node.y, isSelected ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#2563eb' : node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isSelected ? 14 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // White nucleus spark
        ctx.beginPath();
        ctx.arc(node.x, node.y, isSelected ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      ctx.restore(); // Restore body transform
      ctx.restore(); // Restore global context

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [rotation, zoom, mode, selectedOrgan]);

  // Mouse / Touch Drag interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    setRotation((prev) => prev + deltaX * 0.6);
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    setZoom((prev) => Math.min(Math.max(prev - e.deltaY * 0.001, 0.8), 1.6));
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setMode('standard');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden">
      {/* 3D Canvas Viewport */}
      <div
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={440}
          height={560}
          className="w-full max-w-[340px] md:max-w-[420px] h-auto aspect-[440/560] drop-shadow-md"
        />
      </div>

      {/* Floating 3D Control Bar matching Image 1 & 2 */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/80 shadow-md">
          {/* Rotate Button */}
          <button
            onClick={() => setRotation((prev) => prev + 45)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-2 py-1 rounded-full transition-colors"
            title="Rotate 3D Model"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-500">3d_rotation</span>
            <span className="hidden sm:inline">Rotate</span>
          </button>

          <span className="w-px h-3.5 bg-slate-200"></span>

          {/* Zoom In/Out */}
          <button
            onClick={() => setZoom((prev) => (prev >= 1.4 ? 1 : prev + 0.2))}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-2 py-1 rounded-full transition-colors"
            title="Zoom"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-500">zoom_in</span>
            <span className="hidden sm:inline">Zoom</span>
          </button>

          <span className="w-px h-3.5 bg-slate-200"></span>

          {/* Reset View */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-2 py-1 rounded-full transition-colors"
            title="Reset View"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400">restart_alt</span>
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      )}
    </div>
  );
};
