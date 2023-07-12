import {
  IndexFile,
  DayType, RegionType, ConcernRarity,
  CharacterTalentMaterial, WeaponAscensionMaterial
} from './types/data';
import FileUtil from '../../../utils/file';

const indexFolder = 'genshin/resources/index';
const dataFolder = 'genshin/resources/data';
const talentMaterialFolder = `${dataFolder}/talentmaterials`;
const weaponMaterialFolder = `${dataFolder}/weaponmaterials`;

// type result = Record<DayType, Record<ConcernRarity, Record<RegionType, string[]>>>;
// {
//   '周一': {
//     '5': {
//       '蒙德': [],
//       '璃月': [],
//       '稻妻': [],
//       '须弥': []
//     },
//     '4': {
//       '蒙德': [],
//       '璃月': [],
//       '稻妻': [],
//       '须弥': []
//     }
//   }
// }

export function updateDailyMaterial() {
  // 基础分类
  const categories = JSON.parse(FileUtil.loadFile(`${indexFolder}/categories.json`, 'plugins'));
  const days: DayType[] = categories['day'] ?? [];
  const region: string[] = categories['region'] ?? [];

  //#region 角色天赋素材

  // 索引文件
  const talentIndex: IndexFile = JSON.parse(FileUtil.loadFile(`${indexFolder}/talents.json`, 'plugins'));
  const talentMaterialIndex: IndexFile = JSON.parse(FileUtil.loadFile(`${indexFolder}/talentmaterials.json`, 'plugins'));

  // 处理
  let talentResult = {};
  days.map((day) => {
    talentResult[day] = { '5': {}, '4': {} };

    // 当天产出角色天赋升级材料
    const talentMaterialNames = talentMaterialIndex.categories[day];
    talentMaterialNames.map((mat) => {
      const material: CharacterTalentMaterial = JSON.parse(FileUtil.loadFile(`${talentMaterialFolder}/${mat}`, 'plugins'));
      // 需求该材料的角色
      const talentNames = talentIndex.categories[material["2starname"]];
      // 归类
      talentResult[day]['5'][material.region] = [];
      talentResult[day]['4'][material.region] = [];
      talentNames.map((talent) => {
        // 5 星和 4 星角色
        if (talentIndex.categories['5'].includes(talent)) {
          talentResult[day]['5'][material.region].push(talent);
        } else if (talentIndex.categories['4'].includes(talent)) {
          talentResult[day]['4'][material.region].push(talent);
        }
      });
    });
  });

  //#endregion

  //#region 武器突破素材

  // 索引文件
  const weaponsIndex: IndexFile = JSON.parse(FileUtil.loadFile(`${indexFolder}/weapons.json`, 'plugins'));
  const weaponMaterialIndex: IndexFile = JSON.parse(FileUtil.loadFile(`${indexFolder}/weaponmaterials.json`, 'plugins'));
  
  // 处理
  let weaponResult = {};
  days.map((day) => {
    weaponResult[day] = { '5': {}, '4': {} };

    // 当天产出武器升级材料
    const weaponMaterialNames = weaponMaterialIndex.categories[day];
    weaponMaterialNames.map((mat) => {
      const material: WeaponAscensionMaterial = JSON.parse(FileUtil.loadFile(`${weaponMaterialFolder}/${mat}.json`));
      // 需求该材料的武器
      const weaponNames = weaponsIndex.categories[material["2starname"]];
      // 归类
      weaponResult[day]['5'][material.region] = [];
      weaponResult[day]['4'][material.region] = [];
      weaponNames.map((weapon) => {
        // 筛选 5 星和 4 星武器
        if (weaponsIndex.categories['5'].includes(weapon)) {
          weaponResult[day]['5'][material.region].push(weapon);
        } else if (weaponsIndex.categories['4'].includes(weapon)) {
          weaponResult[day]['4'][material.region].push(weapon);
        }
      });
    });
  });

  //#endregion

  let result = {
    talent: talentResult,
    weapon: weaponResult
  }
  console.log('result', result);
}