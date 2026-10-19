export const contentValues = {
  "stools": [
    {
      "id": "classic",
      "name": "顺畅小能手",
      "homeType": 4,
      "category": "基础形态",
      "art": "plain",
      "color": "#ac8861",
      "light": "#cba880",
      "description": "基础造型，主要观察块体的连接程度与表面的平整度。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "garden",
      "name": "森林小精灵",
      "homeType": 4,
      "category": "食物印记",
      "art": "leaf",
      "color": "#91a66d",
      "light": "#b1c18d",
      "description": "表面带叶片状纹样，纹样与主体轮廓清楚分开。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "garden",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "garden",
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "bread",
      "name": "碳水小面包",
      "homeType": 3,
      "category": "食物印记",
      "art": "grain",
      "color": "#d3a365",
      "light": "#edc68c",
      "description": "表面带细粒状纹理，颗粒沿主体轮廓分布。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 6,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "fire",
      "name": "火山小辣椒",
      "homeType": 6,
      "category": "食物印记",
      "art": "heat",
      "color": "#c87d5d",
      "light": "#e5a27b",
      "description": "稠糊从厚端向一侧抹开，尾部变薄，边缘形成参差的小碎瓣。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 2,
        "cohesion": 2,
        "elongation": 1,
        "grain": 2,
        "porosity": 5
      },
      "generation": {
        "identity": "fire",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "fire",
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "coffee",
      "name": "醒神咖啡豆",
      "homeType": 5,
      "category": "色彩实验",
      "art": "coffee",
      "color": "#826b56",
      "light": "#a58b6e",
      "description": "表面带豆粒状纹样，局部可见短小凹线。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 3,
        "cohesion": 3,
        "elongation": 2,
        "grain": 1,
        "porosity": 3
      },
      "generation": {
        "identity": "coffee",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "coffee",
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "cloud",
      "name": "轻盈小云朵",
      "homeType": 5,
      "category": "食物印记",
      "art": "foam",
      "color": "#b4bc9b",
      "light": "#d7ddbc",
      "description": "三块饱满软团彼此分开，圆滑边缘像小云朵，完整保持各自轮廓。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 3,
        "cohesion": 3,
        "elongation": 2,
        "grain": 1,
        "porosity": 7
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "pebble",
      "name": "倔强小石头",
      "homeType": 1,
      "category": "基础形态",
      "art": "plain",
      "color": "#a79a7d",
      "light": "#c4b99d",
      "description": "基础造型，颗粒边界和块体之间的连接清晰可辨。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 7,
        "cohesion": 1,
        "elongation": 1,
        "grain": 4,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "gold",
      "name": "黄金传说",
      "homeType": 4,
      "category": "稀有材质",
      "art": "metal",
      "color": "#c7a44e",
      "light": "#edce76",
      "description": "整体呈金属色，表面反光明显，局部轮廓圆钝。",
      "rarity": "special",
      "material": "黄金",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      }
    },
    {
      "id": "cracked",
      "name": "旱地裂纹条",
      "homeType": 3,
      "category": "基础形态",
      "art": "cracks",
      "color": "#aa8862",
      "light": "#d9b88e",
      "description": "条体完整，表面可见连续裂纹，整体略显紧实。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 2,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "marble-pebbles",
      "name": "滚圆小弹珠",
      "homeType": 1,
      "category": "力度造型",
      "art": "marbles",
      "color": "#b89b78",
      "light": "#ddc4a4",
      "description": "呈多个分离的圆形硬粒，边缘圆钝，颗粒之间不相连。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 7,
        "cohesion": 1,
        "elongation": 1,
        "grain": 4,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "stacked-stones",
      "name": "香肠石块串",
      "homeType": 2,
      "category": "基础形态",
      "art": "segments",
      "color": "#a88f70",
      "light": "#ccb494",
      "description": "多个结块连成短条，接合处收窄，表面凹凸明显。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 6,
        "cohesion": 5,
        "elongation": 4,
        "grain": 4,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "corn-pebbles",
      "name": "玉米粒点名",
      "homeType": 5,
      "category": "食物印记",
      "art": "corn",
      "color": "#b69a60",
      "light": "#e4c36e",
      "description": "主体中可见玉米粒状残留，颗粒与底色分界清楚。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 3,
        "cohesion": 3,
        "elongation": 2,
        "grain": 6,
        "porosity": 3
      },
      "generation": {
        "identity": "corn",
        "base": false,
        "sources": {
          "foods": [
            "corn"
          ],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "enoki-thread",
      "name": "明天见丝丝",
      "homeType": 4,
      "category": "食物印记",
      "art": "threads",
      "color": "#b1a078",
      "light": "#e3d4ac",
      "description": "条状主体上可见细长丝状残留，丝线彼此交错。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "enoki",
        "base": false,
        "sources": {
          "foods": [
            "enoki"
          ],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "bran-log",
      "name": "全麦树皮条",
      "homeType": 3,
      "category": "食物印记",
      "art": "bran",
      "color": "#a98a5f",
      "light": "#d6b888",
      "description": "主体表面较粗糙，可见颗粒与纵向条纹。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 6,
        "porosity": 1
      },
      "generation": {
        "identity": "bran-log",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [
            "wholegrain"
          ],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "banana-curve",
      "name": "香蕉弯弯",
      "homeType": 4,
      "category": "食物印记",
      "art": "curve",
      "color": "#c4ad70",
      "light": "#e3ce98",
      "description": "条体弯成弧形，轮廓连续，两端较圆钝。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 7,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "spiral",
      "name": "一气呵成螺旋",
      "homeType": 4,
      "category": "力度造型",
      "art": "spiral",
      "color": "#b49a70",
      "light": "#dfc499",
      "description": "条体从底部连续盘卷至尖端，圈层完整，未见明显断裂。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 7,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "long-rope",
      "name": "一镜到底长条",
      "homeType": 4,
      "category": "力度造型",
      "art": "rope",
      "color": "#ad946b",
      "light": "#d6bd93",
      "description": "长条连续延伸，弯曲处连接完整，表面较平滑。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 7,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "segmented",
      "name": "节拍分段条",
      "homeType": 2,
      "category": "力度造型",
      "art": "cuts",
      "color": "#b19b77",
      "light": "#d9c39c",
      "description": "条体分成数段，断点清楚，部分段落仍保持连接。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 6,
        "cohesion": 5,
        "elongation": 4,
        "grain": 4,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "soft-pillows",
      "name": "软软小枕头",
      "homeType": 5,
      "category": "基础形态",
      "art": "pillows",
      "color": "#baa37d",
      "light": "#e2cfa9",
      "description": "呈多个圆润软块，块体饱满，边缘清楚。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 3,
        "cohesion": 3,
        "elongation": 2,
        "grain": 1,
        "porosity": 3
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "mashed-potato",
      "name": "绵软小泥堆",
      "homeType": 6,
      "category": "基础形态",
      "art": "mash",
      "color": "#baa581",
      "light": "#e2d0a8",
      "description": "中间堆起一小团稠糊，底部向外塌落，边缘拖出低矮碎瓣。通用泥堆造型，不限定土豆食材。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 2,
        "cohesion": 2,
        "elongation": 1,
        "grain": 2,
        "porosity": 5
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "pancake",
      "name": "摊平小煎饼",
      "homeType": 7,
      "category": "基础形态",
      "art": "flat",
      "color": "#af9d77",
      "light": "#d6c5a0",
      "description": "薄薄一摊水样液体，外缘不规则舒展，周围散落大小不一的溅滴。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "jet",
      "name": "喷射战士出击",
      "homeType": 7,
      "category": "力度造型",
      "art": "jet",
      "color": "#b78b67",
      "light": "#ddb591",
      "description": "液体从一端加压冲出，展开细长分叉的扇形喷溅，前端卷起并甩出悬空液滴。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "ribbon",
      "name": "顺滑缎带",
      "homeType": 4,
      "category": "力度造型",
      "art": "ribbon",
      "color": "#b7a077",
      "light": "#e0caa3",
      "description": "主体扁长，局部折叠弯曲，边缘较平整。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 7,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "bubbly",
      "name": "咕噜落滴滩",
      "homeType": 7,
      "category": "色彩实验",
      "art": "bubbles",
      "color": "#b0b49a",
      "light": "#d9dfbd",
      "description": "液体落下后向四周溅开，中央留有一圈抬起的涟漪和悬空小液滴。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 7
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "red-dragon",
      "name": "玫红火龙卷",
      "homeType": 4,
      "category": "色彩实验",
      "art": "pigment",
      "color": "#c67596",
      "light": "#eaa9bf",
      "description": "主体呈玫红色，颜色分布较均匀，轮廓清晰。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "red-dragon",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "dragon",
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "beet-red",
      "name": "甜菜砖红条",
      "homeType": 3,
      "category": "色彩实验",
      "art": "pigment",
      "color": "#a86d65",
      "light": "#d79b90",
      "description": "主体呈砖红色，表面色泽较均匀。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 2,
        "porosity": 1
      },
      "generation": {
        "identity": "beet-red",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "beet",
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "purple-berry",
      "name": "莓紫软团",
      "homeType": 5,
      "category": "色彩实验",
      "art": "pigment",
      "color": "#9b7ca6",
      "light": "#c9a8d3",
      "description": "主体呈莓紫色，色调较深，表面颜色连续。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 3,
        "cohesion": 3,
        "elongation": 2,
        "grain": 1,
        "porosity": 3
      },
      "generation": {
        "identity": "purple-berry",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "berry",
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "ink-black",
      "name": "深海墨墨",
      "homeType": 7,
      "category": "色彩实验",
      "art": "ink",
      "color": "#4f6264",
      "light": "#83999b",
      "description": "深色液体从宽水滩流出，拖出弯曲细尾，末端断成小液滴。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "ink",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "ink",
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "cocoa-truffle",
      "name": "可可松露团",
      "homeType": 2,
      "category": "色彩实验",
      "art": "cocoa",
      "color": "#88684d",
      "light": "#b1906c",
      "description": "主体呈深棕色，表面带细粉状纹理。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 6,
        "cohesion": 5,
        "elongation": 4,
        "grain": 4,
        "porosity": 1
      },
      "generation": {
        "identity": "cocoa-truffle",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "cocoa",
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "amber-honey",
      "name": "蜜糖琥珀条",
      "homeType": 3,
      "category": "色彩实验",
      "art": "honey",
      "color": "#c19c50",
      "light": "#e5c979",
      "description": "主体呈暖蜜色，表面带柔和光泽。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 2,
        "porosity": 1
      },
      "generation": {
        "identity": "amber-honey",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "honey",
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "milk-white",
      "name": "奶油白软块",
      "homeType": 5,
      "category": "色彩实验",
      "art": "pigment",
      "color": "#d6d2b9",
      "light": "#f3eed7",
      "description": "主体呈奶白色，色泽较浅，表面明暗过渡柔和。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 3,
        "cohesion": 3,
        "elongation": 2,
        "grain": 1,
        "porosity": 3
      },
      "generation": {
        "identity": "milk-white",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "milk",
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "oat-speckle",
      "name": "燕麦点点条",
      "homeType": 3,
      "category": "食物印记",
      "art": "oats",
      "color": "#c3ae87",
      "light": "#e8d6b6",
      "description": "表面散布细小斑点，颗粒与主体边界可辨。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 6,
        "porosity": 1
      },
      "generation": {
        "identity": "oat-speckle",
        "base": false,
        "sources": {
          "foods": [
            "oatmeal"
          ],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "glitter",
      "name": "闪粉派对",
      "homeType": 4,
      "category": "点缀加工",
      "art": "glitter",
      "color": "#b39a79",
      "light": "#dac09b",
      "description": "主体表面散布细小反光颗粒，局部有点状闪光。",
      "rarity": "uncommon",
      "material": "闪粉点缀",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "glitter",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": [
            "glitter"
          ]
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "gold-flake",
      "name": "碎金芝麻卷",
      "homeType": 4,
      "category": "点缀加工",
      "art": "gold-flake",
      "color": "#aa9067",
      "light": "#d9bd87",
      "description": "表面可见片状金色附着物，片状反光与主体底色分开。",
      "rarity": "uncommon",
      "material": "金箔点缀",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "gold-flake",
        "base": false,
        "sources": {
          "foods": [
            "black-sesame"
          ],
          "tags": [],
          "pigment": null,
          "additives": [
            "gold-leaf"
          ]
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "silver-speckle",
      "name": "银霜斑点卷",
      "homeType": 4,
      "category": "点缀加工",
      "art": "silver",
      "color": "#9b9d91",
      "light": "#d3d8cc",
      "description": "表面散布银白斑点，局部呈薄霜状反光。",
      "rarity": "uncommon",
      "material": "银色点缀",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "silver-speckle",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": [
            "silver-dust"
          ]
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "petal",
      "name": "花瓣夹心条",
      "homeType": 4,
      "category": "点缀加工",
      "art": "petals",
      "color": "#b49c7f",
      "light": "#d8bfa3",
      "description": "表面夹有花瓣状薄片，薄片边缘清楚。",
      "rarity": "uncommon",
      "material": "花瓣",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "petal",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [
            "petal"
          ],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "popping",
      "name": "噼啪跳跳团",
      "homeType": 6,
      "category": "点缀加工",
      "art": "popping",
      "color": "#b79c81",
      "light": "#e1c5a8",
      "description": "几片扁塌的碎糊散开，边缘参差相连，表面点缀小颗粒。",
      "rarity": "uncommon",
      "material": "跳跳颗粒",
      "properties": {
        "hardness": 2,
        "cohesion": 2,
        "elongation": 1,
        "grain": 6,
        "porosity": 5
      },
      "generation": {
        "identity": "popping",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [
            "popping"
          ],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "sesame-charcoal",
      "name": "黑芝麻小矿石",
      "homeType": 1,
      "category": "点缀加工",
      "art": "charcoal",
      "color": "#6d756c",
      "light": "#a4aa94",
      "description": "主体呈深黑色，表面带细碎斑点与颗粒纹理。",
      "rarity": "uncommon",
      "material": "炭粉点缀",
      "properties": {
        "hardness": 7,
        "cohesion": 1,
        "elongation": 1,
        "grain": 6,
        "porosity": 1
      },
      "generation": {
        "identity": "sesame-charcoal",
        "base": false,
        "sources": {
          "foods": [
            "black-sesame"
          ],
          "tags": [],
          "pigment": "ink",
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "wood-grain",
      "name": "檀纹安静条",
      "homeType": 3,
      "category": "设备印记",
      "art": "wood",
      "color": "#ac8964",
      "light": "#d7b491",
      "description": "表面可见弯曲的木纹状条线，纹路沿主体分布。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 2,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "warm-coil",
      "name": "暖呼呼小卷",
      "homeType": 4,
      "category": "设备印记",
      "art": "warm",
      "color": "#bf9c78",
      "light": "#e5c6a2",
      "description": "柔软条体弯成小卷，连接处完整，收尾圆润。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 7,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "low"
      }
    },
    {
      "id": "massage-beads",
      "name": "按摩珠珠串",
      "homeType": 2,
      "category": "设备印记",
      "art": "beads",
      "color": "#a99d83",
      "light": "#d7cbb1",
      "description": "多个珠状块体相邻排列，块体圆润，间隙清楚。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 6,
        "cohesion": 5,
        "elongation": 4,
        "grain": 4,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "stone-tower",
      "name": "荒野平衡石塔",
      "homeType": 2,
      "category": "设备印记",
      "art": "tower",
      "color": "#999b88",
      "light": "#c6c9b2",
      "description": "多个紧实结块上下堆叠，层间连接较窄。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 6,
        "cohesion": 5,
        "elongation": 4,
        "grain": 4,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "squat-spring",
      "name": "蹲姿小弹簧",
      "homeType": 4,
      "category": "设备印记",
      "art": "spring",
      "color": "#a99572",
      "light": "#d7c097",
      "description": "条体连续盘成数圈，圈距较均匀，连接处完整。",
      "rarity": "common",
      "material": "普通",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 7,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "base",
        "base": true,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "crystal",
      "name": "晶簇收藏家",
      "homeType": 3,
      "category": "稀有材质",
      "art": "crystal",
      "color": "#8cb8cb",
      "light": "#d2edf2",
      "description": "表面带透明晶簇，棱面清楚，局部有折射光泽。",
      "rarity": "special",
      "material": "晶体",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 2,
        "porosity": 1
      }
    },
    {
      "id": "rainbow",
      "name": "七色同框",
      "homeType": 4,
      "category": "稀有材质",
      "art": "rainbow",
      "color": "#b59ac5",
      "light": "#e4c3d9",
      "description": "多色条带沿主体分布，颜色之间有连续过渡。",
      "rarity": "special",
      "material": "彩虹",
      "properties": {
        "hardness": 4,
        "cohesion": 7,
        "elongation": 6,
        "grain": 1,
        "porosity": 1
      }
    },
    {
      "id": "jelly",
      "name": "Q 弹果冻",
      "homeType": 5,
      "category": "稀有材质",
      "art": "jelly",
      "color": "#9fc28b",
      "light": "#d0e7b1",
      "description": "主体半透明，边缘圆润，可见柔和的透光层次。",
      "rarity": "special",
      "material": "果冻",
      "properties": {
        "hardness": 3,
        "cohesion": 3,
        "elongation": 2,
        "grain": 1,
        "porosity": 3
      }
    },
    {
      "id": "frost-crystal",
      "name": "霜花小晶块",
      "homeType": 2,
      "category": "稀有材质",
      "art": "frost",
      "color": "#a7c9ce",
      "light": "#e0eff0",
      "description": "表面带霜花状晶面，边缘有清楚的几何棱角。",
      "rarity": "special",
      "material": "霜晶",
      "properties": {
        "hardness": 6,
        "cohesion": 5,
        "elongation": 4,
        "grain": 4,
        "porosity": 1
      }
    },
    {
      "id": "luminous",
      "name": "夜光小浮岛",
      "homeType": 6,
      "category": "稀有材质",
      "art": "glow",
      "color": "#88bd9a",
      "light": "#d0eab1",
      "description": "低矮稠糊摊成相连的浮岛，中央塌陷，碎瓣状边缘泛出微光。",
      "rarity": "special",
      "material": "夜光",
      "properties": {
        "hardness": 2,
        "cohesion": 2,
        "elongation": 1,
        "grain": 2,
        "porosity": 5
      }
    },
    {
      "id": "meteor",
      "name": "星尘小陨石",
      "homeType": 1,
      "category": "稀有材质",
      "art": "meteor",
      "color": "#71788e",
      "light": "#afb8d2",
      "description": "主体呈深色，表面粗糙，夹有少量点状亮斑。",
      "rarity": "special",
      "material": "星尘矿石",
      "properties": {
        "hardness": 7,
        "cohesion": 1,
        "elongation": 1,
        "grain": 4,
        "porosity": 1
      }
    },
    {
      "id": "amber-fossil",
      "name": "琥珀时间胶囊",
      "homeType": 3,
      "category": "稀有材质",
      "art": "amber",
      "color": "#bd9454",
      "light": "#e7c882",
      "description": "主体呈暖色半透明质感，内部可见封存的叶片状纹样。",
      "rarity": "special",
      "material": "琥珀",
      "properties": {
        "hardness": 5,
        "cohesion": 6,
        "elongation": 6,
        "grain": 2,
        "porosity": 1
      }
    },
    {
      "id": "enoki-jet",
      "name": "明天见喷射",
      "homeType": 7,
      "category": "食物印记",
      "art": "water-enoki-jet",
      "color": "#ad7856",
      "light": "#e9c8a0",
      "description": "液态喷射向外展开，多条细长的金针菇丝随着液体流线清晰可见。",
      "rarity": "uncommon",
      "material": "金针菇细丝",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "enoki",
        "base": false,
        "sources": {
          "foods": [
            "enoki"
          ],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "corn-cannon",
      "name": "玉米机关枪",
      "homeType": 7,
      "category": "食物印记",
      "art": "water-corn-cannon",
      "color": "#b78053",
      "light": "#f2c779",
      "description": "喷溅液体裹挟明显的黄色玉米粒，飞溅轨迹呈断续点状。",
      "rarity": "uncommon",
      "material": "玉米颗粒",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "corn",
        "base": false,
        "sources": {
          "foods": [
            "corn"
          ],
          "tags": [],
          "pigment": null,
          "additives": []
        },
        "forceZone": "high"
      }
    },
    {
      "id": "golden-juice",
      "name": "黄金汁",
      "homeType": 7,
      "category": "稀有材质",
      "art": "water-golden-juice",
      "color": "#d7a53c",
      "light": "#fff0a3",
      "description": "整个水样主体呈流动的液态黄金，并非普通棕色液体漂浮几片金箔。",
      "rarity": "special",
      "material": "液态黄金",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      }
    },
    {
      "id": "rainbow-falls",
      "name": "彩虹瀑布",
      "homeType": 7,
      "category": "稀有材质",
      "art": "water-rainbow-falls",
      "color": "#b992cc",
      "light": "#f3d0e5",
      "description": "多道彩色液流沿喷溅方向展开，形成连续的彩虹色带与散落液滴。",
      "rarity": "special",
      "material": "彩虹液体",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      }
    },
    {
      "id": "glitter-galaxy",
      "name": "闪粉银河",
      "homeType": 7,
      "category": "点缀加工",
      "art": "water-glitter-galaxy",
      "color": "#4a405d",
      "light": "#a68ad2",
      "description": "暗紫黑色水样主体漂浮银紫色细闪，形成星空般的喷溅效果。",
      "rarity": "uncommon",
      "material": "星空闪粉",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "glitter-galaxy",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "ink",
          "additives": [
            "glitter"
          ]
        },
        "forceZone": "medium"
      }
    },
    {
      "id": "ink-fountain",
      "name": "墨汁喷泉",
      "homeType": 7,
      "category": "色彩实验",
      "art": "water-ink-fountain",
      "color": "#3f3637",
      "light": "#a69897",
      "description": "乌黑的液体喷起数道细长水柱，然后聚成一片水样液面。",
      "rarity": "uncommon",
      "material": "墨黑液体",
      "properties": {
        "hardness": 1,
        "cohesion": 1,
        "elongation": 1,
        "grain": 1,
        "porosity": 1
      },
      "generation": {
        "identity": "ink",
        "base": false,
        "sources": {
          "foods": [],
          "tags": [],
          "pigment": "ink",
          "additives": []
        },
        "forceZone": "high"
      }
    }
  ],
  "recipes": [
    {
      "characterId": "pebble",
      "foodIds": [
        "rice",
        "toast",
        "egg"
      ],
      "drinkId": "water",
      "water": 250,
      "digestionTime": "8",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "marble-pebbles",
      "foodIds": [
        "toast",
        "almonds"
      ],
      "drinkId": "water",
      "water": 250,
      "digestionTime": "8",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "sesame-charcoal",
      "foodIds": [
        "toast",
        "almonds",
        "black-sesame"
      ],
      "drinkId": "water",
      "water": 250,
      "digestionTime": "8",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "stacked-stones",
      "foodIds": [
        "brown-rice",
        "egg"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "8",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "segmented",
      "foodIds": [
        "toast",
        "wholewheat"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "8",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "cocoa-truffle",
      "foodIds": [
        "toast",
        "popping-chocolate"
      ],
      "drinkId": "coffee",
      "water": 250,
      "digestionTime": "8",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "massage-beads",
      "foodIds": [
        "red-beans",
        "chickpeas",
        "almonds"
      ],
      "drinkId": "water",
      "water": 500,
      "digestionTime": "8",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "stone-tower",
      "foodIds": [
        "brown-rice",
        "fried-insects",
        "almonds"
      ],
      "drinkId": "water",
      "water": 500,
      "digestionTime": "8",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "bread",
      "foodIds": [
        "toast",
        "potato"
      ],
      "drinkId": "water",
      "water": 500,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "cracked",
      "foodIds": [
        "toast",
        "egg"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "bran-log",
      "foodIds": [
        "wholewheat",
        "bamboo-shoots"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "beet-red",
      "foodIds": [
        "toast",
        "beetroot"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "amber-honey",
      "foodIds": [
        "pumpkin",
        "wholewheat"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "oat-speckle",
      "foodIds": [
        "oatmeal",
        "almonds"
      ],
      "drinkId": "water",
      "water": 1000,
      "digestionTime": "8",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "wood-grain",
      "foodIds": [
        "wholewheat",
        "brown-rice",
        "egg"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "classic",
      "foodIds": [
        "rice"
      ],
      "drinkId": "water",
      "water": 1250,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "garden",
      "foodIds": [
        "rice",
        "spinach"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "enoki-thread",
      "foodIds": [
        "rice",
        "enoki"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "banana-curve",
      "foodIds": [
        "rice",
        "banana",
        "apple"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "spiral",
      "foodIds": [
        "rice",
        "okra"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "long-rope",
      "foodIds": [
        "rice",
        "konjac"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "ribbon",
      "foodIds": [
        "oatmeal",
        "okra"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "red-dragon",
      "foodIds": [
        "rice",
        "dragon-fruit"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "glitter",
      "foodIds": [
        "rice",
        "rainbow-crayon"
      ],
      "drinkId": "water",
      "water": 1000,
      "digestionTime": "2",
      "forceZone": "medium",
      "requiredAdditive": "glitter"
    },
    {
      "characterId": "gold-flake",
      "foodIds": [
        "brown-rice",
        "black-sesame"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "2",
      "forceZone": "medium",
      "requiredAdditive": "gold-leaf"
    },
    {
      "characterId": "silver-speckle",
      "foodIds": [
        "rice",
        "yogurt"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": "silver-dust"
    },
    {
      "characterId": "petal",
      "foodIds": [
        "rice",
        "rose-cake"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "warm-coil",
      "foodIds": [
        "sweet-potato",
        "pumpkin"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "squat-spring",
      "foodIds": [
        "rice",
        "natto",
        "okra"
      ],
      "drinkId": "water",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "coffee",
      "foodIds": [
        "rice",
        "red-beans"
      ],
      "drinkId": "coffee",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "cloud",
      "foodIds": [
        "oatmeal",
        "marshmallow-foam"
      ],
      "drinkId": "soda",
      "water": 1250,
      "digestionTime": "4",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "corn-pebbles",
      "foodIds": [
        "rice",
        "corn",
        "pear"
      ],
      "drinkId": "water",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "soft-pillows",
      "foodIds": [
        "potato",
        "pumpkin"
      ],
      "drinkId": "water",
      "water": 1250,
      "digestionTime": "4",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "purple-berry",
      "foodIds": [
        "oatmeal",
        "prune"
      ],
      "drinkId": "prune-juice",
      "water": 750,
      "digestionTime": "4",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "milk-white",
      "foodIds": [
        "rice",
        "yogurt"
      ],
      "drinkId": "milk",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "fire",
      "foodIds": [
        "rice",
        "hotpot",
        "snail-noodles"
      ],
      "drinkId": "milk",
      "water": 750,
      "digestionTime": "2",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "mashed-potato",
      "foodIds": [
        "potato",
        "pumpkin"
      ],
      "drinkId": "water",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "popping",
      "foodIds": [
        "banana",
        "popping-chocolate"
      ],
      "drinkId": "soda",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "pancake",
      "foodIds": [
        "rice",
        "pear",
        "prune"
      ],
      "drinkId": "prune-juice",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "jet",
      "foodIds": [
        "burger"
      ],
      "drinkId": "coffee",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "bubbly",
      "foodIds": [
        "pear",
        "prune"
      ],
      "drinkId": "soda",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "medium",
      "requiredAdditive": null
    },
    {
      "characterId": "ink-black",
      "foodIds": [
        "squid-ink-pasta",
        "pear",
        "burger"
      ],
      "drinkId": "prune-juice",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "low",
      "requiredAdditive": null
    },
    {
      "characterId": "enoki-jet",
      "foodIds": [
        "burger",
        "enoki"
      ],
      "drinkId": "milk",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "corn-cannon",
      "foodIds": [
        "burger",
        "corn"
      ],
      "drinkId": "prune-juice",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "high",
      "requiredAdditive": null
    },
    {
      "characterId": "glitter-galaxy",
      "foodIds": [
        "squid-ink-pasta",
        "prune",
        "burger"
      ],
      "drinkId": "soda",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "medium",
      "requiredAdditive": "glitter"
    },
    {
      "characterId": "ink-fountain",
      "foodIds": [
        "squid-ink-pasta",
        "pear",
        "burger"
      ],
      "drinkId": "prune-juice",
      "water": 1250,
      "digestionTime": "2",
      "forceZone": "high",
      "requiredAdditive": null
    }
  ],
  "drinks": [
    {
      "id": "water",
      "name": "清水",
      "category": "补水基准",
      "color": "#a8d2cf",
      "description": "补水打底，保留餐盘原本的形态与颜色倾向。",
      "effectLabel": "湿软偏置 +0",
      "tags": [],
      "porosity": 0,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0
    },
    {
      "id": "coffee",
      "name": "一杯咖啡",
      "category": "肠道促动",
      "color": "#94735c",
      "description": "给肠道按一下出场铃，咖啡色也跟着报到。",
      "effectLabel": "湿软偏置 +0.2",
      "tags": [
        "coffee"
      ],
      "porosity": 0,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "coffee",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.2
    },
    {
      "id": "prune-juice",
      "name": "西梅汁",
      "category": "软化干硬",
      "color": "#8c6b88",
      "description": "干硬路线的软化选手，还会留下深紫色的签名。",
      "effectLabel": "湿软偏置 +0.6",
      "tags": [
        "prune",
        "berry-pigment"
      ],
      "porosity": 0,
      "effects": {
        "smoothnessBonus": 0.3
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.6
    },
    {
      "id": "milk",
      "name": "鲜牛奶",
      "category": "乳糖反应",
      "color": "#e5e2cb",
      "description": "乳糖主题的湿软作用更明显；搭配高致软主食和辣酱短时消化，还可能出现更稀的形态。",
      "effectLabel": "湿软偏置 +0.50；与高致软食物、辣酱的短时组合可叠加",
      "tags": [
        "milk",
        "lactose"
      ],
      "porosity": 0,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.5
    },
    {
      "id": "soda",
      "name": "气泡水",
      "category": "气泡胀气",
      "color": "#b0cdd0",
      "description": "咕噜冒泡，给配方添点气孔，不额外推高稀软。",
      "effectLabel": "湿软偏置 +0.13；气泡 +1",
      "tags": [
        "bubbles"
      ],
      "porosity": 1,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.13
    },
    {
      "id": "bubble-tea",
      "name": "珍珠奶茶",
      "category": "珍珠颗粒",
      "color": "#c8a27a",
      "description": "奶茶里滚着一颗颗黑珍珠，嚼着喝才有意思。",
      "effectLabel": "湿软偏置 +0.05",
      "tags": [
        "milk",
        "tea",
        "amber",
        "tapioca"
      ],
      "porosity": 0,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.05
    },
    {
      "id": "grass-jelly",
      "name": "仙草冻饮",
      "category": "凝胶冻块",
      "color": "#827660",
      "description": "一杯茶里漂着滑溜溜的仙草冻，吸一口，冻块也跟着出发。",
      "effectLabel": "湿软偏置 +0.2",
      "tags": [
        "gel-source",
        "grass-jelly"
      ],
      "porosity": 0,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.2
    },
    {
      "id": "ink-tonic",
      "name": "深海墨水汽水",
      "category": "幻想",
      "color": "#607478",
      "description": "章鱼借出了一点墨水，气泡负责摇匀。",
      "effectLabel": "湿软偏置 +0.25；气泡 +1",
      "tags": [
        "ink",
        "bubbles"
      ],
      "porosity": 1,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.25
    },
    {
      "id": "prism-soda",
      "name": "棱镜汽水",
      "category": "幻想",
      "color": "#bc9ac7",
      "description": "把彩虹装进瓶子，给普通成品留下砖红色。",
      "effectLabel": "湿软偏置 +0.18；气泡 +1",
      "tags": [
        "rainbow-source",
        "beet-pigment",
        "bubbles"
      ],
      "porosity": 1,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.18
    },
    {
      "id": "mineral-tonic",
      "name": "晶簇矿泉液",
      "category": "幻想",
      "color": "#a2c8d3",
      "description": "矿物饮料让自由组合更偏硬，颜色仍由餐盘决定。",
      "effectLabel": "湿软偏置 -0.4",
      "tags": [
        "crystal-source"
      ],
      "porosity": 0,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": -0.4
    },
    {
      "id": "glow-soda",
      "name": "月光荧汽水",
      "category": "幻想",
      "color": "#acd4b2",
      "description": "借来半瓶月光，普通灯光下也不耽误做梦。",
      "effectLabel": "湿软偏置 +0.18；气泡 +1",
      "tags": [
        "glow-source",
        "bubbles"
      ],
      "porosity": 1,
      "effects": {
        "smoothnessBonus": 0
      },
      "icon": "drop",
      "unlock": {
        "kind": "open"
      },
      "wetnessBias": 0.18
    }
  ],
  "additives": [
    {
      "id": "probiotic",
      "name": "益生菌",
      "symbol": "✳",
      "color": "#a5b578",
      "description": "稳定当前配方的普通主结果，自由组合也能生效。",
      "effectLabel": "未中稀有后，当前合法主结果稳定产出100%；自由组合也有效",
      "tags": [
        "probiotic"
      ],
      "effects": {},
      "rareTargets": [],
      "stability": 1,
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "chili",
      "name": "神秘辣酱",
      "symbol": "♨",
      "color": "#c88766",
      "description": "让自由组合更偏软。",
      "effectLabel": "自由组合软硬值 −1；提供辣色",
      "tags": [
        "chili"
      ],
      "effects": {},
      "rareTargets": [],
      "propertyChanges": {
        "hardness": -1
      },
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "glitter",
      "name": "闪粉",
      "symbol": "✦",
      "color": "#baa778",
      "description": "让本次成品直接带上亮闪。",
      "effectLabel": "必定增加闪粉装饰，保留原有形态和底色",
      "tags": [
        "glitter"
      ],
      "effects": {},
      "rareTargets": [],
      "decoration": "glitter",
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "gold-leaf",
      "name": "金箔碎片",
      "symbol": "◆",
      "color": "#c8aa52",
      "description": "金色碎片与黄金收藏的机会。",
      "effectLabel": "增加金箔装饰；黄金传说与黄金汁合计 +3% 稀有概率",
      "tags": [
        "gold-source"
      ],
      "effects": {},
      "rareTargets": [
        "gold",
        "golden-juice"
      ],
      "decoration": "gold-flake",
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "silver-dust",
      "name": "银色糖霜",
      "symbol": "✧",
      "color": "#9fadb7",
      "description": "在本次成品表面落下银白小点。",
      "effectLabel": "必定增加银色斑点，保留原有形态",
      "tags": [
        "silver"
      ],
      "effects": {},
      "rareTargets": [],
      "decoration": "silver",
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "crystal-seed",
      "name": "晶体种子",
      "symbol": "◇",
      "color": "#94c3d0",
      "description": "让晶体收藏更容易出现。",
      "effectLabel": "晶簇收藏家 +3% 概率；稀有总概率变为 5%",
      "tags": [
        "crystal-source"
      ],
      "effects": {},
      "rareTargets": [
        "crystal"
      ],
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "rainbow-sugar",
      "name": "彩虹糖屑",
      "symbol": "❖",
      "color": "#b08fb9",
      "description": "提高两款彩虹收藏的机会。",
      "effectLabel": "七色同框与彩虹瀑布合计 +3% 稀有概率",
      "tags": [
        "rainbow-source"
      ],
      "effects": {},
      "rareTargets": [
        "rainbow",
        "rainbow-falls"
      ],
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "gelatin",
      "name": "弹弹凝胶",
      "symbol": "◒",
      "color": "#adc985",
      "description": "自由组合更凝聚，也更容易遇到果冻。",
      "effectLabel": "自由组合凝聚 +1；Q 弹果冻 +3% 概率",
      "tags": [
        "gel-source"
      ],
      "effects": {},
      "rareTargets": [
        "jelly"
      ],
      "propertyChanges": {
        "cohesion": 1
      },
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "popping-candy",
      "name": "跳跳糖",
      "symbol": "※",
      "color": "#d7a574",
      "description": "小颗粒直接留在这一次的成品上。",
      "effectLabel": "必定增加跳跳颗粒；自由组合蓬松 +1",
      "tags": [
        "popping",
        "bubbles"
      ],
      "effects": {},
      "rareTargets": [],
      "decoration": "popping",
      "propertyChanges": {
        "porosity": 1
      },
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "charcoal",
      "name": "竹炭粉",
      "symbol": "●",
      "color": "#667575",
      "description": "为本次成品染上炭黑色。",
      "effectLabel": "增加炭色与黑色斑点，保留原有形态",
      "tags": [
        "charcoal"
      ],
      "effects": {},
      "rareTargets": [],
      "decoration": "charcoal",
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "fiber",
      "name": "膳食纤维粉",
      "symbol": "≋",
      "color": "#a9b282",
      "description": "让自由组合更贴近目标软硬度。",
      "effectLabel": "自由组合凝聚 +1，并优先保留相近软硬的形态",
      "tags": [
        "fiber-powder"
      ],
      "effects": {},
      "rareTargets": [],
      "stability": 2,
      "propertyChanges": {
        "cohesion": 1
      },
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "oil",
      "name": "顺滑植物油",
      "symbol": "◕",
      "color": "#c5b677",
      "description": "让自由组合更软、更顺畅。",
      "effectLabel": "自由组合软硬 −1；顺畅评分 +0.7",
      "tags": [
        "oil"
      ],
      "effects": {
        "smoothnessBonus": 0.7
      },
      "rareTargets": [],
      "propertyChanges": {
        "hardness": -1
      },
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "frost-salt",
      "name": "霜花盐",
      "symbol": "❄",
      "color": "#accfd5",
      "description": "提高霜晶收藏的机会。",
      "effectLabel": "霜花小晶块 +3% 概率；稀有总概率变为 5%",
      "tags": [
        "frost-source"
      ],
      "effects": {},
      "rareTargets": [
        "frost-crystal"
      ],
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "cocoa-powder",
      "name": "可可粉",
      "symbol": "∴",
      "color": "#9e7b61",
      "description": "增加可可色与细粒感。",
      "effectLabel": "提供可可色；自由组合颗粒 +1",
      "tags": [
        "cocoa"
      ],
      "effects": {},
      "rareTargets": [],
      "propertyChanges": {
        "grain": 1
      },
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "flower-petal",
      "name": "干花瓣",
      "symbol": "✿",
      "color": "#c496aa",
      "description": "把花瓣直接点缀在本次成品上。",
      "effectLabel": "必定增加花瓣装饰，保留原有形态",
      "tags": [
        "petal"
      ],
      "effects": {},
      "rareTargets": [],
      "decoration": "petals",
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "stardust",
      "name": "星尘",
      "symbol": "⋆",
      "color": "#9296bd",
      "description": "提高陨星和夜光收藏的机会。",
      "effectLabel": "星尘小陨石与夜光小浮岛合计 +3% 稀有概率",
      "tags": [
        "star-source",
        "glow-source"
      ],
      "effects": {},
      "rareTargets": [
        "meteor",
        "luminous"
      ],
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "magnet-sand",
      "name": "磁力砂",
      "symbol": "⌁",
      "color": "#858d9a",
      "description": "让自由组合中的小块更容易聚在一起。",
      "effectLabel": "自由组合凝聚 +2",
      "tags": [
        "magnet"
      ],
      "effects": {},
      "rareTargets": [],
      "propertyChanges": {
        "cohesion": 2
      },
      "unlock": {
        "kind": "open"
      }
    },
    {
      "id": "amber-resin",
      "name": "琥珀树脂",
      "symbol": "◈",
      "color": "#caa16c",
      "description": "提高暖色琥珀收藏的机会。",
      "effectLabel": "琥珀时间胶囊 +3% 概率；稀有总概率变为 5%",
      "tags": [
        "amber-source"
      ],
      "effects": {},
      "rareTargets": [
        "amber-fossil"
      ],
      "unlock": {
        "kind": "open"
      }
    }
  ],
  "toilets": [
    {
      "id": "standard",
      "name": "经典白瓷马桶",
      "material": "陶瓷",
      "shape": "seat",
      "feature": "基础",
      "description": "熟悉的白瓷小伙伴，朴素又安心。",
      "effectLabel": "基准顺畅度，忠实呈现配方",
      "effects": {},
      "tags": [],
      "starter": true,
      "unlock": {
        "kind": "open"
      },
      "palette": {
        "ceramic": [
          "#fffef5",
          "#f5f7eb",
          "#c9d8cc"
        ],
        "tank": [
          "#fffef5",
          "#c9d8cc"
        ],
        "bowl": [
          "#c9d8cc",
          "#f5f7eb"
        ]
      }
    },
    {
      "id": "comfort",
      "name": "薄荷舒享马桶",
      "material": "陶瓷",
      "shape": "seat",
      "feature": "软垫",
      "description": "柔软座圈负责托住心情，惊喜留给配方。",
      "effectLabel": "顺畅 +1；薄荷色软垫场景",
      "effects": {
        "smoothnessBonus": 1
      },
      "tags": [],
      "starter": false,
      "unlock": {
        "kind": "rounds",
        "count": 3
      },
      "palette": {
        "ceramic": [
          "#f1fbeb",
          "#dcebcf",
          "#bed6b0"
        ],
        "tank": [
          "#f1fbeb",
          "#bed6b0"
        ],
        "bowl": [
          "#bed6b0",
          "#dcebcf"
        ]
      }
    },
    {
      "id": "golden",
      "name": "黄金马桶",
      "material": "黄金",
      "shape": "royal",
      "feature": "奢华反光",
      "description": "财富感围了一圈，金色反光陪你放松。",
      "effectLabel": "顺畅 +2；金色奢华场景",
      "effects": {
        "smoothnessBonus": 2
      },
      "tags": [
        "gold-seat"
      ],
      "starter": false,
      "unlock": {
        "kind": "rounds",
        "count": 40
      },
      "palette": {
        "ceramic": [
          "#fff2be",
          "#e9d18a",
          "#c4a45f"
        ],
        "tank": [
          "#fff2be",
          "#c4a45f"
        ],
        "bowl": [
          "#c4a45f",
          "#e9d18a"
        ]
      }
    },
    {
      "id": "sandalwood",
      "name": "檀香木马桶",
      "material": "檀香木",
      "shape": "wood",
      "feature": "香气放松",
      "description": "木纹缓缓绕一圈，把紧张也绕开。",
      "effectLabel": "顺畅 +0.6；檀木纹理场景",
      "effects": {
        "smoothnessBonus": 0.6
      },
      "tags": [
        "wood-seat"
      ],
      "starter": false,
      "unlock": {
        "kind": "rounds",
        "count": 12
      },
      "palette": {
        "ceramic": [
          "#d3b28a",
          "#b78f68",
          "#876d53"
        ],
        "tank": [
          "#d3b28a",
          "#876d53"
        ],
        "bowl": [
          "#876d53",
          "#b78f68"
        ]
      }
    },
    {
      "id": "heated",
      "name": "恒温暖座马桶",
      "material": "陶瓷",
      "shape": "heated",
      "feature": "加热",
      "description": "温度刚刚好，慢慢来，也不着急。",
      "effectLabel": "顺畅 +0.8；暖座场景",
      "effects": {
        "smoothnessBonus": 0.8
      },
      "tags": [
        "warm-seat"
      ],
      "starter": false,
      "unlock": {
        "kind": "rounds",
        "count": 5
      },
      "palette": {
        "ceramic": [
          "#fff0da",
          "#ecd4b1",
          "#c6a384"
        ],
        "tank": [
          "#fff0da",
          "#c6a384"
        ],
        "bowl": [
          "#c6a384",
          "#ecd4b1"
        ]
      }
    },
    {
      "id": "massage",
      "name": "波浪按摩马桶",
      "material": "软胶陶瓷",
      "shape": "massage",
      "feature": "按摩",
      "description": "咚、咚、咚，座圈的节奏让身体慢慢放松。",
      "effectLabel": "顺畅 +1；波浪按摩场景",
      "effects": {
        "smoothnessBonus": 1
      },
      "tags": [
        "massage-seat"
      ],
      "starter": false,
      "unlock": {
        "kind": "rounds",
        "count": 8
      },
      "palette": {
        "ceramic": [
          "#dce8ed",
          "#b7cdd9",
          "#8fa8bd"
        ],
        "tank": [
          "#dce8ed",
          "#8fa8bd"
        ],
        "bowl": [
          "#8fa8bd",
          "#b7cdd9"
        ]
      }
    },
    {
      "id": "squat",
      "name": "经典蹲坑",
      "material": "陶瓷",
      "shape": "squat",
      "feature": "蹲姿",
      "description": "熟悉的双脚落位，找到舒服的蹲姿。",
      "effectLabel": "顺畅 +1；经典蹲姿场景",
      "effects": {
        "smoothnessBonus": 1
      },
      "tags": [
        "squat-seat"
      ],
      "starter": true,
      "unlock": {
        "kind": "open"
      },
      "palette": {
        "ceramic": [
          "#f4f0df",
          "#dcdac6",
          "#a8b8a4"
        ],
        "tank": [
          "#f4f0df",
          "#a8b8a4"
        ],
        "bowl": [
          "#a8b8a4",
          "#dcdac6"
        ]
      }
    },
    {
      "id": "stone",
      "name": "野趣石头堆",
      "material": "河石",
      "shape": "stones",
      "feature": "户外平衡",
      "description": "两块石头搭个平台，朴素得很有求生感。",
      "effectLabel": "顺畅 −0.5；户外石头场景",
      "effects": {
        "smoothnessBonus": -0.5
      },
      "tags": [
        "stone-seat"
      ],
      "starter": true,
      "unlock": {
        "kind": "open"
      },
      "palette": {
        "ceramic": [
          "#c6c5b6",
          "#a6aa9c",
          "#7f8b80"
        ],
        "tank": [
          "#c6c5b6",
          "#7f8b80"
        ],
        "bowl": [
          "#7f8b80",
          "#a6aa9c"
        ]
      }
    },
    {
      "id": "vortex",
      "name": "涡流助力马桶",
      "material": "钢化陶瓷",
      "shape": "vortex",
      "feature": "旋流助力",
      "description": "一圈旋流，把今日的疲惫轻轻带走。",
      "effectLabel": "顺畅 +1.2；旋流助力场景",
      "effects": {
        "smoothnessBonus": 1.2
      },
      "tags": [
        "vortex-seat"
      ],
      "starter": false,
      "unlock": {
        "kind": "rounds",
        "count": 18
      },
      "palette": {
        "ceramic": [
          "#d9ece8",
          "#b4d5d2",
          "#81aaa9"
        ],
        "tank": [
          "#d9ece8",
          "#81aaa9"
        ],
        "bowl": [
          "#81aaa9",
          "#b4d5d2"
        ]
      }
    },
    {
      "id": "crystal-seat",
      "name": "水晶观测马桶",
      "material": "水晶",
      "shape": "crystal",
      "feature": "低温观测",
      "description": "透明外壳认真围观，冷色水晶映出安静光线。",
      "effectLabel": "基准顺畅度；透明水晶场景",
      "effects": {},
      "tags": [
        "crystal-seat"
      ],
      "starter": false,
      "unlock": {
        "kind": "rounds",
        "count": 25
      },
      "palette": {
        "ceramic": [
          "#e7f4fa",
          "#bfdce9",
          "#92b9cf"
        ],
        "tank": [
          "#e7f4fa",
          "#92b9cf"
        ],
        "bowl": [
          "#92b9cf",
          "#bfdce9"
        ]
      }
    }
  ],
  "artwork": [
    {
      "id": "classic",
      "path": "/assets/stools/reference-v2/classic.png"
    },
    {
      "id": "garden",
      "path": ""
    },
    {
      "id": "bread",
      "path": ""
    },
    {
      "id": "fire",
      "path": ""
    },
    {
      "id": "coffee",
      "path": ""
    },
    {
      "id": "cloud",
      "path": ""
    },
    {
      "id": "pebble",
      "path": ""
    },
    {
      "id": "gold",
      "path": "/assets/stools/reference-v2/gold.png"
    },
    {
      "id": "cracked",
      "path": "/assets/stools/reference-v2/cracked.png"
    },
    {
      "id": "marble-pebbles",
      "path": ""
    },
    {
      "id": "stacked-stones",
      "path": "/assets/stools/reference-v2/stacked-stones.png"
    },
    {
      "id": "corn-pebbles",
      "path": ""
    },
    {
      "id": "enoki-thread",
      "path": ""
    },
    {
      "id": "bran-log",
      "path": ""
    },
    {
      "id": "banana-curve",
      "path": ""
    },
    {
      "id": "spiral",
      "path": "/assets/stools/reference-v2/spiral.png"
    },
    {
      "id": "long-rope",
      "path": ""
    },
    {
      "id": "segmented",
      "path": ""
    },
    {
      "id": "soft-pillows",
      "path": "/assets/stools/reference-v2/soft-pillows.png"
    },
    {
      "id": "mashed-potato",
      "path": "/assets/stools/reference-v2/mashed-potato.png"
    },
    {
      "id": "pancake",
      "path": "/assets/stools/reference-v2/pancake.png"
    },
    {
      "id": "jet",
      "path": "/assets/stools/reference-v2/jet.png"
    },
    {
      "id": "ribbon",
      "path": ""
    },
    {
      "id": "bubbly",
      "path": "/assets/stools/reference-v2/bubbly.png"
    },
    {
      "id": "red-dragon",
      "path": ""
    },
    {
      "id": "beet-red",
      "path": ""
    },
    {
      "id": "purple-berry",
      "path": ""
    },
    {
      "id": "ink-black",
      "path": ""
    },
    {
      "id": "cocoa-truffle",
      "path": ""
    },
    {
      "id": "amber-honey",
      "path": ""
    },
    {
      "id": "milk-white",
      "path": ""
    },
    {
      "id": "oat-speckle",
      "path": ""
    },
    {
      "id": "glitter",
      "path": ""
    },
    {
      "id": "gold-flake",
      "path": ""
    },
    {
      "id": "silver-speckle",
      "path": ""
    },
    {
      "id": "petal",
      "path": ""
    },
    {
      "id": "popping",
      "path": ""
    },
    {
      "id": "sesame-charcoal",
      "path": ""
    },
    {
      "id": "wood-grain",
      "path": ""
    },
    {
      "id": "warm-coil",
      "path": ""
    },
    {
      "id": "massage-beads",
      "path": ""
    },
    {
      "id": "stone-tower",
      "path": "/assets/stools/reference-v2/stone-tower.png"
    },
    {
      "id": "squat-spring",
      "path": ""
    },
    {
      "id": "crystal",
      "path": ""
    },
    {
      "id": "rainbow",
      "path": ""
    },
    {
      "id": "jelly",
      "path": "/assets/stools/reference-v2/jelly.png"
    },
    {
      "id": "frost-crystal",
      "path": ""
    },
    {
      "id": "luminous",
      "path": ""
    },
    {
      "id": "meteor",
      "path": "/assets/stools/reference-v2/meteor.png"
    },
    {
      "id": "amber-fossil",
      "path": ""
    },
    {
      "id": "enoki-jet",
      "path": "/assets/stools/reference-v2/enoki-jet.png"
    },
    {
      "id": "corn-cannon",
      "path": "/assets/stools/reference-v2/corn-cannon.png"
    },
    {
      "id": "golden-juice",
      "path": "/assets/stools/reference-v2/golden-juice.png"
    },
    {
      "id": "rainbow-falls",
      "path": "/assets/stools/reference-v2/rainbow-falls.png"
    },
    {
      "id": "glitter-galaxy",
      "path": "/assets/stools/reference-v2/glitter-galaxy.png"
    },
    {
      "id": "ink-fountain",
      "path": "/assets/stools/reference-v2/ink-fountain.png"
    }
  ]
};
