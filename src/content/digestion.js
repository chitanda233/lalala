export const digestionOptions = [
  {
    id: "2",
    name: "短时消化",
    label: "2",
    description: "偏湿、残留明显。",
  },
  {
    id: "4",
    name: "适中消化",
    label: "4",
    description: "保留原本干湿。",
  },
  {
    id: "8",
    name: "较久消化",
    label: "8",
    description: "偏干、残留较少。",
  },
  {
    id: "random",
    name: "随机消化",
    label: "随机",
    description: "开始时等概率抽取。",
  },
];
export const fixedDigestionTimes = ["2", "4", "8"];
export const digestionById = Object.fromEntries(
  digestionOptions.map((option) => [option.id, option]),
);
