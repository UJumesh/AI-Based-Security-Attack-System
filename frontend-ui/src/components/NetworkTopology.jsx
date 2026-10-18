import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

export function NetworkTopology({ height = 400, recentAttackCount = 0 }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let h = (canvas.height = height);

    // Responsive node coordinates with generous vertical breathing room
    function getNodes(w, ch) {
      // Offset center slightly upward to leave ample room for legend at bottom
      const cy = (ch - 48) / 2;
      return [
        {
          id: 'ingress',
          label: 'Ingress Traffic Gateway',
          sub: 'TCP/IP Flow Intake',
          x: w * 0.12,
          y: cy,
          color: '#2878FF',
          status: 'ACTIVE',
        },
        {
          id: 'extractor',
          label: 'Flow Feature Extractor',
          sub: 'CIC-FlowMeter Parser',
          x: w * 0.32,
          y: cy - 40,
          color: '#06D6E0',
          status: 'PARSING',
        },
        {
          id: 'model',
          label: 'Random Forest AI Engine',
          sub: '100 Decision Trees',
          x: w * 0.53,
          y: cy,
          color: '#06D6E0',
          status: 'OPTIMAL',
          isCore: true,
        },
        {
          id: 'database',
          label: 'PostgreSQL Threat Ledger',
          sub: 'prediction_history',
          x: w * 0.73,
          y: cy + 46,
          color: '#10B981',
          status: 'CONNECTED',
        },
        {
          id: 'workloads',
          label: 'Protected Workloads',
          sub: 'Target Enterprise VPC',
          x: w * 0.88,
          y: cy - 54,
          color: '#10B981',
          status: 'PROTECTED',
        },
        {
          id: 'quarantine',
          label: 'Quarantine & Mitigation',
          sub: 'Sinkhole / Drop Rule',
          x: w * 0.87,
          y: cy + 56,
          color: '#EF4444',
          status: 'ISOLATED',
        },
      ];
    }

    let nodes = getNodes(width, h);

    // Packet particle system
    const particles = [];
    const maxParticles = 38;

    const links = [
      { from: 'ingress', to: 'extractor', isAttackProb: recentAttackCount > 0 ? 0.25 : 0.15 },
      { from: 'extractor', to: 'model', isAttackProb: recentAttackCount > 0 ? 0.3 : 0.18 },
      { from: 'model', to: 'database', isAttackProb: 0.3 },
      { from: 'model', to: 'workloads', isAttackProb: 0.0 }, // benign only
      { from: 'model', to: 'quarantine', isAttackProb: 1.0 }, // attacks only
    ];

    function createParticle() {
      const link = links[Math.floor(Math.random() * links.length)];
      const isAttack = Math.random() < link.isAttackProb;
      return {
        link,
        progress: 0,
        speed: 0.006 + Math.random() * 0.008,
        isAttack,
        size: isAttack ? 3.5 : 2.5,
      };
    }

    for (let i = 0; i < maxParticles; i++) {
      const p = createParticle();
      p.progress = Math.random();
      particles.push(p);
    }

    let angle = 0;

    function render() {
      width = canvas.width = canvas.parentElement?.clientWidth || 700;
      h = canvas.height = height;
      nodes = getNodes(width, h);

      ctx.clearRect(0, 0, width, h);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(40, 120, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 35;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Connection Lines
      links.forEach((link) => {
        const fromNode = nodes.find((n) => n.id === link.from);
        const toNode = nodes.find((n) => n.id === link.to);
        if (!fromNode || !toNode) return;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);

        // Curved bezier
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2 + (fromNode.y < toNode.y ? 15 : -15);
        ctx.quadraticCurveTo(midX, midY, toNode.x, toNode.y);

        const isQuarantine = link.to === 'quarantine';
        ctx.strokeStyle = isQuarantine ? 'rgba(239, 68, 68, 0.25)' : 'rgba(40, 120, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Update and Draw Particles
      if (isPlaying) {
        particles.forEach((p) => {
          p.progress += p.speed;
          if (p.progress >= 1) {
            p.progress = 0;
            p.link = links[Math.floor(Math.random() * links.length)];
            p.isAttack = Math.random() < p.link.isAttackProb;
          }

          const fromNode = nodes.find((n) => n.id === p.link.from);
          const toNode = nodes.find((n) => n.id === p.link.to);
          if (!fromNode || !toNode) return;

          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2 + (fromNode.y < toNode.y ? 15 : -15);

          // Quadratic Bezier interpolation
          const t = p.progress;
          const px = (1 - t) * (1 - t) * fromNode.x + 2 * (1 - t) * t * midX + t * t * toNode.x;
          const py = (1 - t) * (1 - t) * fromNode.y + 2 * (1 - t) * t * midY + t * t * toNode.y;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.isAttack ? '#EF4444' : '#06D6E0';
          ctx.shadowColor = p.isAttack ? '#EF4444' : '#06D6E0';
          ctx.shadowBlur = p.isAttack ? 10 : 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Draw Orbiting Rings around AI Core Node
      const coreNode = nodes.find((n) => n.id === 'model');
      if (coreNode) {
        angle += 0.015;
        ctx.save();
        ctx.translate(coreNode.x, coreNode.y);

        // Inner orbit
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 28, angle, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 214, 224, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Outer orbit
        ctx.beginPath();
        ctx.ellipse(0, 0, 62, 34, -angle * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(40, 120, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      // Draw Nodes
      nodes.forEach((node) => {
        const isCore = node.isCore;
        const radius = isCore ? 34 : 24;

        // Outer glow on hover or active
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}18`;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0B1930';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = isCore ? 2.5 : 1.8;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isCore ? 16 : 8;
        ctx.stroke();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = isCore ? '600 12px "Space Grotesk", sans-serif' : '500 11px Inter, sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + radius + 16);

        // Subtitle
        ctx.font = '400 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(node.sub, node.x, node.y + radius + 28);

        // Status badge
        ctx.font = '600 8px Inter, sans-serif';
        ctx.fillStyle = node.color;
        ctx.fillText(`● ${node.status}`, node.x, node.y - radius - 8);
      });

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    render();

    function handleResize() {
      if (!isPlaying) render();
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [height, isPlaying, recentAttackCount]);

  return (
    <div
      style={{
        position: 'relative',
        background: '#0B1930',
        border: '1px solid rgba(40, 120, 255, 0.2)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(40, 120, 255, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(40, 120, 255, 0.08) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#06D6E0',
              boxShadow: '0 0 10px #06D6E0',
              animation: 'pulseGlow 2s infinite',
            }}
          />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>
              Real-Time Security Architecture Topology
            </h3>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Interactive flow routing: Traffic Ingress → 70-Feature Parser → Random Forest Classifier → Quarantine / Protected VPC
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(6, 214, 224, 0.1)',
              border: '1px solid rgba(6, 214, 224, 0.3)',
              color: '#06D6E0',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ACTIVE SENSORS: 6
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94A3B8',
              borderRadius: '6px',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              transition: 'all 0.15s ease',
            }}
            title={isPlaying ? 'Pause network animation' : 'Play network animation'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            {isPlaying ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

        {/* Dynamic Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            background: 'rgba(7, 16, 32, 0.85)',
            border: '1px solid rgba(40, 120, 255, 0.12)',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '10px',
            color: '#94A3B8',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06D6E0', boxShadow: '0 0 6px #06D6E0' }} />
              Benign Flow Particle
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
              Threat / Attack Particle
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', background: 'rgba(40, 120, 255, 0.5)' }} />
              Full-Duplex Socket Pipeline
            </span>
          </div>

          <span style={{ color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            ENGINE: SKLEARN RANDOM FOREST (100 TREES)
          </span>
        </div>
      </div>
    </div>
  );
}
