/**
 * 物品資料庫（中央表）：消耗品 / 武器 / 飾品 / 素材
 * - 純 JavaScript：這個檔案不要放 <script> 標籤！
 * - 新增 mp_small（靈氣丹）
 * - 補齊所有怪物掉落會用到的素材（避免袋子渲染缺資料）
 * - getDefaultBag 使用深拷貝；提供 addConsumableToBag / addMaterialToBag
 */
(function () {
  'use strict';

  const RARITY = ["普", "精", "稀", "史", "傳"];
  const STACK_MAX = 9999;

  // === 物品定義（中央資料庫） ===
  const DB = {
    // ---- 消耗品（Consumables）----
    consumables: [
      { id: "hp_small", name: "小氣血丹",   effect: { hp: 25 },  price: 20,  icon: "https://i.ibb.co/Hfxz9394/image.png" },
      { id: "hp_mid",   name: "中氣血丹",   effect: { hp: 70 },  price: 60,  icon: "https://i.ibb.co/Nd71zTVQ/image.png" },
      { id: "hp_large", name: "大氣血丹",   effect: { hp: 140 }, price: 160, icon: "https://i.ibb.co/hxqHhB8M/image.png" },
      { id: "hp_huge",  name: "巨顆氣血丹", effect: { hp: 300 }, price: 350, icon: "https://i.ibb.co/TMsHqmNX/image.png" },
      { id: "mp_small", name: "靈氣丹",     effect: { mp: 25 },  price: 20,  icon: "" },
      // { id: "entry_ticket", name: "副本入場卷", effect: null, price: 0, icon: "" },
    ],

    // ---- 武器（Weapons）----
    weapons: [
      { id: "c_dagger1", name: "普通的青銅短劍", level: 1, atk: 10, dmg: [4, 5],  rarity: "普", plus: 0, price: 50,  durMax: 50,  icon: "https://i.ibb.co/LDTw5Ry1/image.png" },
      { id: "c_dagger2", name: "精良的青銅短劍", level: 1, atk: 12, dmg: [5, 7],  rarity: "精", plus: 0, price: 120, durMax: 70,  icon: "https://i.ibb.co/LdxqWgyn/image.png" },
      { id: "c_dagger3", name: "稀有的青銅短劍", level: 1, atk: 14, dmg: [7, 9], rarity: "稀", plus: 0, price: 260, durMax: 100, icon: "https://i.ibb.co/tTvTWTDq/image.png" },
    ],
    // ---- 飾品（Ornaments）----
    ornaments: [
      { id: "ring01",      name: "銀戒指", rarity: "普", level: 1, effect: { hp: 20 }, price: 150, icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756981436/LV1_%E6%B8%85%E6%9C%A8%E8%80%B3%E7%92%B0_%E6%99%AE%E9%80%9A_wddgym.png", desc: "微弱靈氣的翠綠戒指，可微量增加真元。" },
      { id: "ring02",      name: "銀戒指", rarity: "精", level: 1, effect: { hp: 25 }, price: 200, icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756981437/LV1_%E6%B8%85%E6%9C%A8%E8%80%B3%E7%92%B0_%E7%B2%BE%E5%93%81_k15ryq.png", desc: "微弱靈氣的翠綠戒指，可微量增加真元。" },
      { id: "ring03",      name: "銀戒指", rarity: "稀", level: 1, effect: { hp: 30 }, price: 250, icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756981436/LV1_%E6%B8%85%E6%9C%A8%E8%80%B3%E7%92%B0_%E7%A8%80%E6%9C%89_eteazz.png", desc: "微弱靈氣的翠綠戒指，可微量增加真元。" },
      { id: "jade_ring",   name: "翠玉戒指", rarity: "普", level: 5, effect: { mp: 80, int: 3 }, price: 600, icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757394896/%E7%BF%A0%E7%8E%89%E6%88%92%E6%8C%87_vuqx3k.png", desc: "微弱靈氣的翠綠戒指，可微量增加真元。" },
      { id: "ring_blood",  name: "血玉戒指", rarity: "普", level: 5, effect: { hp: 80, vit: 3 }, price: 600, icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757394896/%E8%A1%80%E7%8E%89%E6%88%92%E6%8C%87_yerivc.png", desc: "注入氣血的紅玉戒指，增加生命與體魄。" },
      { id: "ring_spirit", name: "魂晶戒指", rarity: "普", level: 5, effect: { eva: 3, int: 4 }, price: 600, icon: "https://i.ibb.co/gTQmz0z/ring-spirit.png", desc: "封存靈魂之力的戒指，大幅提升真元與悟性。" }
    ],

    // ---- 耳環（Earrings）----
    earrings: [
      { id: "ear_smalljade", name: "小翠耳環", rarity: "普", level: 1, effect: { hp: 20 }, price: 80, icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758465744/%E5%B0%8F%E7%BF%A0%E8%80%B3%E7%92%B01LV_ggjgpk.png", desc: "靈玉雕製的耳環，帶微靈氣。" },
      { id: "ear_ice", name: "冰痕耳環", rarity: "普", level: 2, effect: { mp: 40, int: 1 }, price: 160, icon: "https://i.ibb.co/SNQwMfL/ear-ice.png", desc: "如霜凝結的冰晶耳飾，提升悟性。" },
      { id: "ear_shadow", name: "影縛耳環", rarity: "普", level: 4, effect: { mp: 60, agi: 2 }, price: 300, icon: "https://i.ibb.co/n8bkZJ1/ear-shadow.png", desc: "由陰影之絲編製而成，強化反應力。" },
    ],

    // ---- 披風（Cloaks）----
    cloaks: [
      { id: "cloak_fur", name: "野獸皮披風", rarity: "普", level: 1, effect: { def: 10 }, price: 60, icon: "https://i.ibb.co/kSBbfdb/cloak-fur.png", desc: "由野獸皮製成，提供基本防禦。" },
      { id: "cloak_shadow", name: "影影披風", rarity: "普", level: 3, effect: { def: 20, agi: 2 }, price: 240, icon: "https://i.ibb.co/qNh1ZbZ/cloak-shadow.png", desc: "能融入陰影之中的神秘披風。" },
      { id: "cloak_phoenix", name: "鳳羽披風", rarity: "普", level: 6, effect: { def: 30, mp: 50, int: 3 }, price: 600, icon: "https://i.ibb.co/c1Z8PT7/cloak-phoenix.png", desc: "用鳳凰羽毛織就的披風，蘊含靈氣。" },
    ],

    // ---- 衣服（Armors）----
    armors: [
      { id: "armor_leather", name: "皮甲", rarity: "普", level: 1, def: 12, price: 50, icon: "https://i.ibb.co/YZhXbZx/armor-leather.png", desc: "基礎皮革製作的衣甲，提供基本防護。" },
      { id: "armor_ice", name: "冰晶甲", rarity: "普", level: 3, def: 22, res: { ice: 10 }, price: 180, icon: "https://i.ibb.co/jkRhWwT/armor-ice.png", desc: "由寒冰鑄成的護甲，擁有冰抗性。" },
      { id: "armor_ghost", name: "靈魂鎧", rarity: "普", level: 5, def: 28, hp: 50, price: 400, icon: "https://i.ibb.co/VJTXS5x/armor-ghost.png", desc: "帶有靈魂庇佑的戰甲，增加防禦與生命。" },
    ],

    // ---- 鞋子（Boots）----
    boots: [
      { id: "boot_cloth", name: "布鞋", rarity: "普", level: 1, effect: { agi: 1 }, price: 30, icon: "https://i.ibb.co/m05xVcs/boot-cloth.png", desc: "輕便布鞋，提升少許敏捷。" },
      { id: "boot_fur", name: "毛靴", rarity: "普", level: 2, effect: { agi: 2, def: 5 }, price: 100, icon: "https://i.ibb.co/t4MKtzS/boot-fur.png", desc: "保暖的毛皮靴，提升移動力。" },
      { id: "boot_phantom", name: "幻影靴", rarity: "普", level: 5, effect: { agi: 4 }, price: 300, icon: "https://i.ibb.co/GcsWR7r/boot-phantom.png", desc: "幽影如風，穿上後動如鬼魅。" },
    ],

    // ---- 外觀（Appearances）----
    // 外觀不可強化，可堆疊；裝備位僅 1 格，會直接替換舊外觀
    appearances: [
      { id: "skin_qing_m", name: "剛毅", rarity: "普", level: 1,
        effect: { hp: 20, mdef: 2, eva: 1, aspd: 1, 'matk': 2 },
        price: 800, stackable: true,
        icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757379252/%E5%89%9B%E6%AF%85_sg4o6l.png",
        desc: "出身清流門的男俠客，劍眉星目、氣定神閒。身法靈巧，氣脈流轉。"
      },
      { id: "skin_qing_f", name: "霜霜", rarity: "普", level: 1,
        effect: { hp: 20, mdef: 2, eva: 1, aspd: 1, 'matk': 2 },
        price: 800, stackable: true,
        icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757379052/%E9%9C%9C%E9%9C%9C_xbxtrm.png",
        desc: "清流門女俠客，眉目如畫、劍膽琴心。真元溫潤，動如行雲。"
      },
      { id: "skin_qing_a", name: "忠海", rarity: "普", level: 2,
        effect: { hp: 20, def: 1, aspd: 3, eva: 4 },
        price: 2500, stackable: true,
        icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757379818/%E5%BF%A0%E6%B5%B7_oo5orp.png",
        desc: "出生於偏僻小山區的一位男俠客，輕功略優。"
      },
      { id: "skin_raiming", name: "妙青青", rarity: "精", level: 2,
        effect: { hp: 30, def: 2, aspd: 3, eva: 2 },
        grantSkills: ["Bluewave_Fist",],  // 裝備外觀後賦予技能
        price: 5500, stackable: true,
        icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757379822/%E5%A6%99%E9%9D%92%E9%9D%92_zhravi.png",
        desc: "拳法女俠，家中絕學藍波拳"
      },
      { id: "skin_raiming1", name: "雷山明", rarity: "精", level: 2,
        effect: { hp: 30, def: 1, aspd: 4, eva: 2 },
        grantSkills: ["thunder_palm", "thunder_drop"],  // 裝備外觀後賦予技能
        price: 5500, stackable: true,
        icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757379818/%E5%BF%A0%E6%B5%B7_oo5orp.png",
        desc: "雷脈天賦者，電光縈身、步履如風。"
      },
      { id: "skin_ice_asuna", name: "修仙亞絲娜", rarity: "稀", level: 2,
        effect: { hp: 40, atk: 5, def: 3, aspd: 5, eva: 3 },
        grantSkills: ["ice_shard", "blizzard"],  // 裝備外觀後賦予技能
        price: 8000, stackable: true,
        icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757510184/%E4%BF%AE%E4%BB%99%E4%BA%9E%E7%B5%B2%E5%A8%9C_iyrl5i.png",
        desc: "從現實世界穿越過來的橫溝，是一位冰系使用者。"
      },
      { id: "night_yu", name: "夜神宇", rarity: "稀", level: 3,
        effect: { hp: 80, atk: 6, def: 3, aspd: 10, eva: 3, 'matk': 3 },
        grantSkills: ["psychic", "telekinesis","mind_blast"],  // 裝備外觀後賦予技能
        price: 18000, stackable: true,
        icon: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757691625/%E5%A4%9C%E7%A5%9E%E5%AE%87_drztxi.png",
        desc: "自現代都市的普通青年，在一次神秘的時空異象中意外穿越到異世界。跨越位面的過程中，他的身體承受了巨大的時空能量衝擊，因此覺醒了前所未有的超能力。"
      }
    ],

      // === 🆕 卡片資料 ===
  cards: [
    // 刀劍神域-WS SAO/S20系列 ソードアート・オンライン
    {
      id: "S20-001",
      name: "派對邀請函 亞絲娜 RR",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758514438/%E3%83%91%E3%83%BC%E3%83%86%E3%82%A3%E3%83%BC%E3%81%AE%E8%AA%98%E3%81%84_%E3%82%A2%E3%82%B9%E3%83%8ARR_mbb6s1.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "S20-001S",
      name: "派對邀請函 亞絲娜 SR",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758514439/%E3%83%91%E3%83%BC%E3%83%86%E3%82%A3%E3%83%BC%E3%81%AE%E8%AA%98%E3%81%84_%E3%82%A2%E3%82%B9%E3%83%8ASR_wx5vnv.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "S20-002",
      name: "閃光亞絲娜 RR",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758514438/%E9%96%83%E5%85%89_%E3%81%AE%E3%82%A2%E3%82%B9%E3%83%8A_RR_agwwif.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-002SP",
      name: "閃光亞絲娜 SP",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758514438/%E9%96%83%E5%85%89_%E3%81%AE%E3%82%A2%E3%82%B9%E3%83%8A_SP_dxzymd.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-003",
      name: "躺在沙發上的亞絲娜 R",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758514438/%E3%82%BD%E3%83%95%E3%82%A1%E3%81%AB%E6%A8%AA%E3%81%9F%E3%82%8F%E3%82%8B%E3%82%A2%E3%82%B9%E3%83%8A_R_wuuu6l.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-003S",
      name: "躺在沙發上的亞絲娜 SR",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758529874/%E3%82%BD%E3%83%95%E3%82%A1%E3%81%AB%E6%A8%AA%E3%81%9F%E3%82%8F%E3%82%8B%E3%82%A2%E3%82%B9%E3%83%8A_SR_hptvfx.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-004",
      name: "被俘女王亞絲娜 R",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758529873/%E5%9B%9A%E3%82%8F%E3%82%8C%E3%81%AE%E5%A5%B3%E7%8E%8B_%E3%82%A2%E3%82%B9%E3%83%8A_R_emomt4.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-005",
      name: "亞絲娜換衣服 R",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758529873/%E7%9D%80%E6%9B%BF%E3%81%88%E4%B8%AD%E3%81%AE%E3%82%A2%E3%82%B9%E3%83%8A_R_ghgqji.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-006",
      name: "沉睡的亞絲娜 R",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758529873/%E3%81%BE%E3%81%A9%E3%82%8D%E3%82%80%E3%82%A2%E3%82%B9%E3%83%8A_R_jtwlfw.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-006R",
      name: "沉睡的亞絲娜 RRR",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758529873/%E3%81%BE%E3%81%A9%E3%82%8D%E3%82%80%E3%82%A2%E3%82%B9%E3%83%8A_RRR_uhdbzz.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-007",
      name: "威嚴的力量亞絲娜 R",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758530905/%E5%87%9B%E3%81%A8%E3%81%97%E3%81%9F%E5%BC%B7%E3%81%95_%E3%82%A2%E3%82%B9%E3%83%8A_R_fyzq4u.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-007R",
      name: "威嚴的力量亞絲娜 RRR",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758530905/%E5%87%9B%E3%81%A8%E3%81%97%E3%81%9F%E5%BC%B7%E3%81%95_%E3%82%A2%E3%82%B9%E3%83%8A_RRR_a4u90a.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-008",
      name: "新婚生活 亞絲娜 U",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758530905/%E6%96%B0%E5%A9%9A%E7%94%9F%E6%B4%BB_%E3%82%A2%E3%82%B9%E3%83%8A_U_mnrfhl.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-009",
      name: "無防備的亞絲娜 U",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758530905/%E7%84%A1%E9%98%B2%E5%82%99%E3%81%AA%E7%B4%A0%E9%A1%94_%E3%82%A2%E3%82%B9%E3%83%8A_U_bxzidk.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-010",
      name: "副團長亞絲娜 U",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758530905/%E5%89%AF%E5%9B%A3%E9%95%B7_%E3%82%A2%E3%82%B9%E3%83%8A_U_ydxoz8.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-011",
      name: "躲避雨水的亞絲娜 U",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758530905/%E9%9B%A8%E5%AE%BF%E3%82%8A_%E3%82%A2%E3%82%B9%E3%83%8A_U_puxztr.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "SAO/S20-012",
      name: "求婚回應 亞絲娜 U",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758530905/%E3%83%97%E3%83%AD%E3%83%9D%E3%83%BC%E3%82%BA%E3%81%AE%E8%BF%94%E4%BA%8B_%E3%82%A2%E3%82%B9%E3%83%8A_U_zxopk8.png",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "WS SAO/S20系列 ソードアート・オンライン",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "",
      name: "",
      price: 8000, stackable: true,
      img: "",
      desc: "",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "WS_001_SSS",
      name: "SSS-湊友希那",
      price: 8000, stackable: true,
      img: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758247405/WS_%E9%B3%A5%E7%B1%A0%E3%81%AE%E6%AD%8C%E5%A7%AB-%E6%B9%8A%E5%8F%8B%E5%B8%8C%E9%82%A3BD_bvhlsn.png",
      desc: "WS 鳥籠の歌姫-湊友希那BD",
      bonus: { hp: 5, mp: 5, atk: 1, spd: 2}
    },
    {
      id: "card_water",
      name: "水流卡",
      price: 8000, stackable: true,
      img: "card_water.png",
      desc: "水流的祝福",
      bonus: { hp: 6}
    },
    {
      id: "card_wind",
      name: "疾風卡",
      price: 8000, stackable: true,
      img: "card_wind.png",
      desc: "疾風的速度",
      bonus: { hp: 7}
    },

    ],

    // ---- 勳章（Medals）----
    medals: [
      { id: "medal_beginner", name: "初學者勳章", rarity: "普", effect: { hp: 10, mp: 10 }, icon: "https://i.ibb.co/XkBZFP7/medal-beginner.png", desc: "頒給入門修士的基本勳章。" },
      { id: "medal_ice", name: "冰霜勳章", rarity: "精", effect: { res: { ice: 10 }, mp: 20 }, icon: "https://i.ibb.co/qkhhVRZ/medal-ice.png", desc: "象徵冰屬支配的徽記，擁有冰耐性。" },
      { id: "medal_warlord", name: "戰魂勳章", rarity: "史", effect: { atk: 10, hp: 50 }, icon: "https://i.ibb.co/mzKKWpF/medal-war.png", desc: "只授予戰績卓著之修士的榮勳章。" },
    ],


    // ---- 素材（Materials）----
    materials: [
      { id:"wood_shard",    name:"木靈碎片",   rarity:"普", price:14, icon:"https://i.ibb.co/sv81h190/image.png", desc:"木屬初階靈材，常見於靈木林。" },
      { id:"slime_jelly",   name:"史萊姆凝膠", rarity:"普", price:12, icon:"https://i.ibb.co/vvwVxHx9/image.png", desc:"黏稠凝膠，可作為煉製材料。" },
      { id:"fox_tail",      name:"靈狐尾",     rarity:"普", price:18, icon:"https://i.ibb.co/HspkbYT/image.png", desc:"狐狸的尾毛，富含靈性。" },
      { id:"thorn_shard",   name:"荊棘碎片",   rarity:"普", price:10, icon:"https://i.ibb.co/XxTZ7syL/image.png", desc:"鋒利的荊棘殘片。" },
      { id:"stone_core",    name:"石像核心",   rarity:"精", price:45, icon:"https://i.ibb.co/WWnBT1G8/image.png", desc:"石像守衛身上的能量核心。" },
      { id:"hard_rock",     name:"堅石",       rarity:"普", price:15, icon:"https://i.ibb.co/gFF3RCwp/image.png", desc:"堅硬岩石，可作為鍛造基材。" },
      { id:"ghost_essence", name:"幽魂精華",   rarity:"稀", price:60, icon:"https://i.ibb.co/mC3TS1WJ/image.png", desc:"自亡靈身上凝成的精華物質。" },
      { id:"wolf_fur",      name:"狼毛",       rarity:"普", price:16, icon:"https://i.ibb.co/GQkwt32B/image.png", desc:"雪原狼的毛皮。" },
      { id:"wolf_fang",     name:"狼牙",       rarity:"普", price:14, icon:"https://i.ibb.co/tM8yQrvR/image.png", desc:"鋒利的狼牙，可作材料。" },
      { id:"ice_crystal",   name:"冰晶",       rarity:"普", price:20, icon:"https://i.ibb.co/LdQQVq0X/image.png", desc:"寒氣凝結成的晶體。" },
      { id:"frozen_thorn",  name:"凍結荊棘",   rarity:"精", price:28, icon:"https://i.ibb.co/wFDyjfXn/image.png", desc:"被寒霜封存的荊棘，帶寒性。" },
      { id:"bear_claw",     name:"熊爪",       rarity:"精", price:32, icon:"https://i.ibb.co/dsRzmc7s/image.png", desc:"巨熊的爪子，沉重而堅硬。" },
      { id:"bear_fur",      name:"熊皮",       rarity:"普", price:26, icon:"https://i.ibb.co/1ttsV4N6/image.png", desc:"厚實保暖的皮張。" },

      { id:"charcoal",      name:"木炭",       rarity:"普", price:10, icon:"", desc:"以木材燒製的炭塊，可作為鍛造或煉藥燃料。" },
      { id:"fire_seed",     name:"火種",       rarity:"普", price:16, icon:"", desc:"蘊含微弱火靈力的種子，煉器常用。" }
    ],

  };


  


  // === 工具 ===
  const deepCopy = (o) => JSON.parse(JSON.stringify(o));
  const arrOf = (k) => Array.isArray(DB[k]) ? DB[k] : [];
  const normalizeRarity = (r) => RARITY.includes(r) ? r : "普通";

  function getDef(kind, id) {
    const arr = arrOf(kind);
    return arr.find((x) => x && x.id === id) || null;
  }

  // === 建立預設背包（深拷貝） ===
  function weaponWithDur(def){
    if (!def) return null;
    return Object.assign(deepCopy(def), { dur: { cur: def.durMax || 0, max: def.durMax || 0 } });
  }
  function getDefaultBag() {
    const bag = {
      consumables: [],
      weapons: [],
      ornaments: [],
      materials: [],
      hidden: [],
    };
    const hpS = getDef("consumables", "hp_small");
    const hpM = getDef("consumables", "hp_mid");
    if (hpS) bag.consumables.push(Object.assign(deepCopy(hpS), { count: 20 }));
    if (hpM) bag.consumables.push(Object.assign(deepCopy(hpM), { count: 3  }));

    ["c_dagger1","c_dagger2","c_dagger3"].forEach(id=>{
      const w = weaponWithDur(getDef("weapons", id));
      if (w) bag.consumables; // no-op to keep structure
      if (w) bag.weapons.push(w);
    });
    return bag;
  }

  // === 背包操作：消耗品 ===
  function addConsumableToBag(bag, id, qty) {
    if (!bag || !qty || qty <= 0) return;
    const def = getDef("consumables", id);
    if (!def) return;

    bag.consumables = bag.consumables || [];
    let remain = qty;

    for (const it of bag.consumables) {
      if (it.id !== id) continue;
      const can = Math.max(0, STACK_MAX - (it.count || 0));
      const add = Math.min(can, remain);
      if (add > 0) {
        it.count = (it.count || 0) + add;
        remain -= add;
      }
      if (remain <= 0) break;
    }

    while (remain > 0) {
      const take = Math.min(STACK_MAX, remain);
      bag.consumables.push(Object.assign(deepCopy(def), { count: take }));
      remain -= take;
    }
  }

  // === 背包操作：素材 ===
  function addMaterialToBag(bag, id, qty) {
    if (!bag || !qty || qty <= 0) return;
    bag.materials = bag.materials || [];

    const def = getDef("materials", id);
    const name = def?.name || id;
    const icon = def?.icon || "";

    const idx = bag.materials.findIndex(x=>x.id===id);
    if (idx >= 0) {
      bag.materials[idx].count = (bag.materials[idx].count || 0) + qty;
      if (!bag.materials[idx].name) bag.materials[idx].name = name;
      if (!bag.materials[idx].icon) bag.materials[idx].icon = icon;
    } else {
      bag.materials.push({ id, name, icon, count: qty });
    }
  }

// === 對外 ===
window.ItemDB = {
  RARITY,
  STACK_MAX,
  DB,
  normalizeRarity,
  getDef,
  getDefaultBag,
  list: function(kind){
    var d = DB && DB[kind];
    if (Array.isArray(d)) return d.slice();
    return [];
  },

  // === 堆疊型 ===
  addConsumableToBag: addConsumableToBag,
  addMaterialToBag:   addMaterialToBag,

  // === 武器：逐把加入，帶耐久 ===
  addWeaponToBag: function(bag, id, qty){
    if(!bag || !qty || qty<=0) return;
    var def = getDef('weapons', id);
    if(!def) return;
    bag.weapons = bag.weapons || [];
    for(var i=0;i<qty;i++){
      var w = weaponWithDur(def);
      if(w) bag.weapons.push(w);
    }
  },

  // === 飾品：戒指/耳飾/披風/護甲/鞋/勳章都以「單件不堆疊」加入 ornaments ===
  addOrnamentToBag: function(bag, id, qty){
    if(!bag || !qty || qty<=0) return;
    var kinds = ['ornaments','earrings','cloaks','armors','boots','medals'];
    var def = null;
    for(var i=0;i<kinds.length;i++){
      var d = getDef(kinds[i], id);
      if(d){ def = d; break; }
    }
    if(!def) return;
    bag.ornaments = bag.ornaments || [];
    for(var j=0;j<qty;j++){
      bag.ornaments.push(deepCopy(def));
    }
  },

  // === 勳章：若未另外做面板，也暫放 ornaments ===
  addMedalToBag: function(bag, id, qty){
    if(!bag || !qty || qty<=0) return;
    var def = getDef('medals', id);
    if(!def) return;
    bag.ornaments = bag.ornaments || [];
    for(var i=0;i<qty;i++){
      bag.ornaments.push(deepCopy(def));
    }
  },

  // === 🆕 卡片收藏：新增 / 讀取 ===
  /**
   * 將卡片加入玩家的收藏物件。
   * @param {object} playerOrCards - 可傳整個玩家物件 P，或直接傳 P.cards
   * @param {string|number} id     - 卡片 ID（會轉成字串儲存）
   * @param {number} qty           - 數量（正整數）
   */
  addCardToCollection: function(playerOrCards, id, qty){
    if(!id) return;
    qty = parseInt(qty,10); if(!qty || qty<=0) return;
    var target = null;

    // 允許傳 P 或 P.cards
    if (playerOrCards && typeof playerOrCards === 'object'){
      if (playerOrCards.cards && typeof playerOrCards.cards === 'object') {
        // 傳進來是 P
        playerOrCards.cards = playerOrCards.cards || {};
        target = playerOrCards.cards;
      } else {
        // 傳進來就是 P.cards
        target = playerOrCards;
      }
    }
    if(!target) return;

    // 接受 {id:count} 或陣列格式，統一用物件儲存
    if (Array.isArray(target)){
      // 轉物件
      var obj = {};
      for (var i=0;i<target.length;i++){
        var it = target[i]||{};
        var k  = it.id!=null ? String(it.id) : null;
        if(!k) continue;
        var c  = it.count!=null ? parseInt(it.count,10) : 1;
        if(isNaN(c)||c<0) c=0;
        obj[k] = (obj[k]||0) + c;
      }
      target = obj;
      // 回寫（如果是 P.cards 陣列進來）
      if (playerOrCards && playerOrCards.cards) playerOrCards.cards = target;
    }

    var key = String(id);
    var cur = parseInt(target[key]||0,10); if(isNaN(cur)||cur<0) cur=0;
    target[key] = cur + qty;
  },

  /**
   * 取得玩家持有某卡的數量（若無，回 0）
   * @param {object} playerOrCards - 可傳 P 或 P.cards
   * @param {string|number} id
   */
  getCardCount: function(playerOrCards, id){
    if(!id) return 0;
    var target = (playerOrCards && playerOrCards.cards && typeof playerOrCards.cards==='object')
      ? playerOrCards.cards : playerOrCards;
    if(!target) return 0;

    if (Array.isArray(target)){
      var total = 0, key = String(id);
      for (var i=0;i<target.length;i++){
        var it = target[i]||{};
        if (String(it.id)===key){
          var c = parseInt(it.count,10); if(!isNaN(c)&&c>0) total += c;
        }
      }
      return total;
    }
    var n = parseInt(target[String(id)]||0,10);
    return (isNaN(n)||n<0) ? 0 : n;
  }
};



})();
