import React, { useRef, useEffect } from 'react';

interface ThreeDQbitProps {
  scrollY: number;
  mousePos: { x: number; y: number };
}

export const ThreeDQbit: React.FC<ThreeDQbitProps> = ({ scrollY, mousePos }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Track rotation angles with easing (lerp)
  const rotationRef = useRef({ rx: 0.3, ry: 0.5, rz: 0 });
  const timeRef = useRef(0);
  const historyRef = useRef<{ x: number; y: number; z: number }[]>([]);

  const stateRef = useRef({ scrollY, mousePos });

  // Update mutable ref whenever props change, without triggering effect stutters
  useEffect(() => {
    stateRef.current = { scrollY, mousePos };
  }, [scrollY, mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Resize handler for high-DPI displays
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
      const R = Math.min(width, height) * 0.28; // Sphere radius

      timeRef.current += 0.015;
      const t = timeRef.current;

      // Retrieve latest scroll and mouse states from ref
      const currentScrollY = stateRef.current.scrollY;
      const currentMousePos = stateRef.current.mousePos;

      // target rotations: continuous slow rotation + mouse tilt + scroll influence
      const targetRx = currentMousePos.y * -0.6 + (currentScrollY * 0.0008) + 0.3 + Math.sin(t * 0.1) * 0.08;
      const targetRy = currentMousePos.x * 0.6 + (currentScrollY * 0.0015) + t * 0.12;
      
      // Lerp easing for ultra smooth response
      rotationRef.current.rx += (targetRx - rotationRef.current.rx) * 0.06;
      rotationRef.current.ry += (targetRy - rotationRef.current.ry) * 0.06;
      
      const rx = rotationRef.current.rx;
      const ry = rotationRef.current.ry;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      // Project 3D points to 2D screen coordinates
      const project = (p: Point3D) => {
        // Rotate around Y axis
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;

        // Rotate around X axis
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective camera
        const D = 450;
        const scaleFactor = D / (D + z2);
        
        return {
          x: centerX + x1 * scaleFactor,
          y: centerY + y2 * scaleFactor,
          z: z2 // z2 is depth (positive is away, negative is towards viewer)
        };
      };

      // Draw line segment with depth cue (front vs back of the sphere)
      const draw3DLine = (p1: Point3D, p2: Point3D, colorFront: string, colorBack: string, widthFront: number = 1.5, isDashed: boolean = false) => {
        const pr1 = project(p1);
        const pr2 = project(p2);
        
        const avgZ = (pr1.z + pr2.z) / 2;
        
        ctx.beginPath();
        ctx.moveTo(pr1.x, pr1.y);
        ctx.lineTo(pr2.x, pr2.y);
        
        if (avgZ > 0) {
          // Point is in the back hemisphere: draw thin, dashed, low-opacity
          ctx.strokeStyle = colorBack;
          ctx.lineWidth = widthFront * 0.45;
          ctx.setLineDash([3, 4]);
        } else {
          // Point is in the front hemisphere: draw thick, solid, glowing
          ctx.strokeStyle = colorFront;
          ctx.lineWidth = widthFront;
          ctx.setLineDash(isDashed ? [3, 4] : []);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // 1. Draw Bloch axes: Z (vertical), X, Y
      const axisLen = R * 1.25;
      const origin = { x: 0, y: 0, z: 0 };
      const ptZ_top = { x: 0, y: -axisLen, z: 0 };
      const ptZ_bot = { x: 0, y: axisLen, z: 0 };
      const ptX_left = { x: -axisLen, y: 0, z: 0 };
      const ptX_right = { x: axisLen, y: 0, z: 0 };
      const ptY_back = { x: 0, y: 0, z: -axisLen };
      const ptY_front = { x: 0, y: 0, z: axisLen };

      // Render axes lines
      draw3DLine(ptX_left, ptX_right, 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)', 1, true);
      draw3DLine(ptY_back, ptY_front, 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)', 1, true);
      draw3DLine(ptZ_top, ptZ_bot, 'rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.18)', 1.5, true);

      // 2. Draw Sphere Surface wireframe rings
      const steps = 64;
      
      // Equator (XY horizontal ring)
      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2;
        const a2 = ((i + 1) / steps) * Math.PI * 2;
        const p1 = { x: R * Math.cos(a1), y: 0, z: R * Math.sin(a1) };
        const p2 = { x: R * Math.cos(a2), y: 0, z: R * Math.sin(a2) };
        draw3DLine(p1, p2, 'rgba(0, 242, 254, 0.45)', 'rgba(0, 242, 254, 0.12)', 1.2);
      }

      // Prime Meridian (XZ vertical ring)
      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2;
        const a2 = ((i + 1) / steps) * Math.PI * 2;
        const p1 = { x: R * Math.cos(a1), y: R * Math.sin(a1), z: 0 };
        const p2 = { x: R * Math.cos(a2), y: R * Math.sin(a2), z: 0 };
        draw3DLine(p1, p2, 'rgba(157, 78, 221, 0.35)', 'rgba(157, 78, 221, 0.1)', 1);
      }

      // Y-Meridian (YZ vertical ring)
      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2;
        const a2 = ((i + 1) / steps) * Math.PI * 2;
        const p1 = { x: 0, y: R * Math.sin(a1), z: R * Math.cos(a1) };
        const p2 = { x: 0, y: R * Math.sin(a2), z: R * Math.cos(a2) };
        draw3DLine(p1, p2, 'rgba(157, 78, 221, 0.35)', 'rgba(157, 78, 221, 0.1)', 1);
      }

      // 3. Draw labels at axes tips
      const drawLabel = (pt: Point3D, text: string, color: string) => {
        const pr = project(pt);
        if (pr.z > 80) return; // Skip label if deep in the background
        
        ctx.fillStyle = color;
        ctx.font = 'bold 11px "Outfit", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add subtle shadow for visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(text, pr.x, pr.y);
        ctx.shadowBlur = 0;
      };

      drawLabel({ x: 0, y: -axisLen - 12, z: 0 }, '|0⟩', 'var(--primary)');
      drawLabel({ x: 0, y: axisLen + 12, z: 0 }, '|1⟩', 'var(--secondary)');
      drawLabel({ x: axisLen + 12, y: 0, z: 0 }, '|+⟩', '#ffffff');
      drawLabel({ x: -axisLen - 12, y: 0, z: 0 }, '|−⟩', '#ffffff');

      // 4. Calculate precessing Quantum state vector |Ψ⟩
      const theta = Math.PI / 3 + 0.28 * Math.sin(t * 0.85); // Oscillation between poles
      const phi = t * 0.45;                                 // Azimuthal phase precession
      
      const vx = R * Math.sin(theta) * Math.cos(phi);
      const vz = R * Math.sin(theta) * Math.sin(phi);
      const vy = -R * Math.cos(theta); // Map physics vertical Z-up to screen Y-up (negate)
      
      const stateVector = { x: vx, y: vy, z: vz };
      
      // Save coordinate history for trace line
      historyRef.current.push(stateVector);
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
      }

      // Render vector path trace on surface
      if (historyRef.current.length > 1) {
        for (let i = 0; i < historyRef.current.length - 1; i++) {
          const ratio = i / historyRef.current.length;
          const colFront = `rgba(0, 242, 254, ${ratio * 0.65})`;
          const colBack = `rgba(0, 242, 254, ${ratio * 0.12})`;
          draw3DLine(historyRef.current[i], historyRef.current[i+1], colFront, colBack, 1.8);
        }
      }

      // Draw the main state vector
      const prVec = project(stateVector);
      const prOrigin = project(origin);
      
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(0, 242, 254, 0.7)';
      
      ctx.beginPath();
      ctx.moveTo(prOrigin.x, prOrigin.y);
      ctx.lineTo(prVec.x, prVec.y);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.95)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.shadowBlur = 0;

      // Draw glowing state node
      ctx.beginPath();
      ctx.arc(prVec.x, prVec.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'var(--primary)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'var(--primary)';
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw state label
      drawLabel({ x: vx * 1.16, y: vy * 1.16, z: vz * 1.16 }, '|Ψ⟩', '#ffffff');

      // 5. Draw concentric Quantum rings and Quanta nodes
      const ringSteps = 80;
      const ringRadius = R * 1.45;
      
      // Orbit Ring 1 (tilted around X)
      for (let i = 0; i < ringSteps; i++) {
        const a1 = (i / ringSteps) * Math.PI * 2;
        const a2 = ((i + 1) / ringSteps) * Math.PI * 2;
        const p1 = {
          x: ringRadius * Math.cos(a1),
          y: ringRadius * Math.sin(a1) * Math.cos(Math.PI/6),
          z: ringRadius * Math.sin(a1) * Math.sin(Math.PI/6)
        };
        const p2 = {
          x: ringRadius * Math.cos(a2),
          y: ringRadius * Math.sin(a2) * Math.cos(Math.PI/6),
          z: ringRadius * Math.sin(a2) * Math.sin(Math.PI/6)
        };
        draw3DLine(p1, p2, 'rgba(157, 78, 221, 0.22)', 'rgba(157, 78, 221, 0.06)', 1);
      }

      // Orbit Quanta 1 node
      const angle1 = t * 0.7;
      const quanta1 = {
        x: ringRadius * Math.cos(angle1),
        y: ringRadius * Math.sin(angle1) * Math.cos(Math.PI/6),
        z: ringRadius * Math.sin(angle1) * Math.sin(Math.PI/6)
      };
      const prQuanta1 = project(quanta1);
      if (prQuanta1.z <= 0) {
        ctx.beginPath();
        ctx.arc(prQuanta1.x, prQuanta1.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--secondary)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'var(--secondary)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Orbit Ring 2 (tilted around Y)
      for (let i = 0; i < ringSteps; i++) {
        const a1 = (i / ringSteps) * Math.PI * 2;
        const a2 = ((i + 1) / ringSteps) * Math.PI * 2;
        const p1 = {
          x: ringRadius * Math.sin(a1) * Math.sin(-Math.PI/5),
          y: ringRadius * Math.cos(a1),
          z: ringRadius * Math.sin(a1) * Math.cos(-Math.PI/5)
        };
        const p2 = {
          x: ringRadius * Math.sin(a2) * Math.sin(-Math.PI/5),
          y: ringRadius * Math.cos(a2),
          z: ringRadius * Math.sin(a2) * Math.cos(-Math.PI/5)
        };
        draw3DLine(p1, p2, 'rgba(0, 242, 254, 0.2)', 'rgba(0, 242, 254, 0.05)', 1);
      }

      // Orbit Quanta 2 node
      const angle2 = -t * 0.95;
      const quanta2 = {
        x: ringRadius * Math.sin(angle2) * Math.sin(-Math.PI/5),
        y: ringRadius * Math.cos(angle2),
        z: ringRadius * Math.sin(angle2) * Math.cos(-Math.PI/5)
      };
      const prQuanta2 = project(quanta2);
      if (prQuanta2.z <= 0) {
        ctx.beginPath();
        ctx.arc(prQuanta2.x, prQuanta2.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--primary)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'var(--primary)';
        ctx.fill();
        ctx.shadowBlur = 0;
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
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block' 
      }} 
    />
  );
};
