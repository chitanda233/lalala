export const forceZones = [
  {
    id: "low",
    name: "轻力度",
    min: 0,
    max: 33,
    description: "轻轻用力，形态更稳定，有机会形成完整螺旋。",
    tags: ["low-force"],
    effects: { smoothnessBonus: 0.5, formationStability: 0.08 },
  },
  {
    id: "medium",
    name: "中等力度",
    min: 34,
    max: 66,
    description: "自然用力，按餐盘的形态倾向发挥。",
    tags: [],
    effects: {},
  },
  {
    id: "high",
    name: "强力度",
    min: 67,
    max: 100,
    description: "用力加速，偏软时更容易出现喷射造型。",
    tags: ["high-force"],
    effects: { typeShift: 0.6 },
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
