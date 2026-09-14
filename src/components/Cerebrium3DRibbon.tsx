import React, { useRef, useEffect } from 'react';

interface Cerebrium3DRibbonProps {
  scrollY: number;
  mousePos: { x: number; y: number };
}

export const Cerebrium3DRibbon: React.FC<Cerebrium3DRibbonProps> = ({ scrollY, mousePos }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ scrollY, mousePos });
  const rotRef = useRef({ rx: 0.25, ry: 0.35, rz: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    stateRef.current = { scrollY, mousePos };
  }, [scrollY, mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const width = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
      const height = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
      ctx.clearRect(0, 0, width, height);

      timeRef.current += 0.012;
      const t = timeRef.current;

      const { mousePos: m, scrollY: s } = stateRef.current;

      // Target rotations with mouse tilt + scroll interaction
      const targetRx = m.y * -0.5 + (s * 0.0004) + 0.25;
      const targetRy = m.x * 0.5 + (s * 0.0008) + t * 0.15;

      rotRef.current.rx += (targetRx - rotRef.current.rx) * 0.05;
      rotRef.current.ry += (targetRy - rotRef.current.ry) * 0.05;

      const rx = rotRef.current.rx;
      const ry = rotRef.current.ry;

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.42;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      const project = (x: number, y: number, z: number) => {
        // Rotate around Y
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // Rotate around X
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const d = 420;
        const f = d / (d + z2);
        return {
          px: cx + x1 * f,
          py: cy + y2 * f,
          pz: z2
        };
      };

      // 1. Draw glowing background aura in Cerebrium magenta
      const auraGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, scale * 1.2);
      auraGrad.addColorStop(0, 'rgba(255, 46, 147, 0.18)');
      auraGrad.addColorStop(0.5, 'rgba(139, 30, 90, 0.08)');
      auraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw 3D Parametric Torus Knot Ribbon (Cerebrium signature dimensional loop)
      const segments = 160;
      const ribbonWidth = 24;

      interface RibbonPoint {
        left: { px: number; py: number; pz: number };
        right: { px: number; py: number; pz: number };
        center: { px: number; py: number; pz: number };
        progress: number;
      }

      const points: RibbonPoint[] = [];

      for (let i = 0; i <= segments; i++) {
        const u = (i / segments) * Math.PI * 4 + t * 0.35;
        // Torus knot formula p=2, q=3
        const r = 0.5 + 0.28 * Math.cos(1.5 * u);
        const bx = r * Math.cos(u) * scale;
        const by = r * Math.sin(u) * scale * 0.85;
        const bz = -0.32 * Math.sin(1.5 * u) * scale;

        // Tangent vector
        const du = 0.01;
        const rNext = 0.5 + 0.28 * Math.cos(1.5 * (u + du));
        const nx = (rNext * Math.cos(u + du) * scale) - bx;
        const ny = (rNext * Math.sin(u + du) * scale * 0.85) - by;
        const nz = (-0.32 * Math.sin(1.5 * (u + du)) * scale) - bz;

        // Normal/Binormal offset for ribbon strip width
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const ox = (-ny / len) * ribbonWidth;
        const oy = (nx / len) * ribbonWidth;
        const oz = 0;

        points.push({
          left: project(bx - ox, by - oy, bz - oz),
          right: project(bx + ox, by + oy, bz + oz),
          center: project(bx, by, bz),
          progress: i / segments
        });
      }

      // Sort ribbon segments by depth (painters algorithm)
      interface RibbonQuad {
        p1: { px: number; py: number };
        p2: { px: number; py: number };
        p3: { px: number; py: number };
        p4: { px: number; py: number };
        z: number;
        progress: number;
      }

      const quads: RibbonQuad[] = [];

      for (let i = 0; i < points.length - 1; i++) {
        const cur = points[i];
        const next = points[i + 1];
        const avgZ = (cur.center.pz + next.center.pz) / 2;

        quads.push({
          p1: cur.left,
          p2: cur.right,
          p3: next.right,
          p4: next.left,
          z: avgZ,
          progress: cur.progress
        });
      }

      quads.sort((a, b) => b.z - a.z); // Render furthest first

      quads.forEach((q) => {
        const depthAlpha = Math.max(0.2, Math.min(1, 1 - q.z / (scale * 2)));
        
        ctx.beginPath();
        ctx.moveTo(q.p1.px, q.p1.py);
        ctx.lineTo(q.p2.px, q.p2.py);
        ctx.lineTo(q.p3.px, q.p3.py);
        ctx.lineTo(q.p4.px, q.p4.py);
        ctx.closePath();

        // Cerebrium color blend: plum (#3D0B26) -> magenta (#FF2E93) -> rose white (#FFEBF4)
        const ribbonGrad = ctx.createLinearGradient(q.p1.px, q.p1.py, q.p3.px, q.p3.py);
        const huePhase = (q.progress + t * 0.1) % 1;

        if (huePhase < 0.5) {
          ribbonGrad.addColorStop(0, `rgba(139, 30, 90, ${depthAlpha * 0.85})`);
          ribbonGrad.addColorStop(1, `rgba(255, 46, 147, ${depthAlpha})`);
        } else {
          ribbonGrad.addColorStop(0, `rgba(255, 46, 147, ${depthAlpha})`);
          ribbonGrad.addColorStop(1, `rgba(255, 170, 215, ${depthAlpha * 0.9})`);
        }

        ctx.fillStyle = ribbonGrad;
        ctx.fill();

        // Subtle glowing wire edge
        ctx.strokeStyle = `rgba(255, 180, 225, ${depthAlpha * 0.35})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // 3. Central Glowing Quantum Core Sphere (Cerebrium crystal node)
      const coreZ = 0;
      const prCore = project(0, 0, coreZ);
      const sphereRadius = scale * 0.18;

      const sphereGrad = ctx.createRadialGradient(
        prCore.px - sphereRadius * 0.35,
        prCore.py - sphereRadius * 0.35,
        sphereRadius * 0.05,
        prCore.px,
        prCore.py,
        sphereRadius
      );
      sphereGrad.addColorStop(0, '#FFFFFF');
      sphereGrad.addColorStop(0.35, '#FF488B');
      sphereGrad.addColorStop(0.8, '#8B1E5A');
      sphereGrad.addColorStop(1, '#1A0612');

      ctx.save();
      ctx.beginPath();
      ctx.arc(prCore.px, prCore.py, sphereRadius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.shadowColor = '#FF2E93';
      ctx.shadowBlur = 35;
      ctx.fill();
      ctx.restore();

      // Specular highlight crescent
      ctx.beginPath();
      ctx.arc(prCore.px - sphereRadius * 0.25, prCore.py - sphereRadius * 0.25, sphereRadius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      // Orbital particles around the sphere
      for (let i = 0; i < 6; i++) {
        const pAngle = t * 1.5 + (i * Math.PI) / 3;
        const pOrbitR = sphereRadius * 1.85;
        const px = Math.cos(pAngle) * pOrbitR;
        const py = Math.sin(pAngle) * pOrbitR * 0.4;
        const pz = Math.sin(pAngle) * pOrbitR;

        const prP = project(px, py, pz);
        if (prP.pz < 0) {
          ctx.beginPath();
          ctx.arc(prP.px, prP.py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FF2E93';
          ctx.shadowColor = '#FF2E93';
          ctx.shadowBlur = 10;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none'
      }}
    />
  );
};

export default Cerebrium3DRibbon;
