import template from 'art-template';

import {
  IndexFile,
  DayType,
  CharacterTalentMaterial, WeaponAscensionMaterial
} from '../types/data';
import FileUtil from '../../../../utils/file';
import renderer from '../../../../utils/renderer';

const indexFolder = 'genshin/resources/index';
const dataFolder = 'genshin/resources/data';
const talentMaterialFolder = `${dataFolder}/talentmaterials`;
const weaponMaterialFolder = `${dataFolder}/weaponmaterials`;

/** 更新每日素材图片 */
export async function updateDailyMaterial() {
  // 基础分类
  const categories = JSON.parse(FileUtil.loadFile(`${indexFolder}/categories.json`, 'plugins'));
  const days: DayType[] = categories['day'] ?? [];
  const regions: string[] = categories['region'] ?? [];

  let talentResult = {};
  let weaponResult = {};

  //#region 角色天赋素材

  // 索引文件
  const characterIndex: IndexFile = JSON.parse(FileUtil.loadFile(`${indexFolder}/characters.json`, 'plugins'));
  const talentIndex: IndexFile = JSON.parse(FileUtil.loadFile(`${indexFolder}/talents.json`, 'plugins'));
  const talentMaterialIndex: IndexFile = JSON.parse(FileUtil.loadFile(`${indexFolder}/talentmaterials.json`, 'plugins'));

  // 处理
  days.map((day) => {
    talentResult[day] = { '5': {}, '4': {} };

    // 当天产出角色天赋升级材料
    const talentMaterialNames = talentMaterialIndex.categories[day];
    talentMaterialNames.map((mat) => {
      const material: CharacterTalentMaterial = JSON.parse(FileUtil.loadFile(`${talentMaterialFolder}/${mat}.json`, 'plugins'));
      // 需求该材料的角色
      const talentNames = talentIndex.categories[material["2starname"]];
      // 归类
      talentResult[day]['5'][material.region] = [];
      talentResult[day]['4'][material.region] = [];
      talentNames.map((talent) => {
        // 5 星和 4 星角色
        if (characterIndex.categories['5'].includes(talent)) {
          talentResult[day]['5'][material.region].push({
            name: characterIndex.namemap[talent],
            fileName: talent,
            rarity: talent == 'aloy' ? '5a' : '5'
          });
        } else if (characterIndex.categories['4'].includes(talent)) {
          talentResult[day]['4'][material.region].push({
            name: characterIndex.namemap[talent],
            fileName: talent,
            rarity: '4'
          });
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
  days.map((day) => {
    weaponResult[day] = { '5': {}, '4': {} };

    // 当天产出武器升级材料
    const weaponMaterialNames = weaponMaterialIndex.categories[day];
    weaponMaterialNames.map((mat) => {
      const material: WeaponAscensionMaterial = JSON.parse(FileUtil.loadFile(`${weaponMaterialFolder}/${mat}.json`, 'plugins'));
      // 需求该材料的武器
      const weaponNames = weaponsIndex.categories[material["2starname"]];
      // 归类
      weaponResult[day]['5'][material.region] = [];
      weaponResult[day]['4'][material.region] = [];
      weaponNames.map((weapon) => {
        // 筛选 5 星和 4 星武器
        if (weaponsIndex.categories['5'].includes(weapon)) {
          weaponResult[day]['5'][material.region].push({
            name: weaponsIndex.namemap[weapon],
            fileName: weapon,
            rarity: '5'
          });
        } else if (weaponsIndex.categories['4'].includes(weapon)) {
          weaponResult[day]['4'][material.region].push({
            name: weaponsIndex.namemap[weapon],
            fileName: weapon,
            rarity: '4'
          });
        }
      });
    });
  });

  //#endregion

  // 整合
  let result = {};
  days.map((date) => {
    if (date == "周日") {
      return;
    }

    // 天赋材料按国家分类，星级排序
    let talents = {};
    regions.map((region) => {
      let five = talentResult[date]['5'][region].sort((i, j) => {
        if (i.fileName > j.fileName) return 1;
        if (i.fileName < j.fileName) return -1;
        return 0;
      });
      let four = talentResult[date]['4'][region].sort((i, j) => {
        if (i.fileName > j.fileName) return 1;
        if (i.fileName < j.fileName) return -1;
        return 0;
      });
      talents[region] = [ ...five, ...four];
    });

    // 武器材料按国家分类，星级排序
    let weapons = {};
    regions.map((region) => {
      let five = weaponResult[date]['5'][region].sort((i, j) => {
        if (i.fileName > j.fileName) return 1;
        if (i.fileName < j.fileName) return -1;
        return 0;
      });
      let four = weaponResult[date]['4'][region].sort((i, j) => {
        if (i.fileName > j.fileName) return 1;
        if (i.fileName < j.fileName) return -1;
        return 0;
      });
      weapons[region] = [ ...five, ...four];
    });

    result[date] = { date, regions, talents, weapons };
  });

  // 生成图片
  FileUtil.createDir('genshin/resources/images/dailyMaterial', 'plugins');
  for (let date in result) {
    await generateDailyMaterialImage(result[date]);
  }
}

/** 绘制每日素材图片 */
async function generateDailyMaterialImage(data) {
  // data to html
  const templatePath = `genshin/resources/template/dailyMaterial.art`;
  let templateData = FileUtil.loadFile(templatePath, 'plugins');
  let html = template.render(templateData, data);

  // html to image
  const resultPath = `genshin/resources/template/${data.date}.html`;
  FileUtil.writeFile(resultPath, html, 'plugins');
  let path = `file://${FileUtil.getFilePath(resultPath, 'plugins')}`;

  const resultImagePath = `genshin/resources/images/dailyMaterial/${data.date}.jpeg`;
  await renderer.screenshot(path, '#canvas', FileUtil.getFilePath(resultImagePath, 'plugins'));

  // delete temp file
  FileUtil.deleteFile(resultPath, 'plugins');
}