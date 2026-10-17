export const digestionOptions = [
  {
    id: "2",
    name: "短时消化",
    label: "2",
    description: "停留较短，偏向柔软、松散的形态。",
    typeShift: 1,
  },
  {
    id: "4",
    name: "适中消化",
    label: "4",
    description: "按食物和饮水的原本倾向自然成形。",
    typeShift: 0,
  },
  {
    id: "8",
    name: "较久消化",
    label: "8",
    description: "停留较久，偏向紧实、偏硬的形态。",
    typeShift: -1,
  },
  {
    id: "random",
    name: "随机消化",
    label: "随机",
    description: "从 2、4、8 三个档位中等概率决定。",
  },
];
export const fixedDigestionTimes = ["2", "4", "8"];
export const digestionById = Object.fromEntries(
  digestionOptions.map((option) => [option.id, option]),
);
