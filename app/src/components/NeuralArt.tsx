const LAYERS = [3, 5, 5, 2];
const WIDTH = 720;
const HEIGHT = 420;

function layerX(li: number) {
  return 60 + (li * (WIDTH - 120)) / (LAYERS.length - 1);
}

function nodeY(li: number, ni: number) {
  const n = LAYERS[li];
  const spacing = HEIGHT / (n + 1);
  return spacing * (ni + 1);
}

export default function NeuralArt({ className = "" }: { className?: string }) {
  const edges: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
  for (let li = 0; li < LAYERS.length - 1; li++) {
    for (let a = 0; a < LAYERS[li]; a++) {
      for (let b = 0; b < LAYERS[li + 1]; b++) {
        edges.push({
          x1: layerX(li),
          y1: nodeY(li, a),
          x2: layerX(li + 1),
          y2: nodeY(li + 1, b),
          delay: ((a + b + li * 2) % 7) * 0.6,
        });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {edges.map((e, i) => (
        <line
          key={`base-${i}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="#c7c5f5"
          strokeWidth="1"
          opacity="0.35"
        />
      ))}
      {edges.map((e, i) => (
        <line
          key={`fire-${i}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="#7c6df2"
          strokeWidth="1.5"
          className="synapse-line"
          style={{ animationDelay: `${e.delay}s` }}
        />
      ))}
      {LAYERS.map((n, li) =>
        Array.from({ length: n }).map((_, ni) => (
          <circle
            key={`node-${li}-${ni}`}
            cx={layerX(li)}
            cy={nodeY(li, ni)}
            r={li === LAYERS.length - 1 ? 7 : 5}
            fill={li === LAYERS.length - 1 ? "#5b3df0" : "#ffffff"}
            stroke="#5b3df0"
            strokeWidth="1.5"
          />
        ))
      )}
    </svg>
  );
}
