// 玩家实际个体 #025–#042，保留当时力度与添加剂；历史结果仅供排查，不覆盖收藏。
const rows = [
  [25,50,"gold-leaf","soft-pillows"],[26,13,"gold-leaf","soft-pillows"],[27,51,"gold-leaf","purple-berry"],[28,87,"gold-leaf","corn-pebbles"],
  [29,21,"flower-petal","soft-pillows"],[30,49,"flower-petal","coffee"],[31,80,"flower-petal","soft-pillows"],[32,27,"flower-petal","purple-berry"],[33,35,"flower-petal","milk-white"],
  [34,14,"probiotic","coffee"],[35,24,"probiotic","milk-white"],[36,23,"probiotic","soft-pillows"],[37,21,"probiotic","milk-white"],
  [38,23,"probiotic","soft-pillows"],[39,20,"probiotic","soft-pillows"],[40,22,"probiotic","soft-pillows"],[41,39,"probiotic","coffee"],[42,88,"probiotic","purple-berry"],
];
export const recentMeals = rows.map(([sequence,force,additive,historicalResult]) => ({ sequence,historicalResult,
  selection:{foodIds:["rice","pumpkin"],drinkId:"grass-jelly",water:1250,digestionTime:"2",force,additives:[additive],toiletId:"heated"},
}));
