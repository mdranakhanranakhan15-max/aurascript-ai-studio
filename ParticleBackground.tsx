import React, { useEffect, useRef } from 'react';

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  currentWidth: number;
  targetWidth: number;
  currentLength: number;
  targetLength: number;
  baseAlpha: number;
  currentAlpha: number;
  targetAlpha: number;
  angle: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking state
    const mouse = {
      x: -2000,
      y: -2000,
      radius: 220, // Antigravity wave reaction radius
      active: false,
      lastMoved: 0,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const updateMouse = (clientX: number, clientY: number) => {
      mouse.x = clientX;
      mouse.y = clientY;
      mouse.active = true;
      mouse.lastMoved = Date.now();
    };

    const onMouseMove = (e: MouseEvent) => {
      updateMouse(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -2000;
      mouse.y = -2000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // Grid / Mesh Particle Generator (Google Antigravity Style)
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const gridSpacing = 28; // Spacing between dots in the grid/net
      const cols = Math.ceil(width / gridSpacing) + 2;
      const rows = Math.ceil(height / gridSpacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Subtle natural jitter to grid position so it feels like a starfield net
          const jitterX = (Math.random() - 0.5) * 8;
          const jitterY = (Math.random() - 0.5) * 8;
          const originX = c * gridSpacing + jitterX;
          const originY = r * gridSpacing + jitterY;

          const baseRadius = 0.8 + Math.random() * 0.4; // Very small dot at rest
          const baseAlpha = 0.15 + Math.random() * 0.25; // Faint, quiet dots

          particles.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            baseRadius,
            currentWidth: baseRadius * 2,
            targetWidth: baseRadius * 2,
            currentLength: 0,
            targetLength: 0,
            baseAlpha,
            currentAlpha: baseAlpha,
            targetAlpha: baseAlpha,
            angle: 0,
          });
        }
      }
    };

    initParticles();

    // Animation Render Loop
    const render = () => {
      // 1. Deep space black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Deactivate mouse if motionless for > 2 seconds
      const now = Date.now();
      if (now - mouse.lastMoved > 2000) {
        mouse.active = false;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Distance to cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (mouse.active && dist < mouse.radius) {
          // Proximity factor (1.0 at mouse center -> 0.0 at radius boundary)
          const factor = (mouse.radius - dist) / mouse.radius;
          const smoothFactor = Math.sin(factor * (Math.PI / 2)); // Smooth dome curve

          // Angle pointing radially outward from mouse
          const radialAngle = Math.atan2(dy, dx);
          p.angle = radialAngle;

          // Stretch into glowing blue pill/dash aligned radially (Antigravity net effect)
          p.targetLength = 4 + smoothFactor * 12; // Length grows up to 16px
          p.targetWidth = 1.5 + smoothFactor * 2.5; // Width grows up to 4px
          p.targetAlpha = Math.min(1, p.baseAlpha + smoothFactor * 0.75);

          // Radial expansion push (displaces particles outward in a circular wave/mesh)
          const pushDist = smoothFactor * 22;
          const targetX = p.originX + Math.cos(radialAngle) * pushDist;
          const targetY = p.originY + Math.sin(radialAngle) * pushDist;

          p.vx += (targetX - p.x) * 0.15;
          p.vy += (targetY - p.y) * 0.15;
        } else {
          // Outside cursor radius: contract back into tiny static dot
          p.targetLength = 0;
          p.targetWidth = p.baseRadius * 2;
          p.targetAlpha = p.baseAlpha;

          // Spring back to origin grid coordinates
          p.vx += (p.originX - p.x) * 0.08;
          p.vy += (p.originY - p.y) * 0.08;
        }

        // Friction damping
        p.vx *= 0.82;
        p.vy *= 0.82;

        // Position updates
        p.x += p.vx;
        p.y += p.vy;

        // Smooth size, length, and alpha interpolation
        p.currentLength += (p.targetLength - p.currentLength) * 0.2;
        p.currentWidth += (p.targetWidth - p.currentWidth) * 0.2;
        p.currentAlpha += (p.targetAlpha - p.currentAlpha) * 0.2;

        // Render Particle
        ctx.save();

        if (p.currentLength > 1.0) {
          // Radially aligned glowing blue pill/capsule (Exact Google Antigravity style)
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          // Subtle glow
          ctx.shadowColor = '#5d82ff';
          ctx.shadowBlur = p.currentLength * 0.8;

          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineWidth = p.currentWidth;
          ctx.strokeStyle = `rgba(123, 156, 255, ${p.currentAlpha})`;

          ctx.moveTo(-p.currentLength / 2, 0);
          ctx.lineTo(p.currentLength / 2, 0);
          ctx.stroke();
        } else {
          // Quiet, tiny static dot at rest
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.currentWidth / 2), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160, 185, 255, ${p.currentAlpha})`;
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-black"
    />
  );
};
