import React, { useEffect, useRef } from 'react';

export const LiquidGlassBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for interactive 3D wave reaction
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // 3D Perspective Ground Plane Configuration
    // Grid fans out from horizon (middle) and cascades down past the bottom
    const COLS = 64;
    const ROWS = 48;
    const SPACING_X = 54;
    const NEAR_Z = 40;
    const FAR_Z = 1650;
    const FOV = 460;

    let time = 0;

    const render = () => {
      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      time += 0.018;

      // Detect current theme (dark vs light)
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      // Background clear
      ctx.fillStyle = isLight ? '#F2F5FA' : '#070A10';
      ctx.fillRect(0, 0, width, height);

      // Horizon position: starts around the middle of the screen
      const horizonY = height * 0.36;
      const cameraPitch = height * 0.68;

      // Mouse tilt offsets
      const tiltX = ((mouseX - width / 2) / width) * 60;
      const tiltY = ((mouseY - height / 2) / height) * 35;

      // Draw from back (far horizon) to front (bottom foreground) so near dots overlap far dots
      for (let r = 0; r < ROWS; r++) {
        // r = 0 is far horizon, r = ROWS - 1 is closest foreground
        const tZ = r / (ROWS - 1);
        const worldZ = FAR_Z - tZ * (FAR_Z - NEAR_Z);

        // Perspective scale factor
        const scale = FOV / (FOV + worldZ);

        // Wave travels forward from horizon to camera
        const zWavePhase = worldZ * 0.004 - time * 1.4;

        for (let c = 0; c < COLS; c++) {
          // 3D X coordinate
          const worldX = (c - COLS / 2) * SPACING_X + tiltX * (1 - scale * 0.5);

          // Rolling undulating 3D sine terrain waves
          const wave1 = Math.sin(worldX * 0.0035 + zWavePhase) * 48;
          const wave2 = Math.cos(worldZ * 0.0055 - time * 1.1) * 38;
          const wave3 = Math.sin((worldX + worldZ) * 0.002 - time * 0.8) * 24;

          // Interactive cursor proximity ripple
          const dx = worldX - (mouseX - width / 2) * 1.3;
          const dz = worldZ - ((height - mouseY) / height) * (FAR_Z - NEAR_Z);
          const distToMouse = Math.sqrt(dx * dx + dz * dz);
          const mouseRipple = Math.sin(Math.max(0, 360 - distToMouse) * 0.022 - time * 2.8) * 30;

          const worldY = wave1 + wave2 + wave3 + (distToMouse < 360 ? mouseRipple : 0) + tiltY;

          // 3D to 2D Perspective Projection
          // Fanning outward horizontally and sweeping downward from mid-screen to bottom
          const screenX = width / 2 + worldX * scale * 1.35;
          const screenY = horizonY + (cameraPitch + worldY) * scale * 1.42;

          // Only render points in reasonable view bounds
          if (screenY < horizonY - 40 || screenY > height + 60 || screenX < -60 || screenX > width + 60) {
            continue;
          }

          // Dot size: larger in foreground (up to 4.2px), tapering back to 1.1px at horizon
          const dotRadius = Math.max(0.9, 4.2 * scale);

          // Depth alpha calculation: foreground dots are solid and vivid, far horizon dots fade softly
          const depthFactor = Math.pow(tZ, 1.3); // 0 at horizon, 1 at bottom
          const depthAlpha = Math.max(0.12, Math.min(0.96, 0.15 + depthFactor * 0.85));

          // Elevation factor: wave peaks glow brighter
          const elevationNorm = Math.max(0, Math.min(1, (worldY + 70) / 140));

          if (isLight) {
            // Light Mode: Azure Blue to Deep Amethyst
            const rCol = Math.round(0 + elevationNorm * 90);
            const gCol = Math.round(112 + elevationNorm * 50);
            const bCol = Math.round(243);
            ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${depthAlpha * 0.82})`;
          } else {
            // Dark Mode: Exact Vanta DOTS amber orange #FF7800 to slate #313131
            const rCol = Math.round(49 + elevationNorm * (255 - 49)); // 49 to 255 (#FF)
            const gCol = Math.round(49 + elevationNorm * (120 - 49)); // 49 to 120 (#78)
            const bCol = Math.round(49 * (1 - elevationNorm));       // 49 to 0
            ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${depthAlpha})`;
          }

          // Render dot
          ctx.beginPath();
          ctx.arc(screenX, screenY, dotRadius, 0, Math.PI * 2);
          ctx.fill();

          // Luminous specular bloom on prominent wave crests in the foreground
          if (scale > 0.42 && elevationNorm > 0.6) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, dotRadius * 2.3, 0, Math.PI * 2);
            if (isLight) {
              ctx.fillStyle = `rgba(0, 112, 243, ${depthAlpha * 0.22})`;
            } else {
              ctx.fillStyle = `rgba(255, 120, 0, ${depthAlpha * 0.32})`;
            }
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={styles.container} aria-hidden="true">
      <canvas ref={canvasRef} style={styles.canvas} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
};

export default LiquidGlassBackground;
