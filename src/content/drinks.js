// 饮料只定义物态、颜色和顺畅效果；固定配方另在 stool-recipes.js 维护。
export const drinks = [
  {
    "id": "water",
    "name": "清水",
    "category": "补水基准",
    "color": "#a8d2cf",
    "description": "补水打底，保留餐盘原本的形态与颜色倾向。",
    "effectLabel": "软硬 4；保留餐盘底色",
    "tags": [],
    "hardness": 4,
    "porosity": 0,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "coffee",
    "name": "一杯咖啡",
    "category": "肠道促动",
    "color": "#94735c",
    "description": "给肠道按一下出场铃，咖啡色也跟着报到。",
    "effectLabel": "软硬 2；咖啡色",
    "tags": [
      "coffee"
    ],
    "hardness": 2,
    "porosity": 0,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "coffee",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "prune-juice",
    "name": "西梅汁",
    "category": "软化干硬",
    "color": "#8c6b88",
    "description": "干硬路线的软化选手，还会留下深紫色的签名。",
    "effectLabel": "软硬 1；莓紫色；顺畅 +0.3",
    "tags": [
      "prune",
      "berry-pigment"
    ],
    "hardness": 1,
    "porosity": 0,
    "effects": {
      "smoothnessBonus": 0.3
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "milk",
    "name": "鲜牛奶",
    "category": "乳糖反应",
    "color": "#e5e2cb",
    "description": "有些肚子对乳糖很敏感，喝完可能咕噜闹腾。",
    "effectLabel": "软硬 3；奶白色",
    "tags": [
      "milk",
      "lactose"
    ],
    "hardness": 3,
    "porosity": 0,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "soda",
    "name": "气泡水",
    "category": "气泡胀气",
    "color": "#b0cdd0",
    "description": "咕噜冒泡，给配方添点气孔，不额外推高稀软。",
    "effectLabel": "软硬 3；蓬松 +1；保留餐盘底色",
    "tags": [
      "bubbles"
    ],
    "hardness": 3,
    "porosity": 1,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "bubble-tea",
    "name": "珍珠奶茶",
    "category": "珍珠颗粒",
    "color": "#c8a27a",
    "description": "奶茶里滚着一颗颗黑珍珠，嚼着喝才有意思。",
    "effectLabel": "软硬 4；奶茶色",
    "tags": [
      "milk",
      "tea",
      "amber",
      "tapioca"
    ],
    "hardness": 4,
    "porosity": 0,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "grass-jelly",
    "name": "仙草冻饮",
    "category": "凝胶冻块",
    "color": "#827660",
    "description": "一杯茶里漂着滑溜溜的仙草冻，吸一口，冻块也跟着出发。",
    "effectLabel": "软硬 5；凝胶饮料；保留餐盘底色",
    "tags": [
      "gel-source",
      "grass-jelly"
    ],
    "hardness": 5,
    "porosity": 0,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "ink-tonic",
    "name": "深海墨水汽水",
    "category": "幻想",
    "color": "#607478",
    "description": "章鱼借出了一点墨水，气泡负责摇匀。",
    "effectLabel": "软硬 1；墨黑色；蓬松 +1",
    "tags": [
      "ink",
      "bubbles"
    ],
    "hardness": 1,
    "porosity": 1,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "prism-soda",
    "name": "棱镜汽水",
    "category": "幻想",
    "color": "#bc9ac7",
    "description": "把彩虹装进瓶子，给普通成品留下砖红色。",
    "effectLabel": "软硬 2；砖红色；蓬松 +1",
    "tags": [
      "rainbow-source",
      "beet-pigment",
      "bubbles"
    ],
    "hardness": 2,
    "porosity": 1,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "mineral-tonic",
    "name": "晶簇矿泉液",
    "category": "幻想",
    "color": "#a2c8d3",
    "description": "矿物饮料让自由组合更偏硬，颜色仍由餐盘决定。",
    "effectLabel": "软硬 6；保留餐盘底色",
    "tags": [
      "crystal-source"
    ],
    "hardness": 6,
    "porosity": 0,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  },
  {
    "id": "glow-soda",
    "name": "月光荧汽水",
    "category": "幻想",
    "color": "#acd4b2",
    "description": "借来半瓶月光，普通灯光下也不耽误做梦。",
    "effectLabel": "软硬 2；蓬松 +1；保留餐盘底色",
    "tags": [
      "glow-source",
      "bubbles"
    ],
    "hardness": 2,
    "porosity": 1,
    "effects": {
      "smoothnessBonus": 0
    },
    "icon": "drop",
    "unlock": {
      "kind": "open"
    }
  }
];
