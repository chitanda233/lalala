export const forceZones = [
  {
    id: "low",
    name: "轻力度",
    min: 0,
    max: 33,
    description: "0–33：在同型同身份内偏向轻力度造型。",
    tags: ["low-force"],
    effects: {},
  },
  {
    id: "medium",
    name: "中等力度",
    min: 34,
    max: 66,
    description: "34–66：在同型同身份内偏向中等力度造型。",
    tags: [],
    effects: {},
  },
  {
    id: "high",
    name: "强力度",
    min: 67,
    max: 100,
    description: "67–100：在同型同身份内偏向强力度造型。",
    tags: ["high-force"],
    effects: {},
  },
];

export const forceCycleMs = 3000;

export function normalizeForce(value) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 50;
}

export function forceZone(value) {
  const force = normalizeForce(value);
  return forceZones.find((zone) => force >= zone.min && force <= zone.max);
}

export function oscillatingForce(elapsed) {
  const phase = (Math.max(0, elapsed) % forceCycleMs) / forceCycleMs;
  return normalizeForce((phase <= 0.5 ? phase * 2 : (1 - phase) * 2) * 100);
}
