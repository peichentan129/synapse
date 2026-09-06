const WIDTH = 640;
const HEIGHT = 640;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

const RINGS = [
  { count: 1, radius: 0 },
  { count: 6, radius: 70 },
  { count: 12, radius: 148 },
  { count: 18, radius: 232 },
];

function ringNodes(ringIndex: number) {
  const { count, radius } = RINGS[ringIndex];
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: CX + Math.cos(angle) * radius,
      y: CY + Math.sin(angle) * radius,
      angle,
    };
  });
}

function nearestIndex(angle: number, nodes: { angle: number }[]) {
  let best = 0;
  let bestDelta = Infinity;
  nodes.forEach((n, i) => {
    let d = Math.abs(n.angle - angle);
    if (d > Math.PI) d = Math.PI * 2 - d;
    if (d < bestDelta) {
      bestDelta = d;
      best = i;
    }
  });
  return best;
}

export default function NousArt({ className = "" }: { className?: string }) {
  const rings = RINGS.map((_, i) => ringNodes(i));

  const edges: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
  for (let r = 0; r < rings.length - 1; r++) {
    const inner = rings[r];
    const outer = rings[r + 1];
    outer.forEach((node, oi) => {
      const ii = nearestIndex(node.angle, inner);
      const from = inner[ii];
      edges.push({ x1: from.x, y1: from.y, x2: node.x, y2: node.y, delay: ((oi + r * 3) % 9) * 0.5 });
    });
  }
  // ring-to-ring lateral connections on the outermost two rings for density
  rings[3].forEach((node, i) => {
    const next = rings[3][(i + 1) % rings[3].length];
    edges.push({ x1: node.x, y1: node.y, x2: next.x, y2: next.y, delay: ((i * 2) % 11) * 0.4 });
  });

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nous-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d8b878" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d8b878" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={260} fill="url(#nous-glow)" />

      {edges.map((e, i) => (
        <line key={`base-${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#3a3730" strokeWidth="1" opacity="0.5" />
      ))}
      {edges.map((e, i) => (
        <line
          key={`fire-${i}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="#d8b878"
          strokeWidth="1.1"
          className="nous-line"
          style={{ animationDelay: `${e.delay}s` }}
        />
      ))}

      {rings.map((nodes, r) =>
        nodes.map((n, i) => (
          <circle
            key={`node-${r}-${i}`}
            cx={n.x}
            cy={n.y}
            r={r === 0 ? 8 : Math.max(2.5, 5 - r)}
            fill={r === 0 ? "#d8b878" : "#0f0e0c"}
            stroke="#d8b878"
            strokeWidth={r === 0 ? 0 : 1.2}
          />
        ))
      )}
    </svg>
  );
}
