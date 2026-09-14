import React, { useRef, useEffect, useState } from 'react';

interface ThreeDQbitProps {
  scrollY: number;
  mousePos: { x: number; y: number };
}

export const ThreeDQbit: React.FC<ThreeDQbitProps> = ({ scrollY, mousePos }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rotation angles with easing (lerp)
  const rotationRef = useRef({ rx: 0.35, ry: 0.5, rz: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const timeRef = useRef(0);
  const historyRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const rippleWavesRef = useRef<{ radius: number; maxRadius: number; opacity: number }[]>([]);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const stateRef = useRef({ scrollY, mousePos });

  useEffect(() => {
    stateRef.current = { scrollY, mousePos };
  }, [scrollY, mousePos]);

  // Click excitation handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    // Angular impulse on click
    velocityRef.current.vx += (Math.random() - 0.5) * 0.35;
    velocityRef.current.vy += (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.2);

    // Spawn quantum excitation ripple ring
    rippleWavesRef.current.push({
      radius: 10,
      maxRadius: 180,
      opacity: 0.8
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    velocityRef.current.vy += dx * 0.005;
    velocityRef.current.vx -= dy * 0.005;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface Point3D {
      x: number;
      y: number;
      z: number;
    }

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const R = Math.min(width, height) * 0.28;

      timeRef.current += 0.015;
      const t = timeRef.current;

      const currentScrollY = stateRef.current.scrollY;
      const currentMousePos = stateRef.current.mousePos;

      // Base target rotation from mouse tilt and scroll
      const targetRx = currentMousePos.y * -0.5 + (currentScrollY * 0.0006) + 0.3 + Math.sin(t * 0.1) * 0.06;
      const targetRy = currentMousePos.x * 0.5 + (currentScrollY * 0.0012) + t * 0.1;

      // Inertial damping on velocity
      velocityRef.current.vx *= 0.93;
      velocityRef.current.vy *= 0.93;

      // Update rotation
      rotationRef.current.rx += (targetRx - rotationRef.current.rx) * 0.05 + velocityRef.current.vx;
      rotationRef.current.ry += (targetRy - rotationRef.current.ry) * 0.05 + velocityRef.current.vy;

      const rx = rotationRef.current.rx;
      const ry = rotationRef.current.ry;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      // Project 3D points
      const project = (p: Point3D) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;

        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const D = 450;
        const scaleFactor = D / (D + z2);

        return {
          x: centerX + x1 * scaleFactor,
          y: centerY + y2 * scaleFactor,
          z: z2
        };
      };

      // Draw 3D Line with depth cue in soothing faded colors
      const draw3DLine = (
        p1: Point3D,
        p2: Point3D,
        colorFront: string,
        colorBack: string,
        widthFront: number = 1.4,
        isDashed: boolean = false
      ) => {
        const pr1 = project(p1);
        const pr2 = project(p2);
        const avgZ = (pr1.z + pr2.z) / 2;

        ctx.beginPath();
        ctx.moveTo(pr1.x, pr1.y);
        ctx.lineTo(pr2.x, pr2.y);

        if (avgZ > 0) {
          ctx.strokeStyle = colorBack;
          ctx.lineWidth = widthFront * 0.5;
          ctx.setLineDash([3, 4]);
        } else {
          ctx.strokeStyle = colorFront;
          ctx.lineWidth = widthFront;
          ctx.setLineDash(isDashed ? [3, 4] : []);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      };

      // 1. Draw Bloch axes in eye-friendly soft graphite
      const axisLen = R * 1.25;
      const origin = { x: 0, y: 0, z: 0 };
      const ptZ_top = { x: 0, y: -axisLen, z: 0 };
      const ptZ_bot = { x: 0, y: axisLen, z: 0 };
      const ptX_left = { x: -axisLen, y: 0, z: 0 };
      const ptX_right = { x: axisLen, y: 0, z: 0 };
      const ptY_back = { x: 0, y: 0, z: -axisLen };
      const ptY_front = { x: 0, y: 0, z: axisLen };

      draw3DLine(ptX_left, ptX_right, 'rgba(100, 116, 139, 0.45)', 'rgba(148, 163, 184, 0.18)', 1, true);
      draw3DLine(ptY_back, ptY_front, 'rgba(100, 116, 139, 0.45)', 'rgba(148, 163, 184, 0.18)', 1, true);
      draw3DLine(ptZ_top, ptZ_bot, 'rgba(71, 85, 105, 0.7)', 'rgba(148, 163, 184, 0.25)', 1.5, true);

      // 2. Wireframe Rings in Faded Ocean Teal & Soft Iris
      const steps = 64;

      // Equator (XY horizontal ring)
      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2;
        const a2 = ((i + 1) / steps) * Math.PI * 2;
        const p1 = { x: R * Math.cos(a1), y: 0, z: R * Math.sin(a1) };
        const p2 = { x: R * Math.cos(a2), y: 0, z: R * Math.sin(a2) };
        draw3DLine(p1, p2, 'rgba(43, 122, 143, 0.55)', 'rgba(43, 122, 143, 0.15)', 1.2);
      }

      // Prime Meridian (XZ vertical ring)
      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2;
        const a2 = ((i + 1) / steps) * Math.PI * 2;
        const p1 = { x: R * Math.cos(a1), y: R * Math.sin(a1), z: 0 };
        const p2 = { x: R * Math.cos(a2), y: R * Math.sin(a2), z: 0 };
        draw3DLine(p1, p2, 'rgba(99, 102, 241, 0.45)', 'rgba(99, 102, 241, 0.12)', 1);
      }

      // Y-Meridian (YZ vertical ring)
      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2;
        const a2 = ((i + 1) / steps) * Math.PI * 2;
        const p1 = { x: 0, y: R * Math.sin(a1), z: R * Math.cos(a1) };
        const p2 = { x: 0, y: R * Math.sin(a2), z: R * Math.cos(a2) };
        draw3DLine(p1, p2, 'rgba(99, 102, 241, 0.45)', 'rgba(99, 102, 241, 0.12)', 1);
      }

      // 3. Draw Axis Tip Labels in High-Contrast Slate
      const drawLabel = (pt: Point3D, text: string, color: string) => {
        const pr = project(pt);
        if (pr.z > 80) return;

        ctx.fillStyle = color;
        ctx.font = 'bold 12px "Outfit", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pr.x, pr.y);
      };

      drawLabel({ x: 0, y: -axisLen - 12, z: 0 }, '|0⟩', '#2b7a8f');
      drawLabel({ x: 0, y: axisLen + 12, z: 0 }, '|1⟩', '#6366f1');
      drawLabel({ x: axisLen + 12, y: 0, z: 0 }, '|+⟩', '#334155');
      drawLabel({ x: -axisLen - 12, y: 0, z: 0 }, '|−⟩', '#334155');

      // 4. Precessing Quantum State Vector |Ψ⟩
      const theta = Math.PI / 3 + 0.25 * Math.sin(t * 0.85);
      const phi = t * 0.45;

      const vx = R * Math.sin(theta) * Math.cos(phi);
      const vz = R * Math.sin(theta) * Math.sin(phi);
      const vy = -R * Math.cos(theta);

      const stateVector = { x: vx, y: vy, z: vz };

      historyRef.current.push(stateVector);
      if (historyRef.current.length > 45) {
        historyRef.current.shift();
      }

      // Trace line in soft faded cyan
      if (historyRef.current.length > 1) {
        for (let i = 0; i < historyRef.current.length - 1; i++) {
          const ratio = i / historyRef.current.length;
          const colFront = `rgba(56, 189, 248, ${ratio * 0.6})`;
          const colBack = `rgba(56, 189, 248, ${ratio * 0.12})`;
          draw3DLine(historyRef.current[i], historyRef.current[i + 1], colFront, colBack, 1.8);
        }
      }

      // Draw state vector arrow
      const prVec = project(stateVector);
      const prOrigin = project(origin);

      ctx.beginPath();
      ctx.moveTo(prOrigin.x, prOrigin.y);
      ctx.lineTo(prVec.x, prVec.y);
      ctx.strokeStyle = '#2b7a8f';
      ctx.lineWidth = 3;
      ctx.stroke();

      // State node
      ctx.beginPath();
      ctx.arc(prVec.x, prVec.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2b7a8f';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      drawLabel({ x: vx * 1.16, y: vy * 1.16, z: vz * 1.16 }, '|Ψ⟩', '#0f172a');

      // 5. Orbital Quantum Rings
      const ringSteps = 70;
      const ringRadius = R * 1.45;

      for (let i = 0; i < ringSteps; i++) {
        const a1 = (i / ringSteps) * Math.PI * 2;
        const a2 = ((i + 1) / ringSteps) * Math.PI * 2;
        const p1 = {
          x: ringRadius * Math.cos(a1),
          y: ringRadius * Math.sin(a1) * Math.cos(Math.PI / 6),
          z: ringRadius * Math.sin(a1) * Math.sin(Math.PI / 6)
        };
        const p2 = {
          x: ringRadius * Math.cos(a2),
          y: ringRadius * Math.sin(a2) * Math.cos(Math.PI / 6),
          z: ringRadius * Math.sin(a2) * Math.sin(Math.PI / 6)
        };
        draw3DLine(p1, p2, 'rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.06)', 1);
      }

      // Orbit Quanta Node 1
      const angle1 = t * 0.7;
      const quanta1 = {
        x: ringRadius * Math.cos(angle1),
        y: ringRadius * Math.sin(angle1) * Math.cos(Math.PI / 6),
        z: ringRadius * Math.sin(angle1) * Math.sin(Math.PI / 6)
      };
      const prQuanta1 = project(quanta1);
      if (prQuanta1.z <= 0) {
        ctx.beginPath();
        ctx.arc(prQuanta1.x, prQuanta1.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#818cf8';
        ctx.fill();
      }

      // Orbit Ring 2
      for (let i = 0; i < ringSteps; i++) {
        const a1 = (i / ringSteps) * Math.PI * 2;
        const a2 = ((i + 1) / ringSteps) * Math.PI * 2;
        const p1 = {
          x: ringRadius * Math.sin(a1) * Math.sin(-Math.PI / 5),
          y: ringRadius * Math.cos(a1),
          z: ringRadius * Math.sin(a1) * Math.cos(-Math.PI / 5)
        };
        const p2 = {
          x: ringRadius * Math.sin(a2) * Math.sin(-Math.PI / 5),
          y: ringRadius * Math.cos(a2),
          z: ringRadius * Math.sin(a2) * Math.cos(-Math.PI / 5)
        };
        draw3DLine(p1, p2, 'rgba(43, 122, 143, 0.25)', 'rgba(43, 122, 143, 0.06)', 1);
      }

      // Orbit Quanta Node 2
      const angle2 = -t * 0.95;
      const quanta2 = {
        x: ringRadius * Math.sin(angle2) * Math.sin(-Math.PI / 5),
        y: ringRadius * Math.cos(angle2),
        z: ringRadius * Math.sin(angle2) * Math.cos(-Math.PI / 5)
      };
      const prQuanta2 = project(quanta2);
      if (prQuanta2.z <= 0) {
        ctx.beginPath();
        ctx.arc(prQuanta2.x, prQuanta2.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }

      // 6. Excitation Ripple Rings from Clicks
      for (let i = rippleWavesRef.current.length - 1; i >= 0; i--) {
        const wave = rippleWavesRef.current[i];
        wave.radius += 3.5;
        wave.opacity *= 0.94;

        if (wave.opacity <= 0.02 || wave.radius >= wave.maxRadius) {
          rippleWavesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${wave.opacity})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: isDraggingRef.current ? 'grabbing' : 'grab'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        isDraggingRef.current = false;
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '3px 10px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            opacity: 0.85
          }}
        >
          Drag to rotate • Click to excite state
        </div>
      )}
    </div>
  );
};

export default ThreeDQbit;
