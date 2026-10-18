export const digestionOptions = [
  {
    id: "2",
    name: "短时消化",
    label: "2",
    description: "记录一次较短的消化过程。",
  },
  {
    id: "4",
    name: "适中消化",
    label: "4",
    description: "记录一次适中的消化过程。",
  },
  {
    id: "8",
    name: "较久消化",
    label: "8",
    description: "记录一次较久的消化过程。",
  },
  {
    id: "random",
    name: "随机消化",
    label: "随机",
    description: "随机记录 2、4、8 中的一档，不改变配方概率。",
  },
];
export const fixedDigestionTimes = ["2", "4", "8"];
export const digestionById = Object.fromEntries(
  digestionOptions.map((option) => [option.id, option]),
);
