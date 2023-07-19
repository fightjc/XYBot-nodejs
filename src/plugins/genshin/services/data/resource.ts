import {
  Character,
  Talent,
  CharacterTalentMaterial,
  Weapon,
  WeaponAscensionMaterial,
  IndexFile
} from '../types/data';
import FileUtil from '../../../../utils/file';

const dataFolder = 'genshin/resources/data';
const indexFolder = 'genshin/resources/index';
const imageFolder = 'genshin/resources/images';

/** 检查资源文件是否完整 */
export function checkedAllResources(): { success: boolean, info: string} {
  let result = '';

  // 检查角色
  let characters = FileUtil.getDirFiles(`${dataFolder}/characters`, 'plugins');
  characters.map((character) => {
    let name = character.split('.')[0];

    // 角色天赋文件
    let talentPath = `${dataFolder}/talents/${name}.json`;
    let isExistTalent = FileUtil.isExist(FileUtil.getFilePath(talentPath, 'plugins'));
    if (!isExistTalent) {
      result += `${talentPath} 文件不存在\n`;
    }

    // 角色图片文件
    let imagePath = `${imageFolder}/characters/${name}.png`;
    let isExistImage = FileUtil.isExist(FileUtil.getFilePath(imagePath, 'plugins'));
    if (!isExistImage) {
      result += `${imagePath} 文件不存在\n`;
    }
  });

  // 武器
  let weapons = FileUtil.getDirFiles(`${dataFolder}/weapons`, 'plugins');
  weapons.map((weapon) => {
    let name = weapon.split('.')[0];

    // 武器图片文件
    let imagePath = `${imageFolder}/weapons/${name}.png`;
    let isExistImage = FileUtil.isExist(FileUtil.getFilePath(imagePath, 'plugins'));
    if (!isExistImage) {
      result += `${imagePath} 文件不存在\n`;
    }
  });

  return { success: !result, info: result };
}

/** 生成所有索引文件 */
export function generateAllIndexes() {
  // 角色天赋素材
  generateCharacterTalentMaterialIndex();
  // 武器突破素材
  generateWeaponAscensionMaterialIndex();
  // 角色
  generateCharacterIndex();
  // 角色天赋
  generateCharacterTalentIndex();
  // 武器
  generateWeaponIndex();
}

/** 生成角色天赋素材索引文件 */
export function generateCharacterTalentMaterialIndex() {
  const folder = `${dataFolder}/talentmaterials`;
  const indexFilename = 'talentmaterials.json';
  let indexData: IndexFile = {
    names: {},
    namemap: {},
    categories: {}
  };

  const fileList = FileUtil.getDirFiles(folder, 'plugins');
  fileList.map((filename) => {
    const name = filename.split('.')[0];
    const data: CharacterTalentMaterial = JSON.parse(FileUtil.loadFile(`${folder}/${filename}`, 'plugins'));
    if (data) {
      // 名称映射
      indexData.namemap[name] = data.name;
      indexData.names[data.name] = name;
      // 日期分类
      data.day.map((day) => {
        indexData.categories[day]
            ? indexData.categories[day].push(name)
            : indexData.categories[day] = [name];
      });
      // 国家分类
      indexData.categories[data.region]
          ? indexData.categories[data.region].push(name)
          : indexData.categories[data.region] = [name];
    }
  });
  
  FileUtil.writeFile(`${indexFolder}/${indexFilename}`, JSON.stringify(indexData), 'plugins');
}

/** 生成武器突破素材索引文件 */
export function generateWeaponAscensionMaterialIndex() {
  const folder = `${dataFolder}/weaponmaterials`;
  const indexFilename = 'weaponmaterials.json';
  let indexData: IndexFile = {
    names: {},
    namemap: {},
    categories: {}
  };

  const fileList = FileUtil.getDirFiles(folder, 'plugins');
  fileList.map((filename) => {
    const name = filename.split('.')[0];
    const data: WeaponAscensionMaterial = JSON.parse(FileUtil.loadFile(`${folder}/${filename}`, 'plugins'));
    if (data) {
      // 名称映射
      indexData.namemap[name] = data.name;
      indexData.names[data.name] = name;
      // 日期分类
      data.day.map((day) => {
        indexData.categories[day]
            ? indexData.categories[day].push(name)
            : indexData.categories[day] = [name];
      });
      // 国家分类
      indexData.categories[data.region]
          ? indexData.categories[data.region].push(name)
          : indexData.categories[data.region] = [name];
    }
  });
  
  FileUtil.writeFile(`${indexFolder}/${indexFilename}`, JSON.stringify(indexData), 'plugins');
}

/** 生成角色索引文件 */
export function generateCharacterIndex() {
  const folder = `${dataFolder}/characters`;
  const indexFilename = 'characters.json';
  let indexData: IndexFile = {
    names: {},
    namemap: {},
    categories: {}
  };

  const fileList = FileUtil.getDirFiles(folder, 'plugins');
  fileList.map((filename) => {
    const name = filename.split('.')[0];
    const data: Character = JSON.parse(FileUtil.loadFile(`${folder}/${filename}`, 'plugins'));
    if (data) {
      // 名称映射
      indexData.namemap[name] = data.name;
      indexData.names[data.name] = name;
      // 星级分类
      indexData.categories[data.rarity]
          ? indexData.categories[data.rarity].push(name)
          : indexData.categories[data.rarity] = [name];

    }
  });

  FileUtil.writeFile(`${indexFolder}/${indexFilename}`, JSON.stringify(indexData), 'plugins');
}

/** 生成角色天赋索引文件 */
export function generateCharacterTalentIndex() {
  const folder = `${dataFolder}/talents`;
  const indexFilename = 'talents.json';
  let indexData: IndexFile = {
    names: {},
    namemap: {},
    categories: {}
  };

  const fileList = FileUtil.getDirFiles(folder, 'plugins');
  fileList.map((filename) => {
    const name = filename.split('.')[0];
    const data: Talent = JSON.parse(FileUtil.loadFile(`${folder}/${filename}`, 'plugins'));
    if (data) {
      // 名称映射
      indexData.namemap[name] = data.name;
      indexData.names[data.name] = name;
      // 角色天赋升级材料
      for (let level in data.costs) {
        let list = data.costs[level];
        list.map((cost) => {
          indexData.categories[cost.name]
              ? indexData.categories[cost.name].push(name)
              : indexData.categories[cost.name] = [name];
        });
      }
    }
  });

  // 去重
  for (let key in indexData.categories) {
    indexData.categories[key] = [...new Set(indexData.categories[key])];
  }

  FileUtil.writeFile(`${indexFolder}/${indexFilename}`, JSON.stringify(indexData), 'plugins');
}

/** 生成武器索引文件 */
export function generateWeaponIndex() {
  const folder = `${dataFolder}/weapons`;
  const indexFilename = 'weapons.json';
  let indexData: IndexFile = {
    names: {},
    namemap: {},
    categories: {}
  };

  const fileList = FileUtil.getDirFiles(folder, 'plugins');
  fileList.map((filename) => {
    const name = filename.split('.')[0];
    const data: Weapon = JSON.parse(FileUtil.loadFile(`${folder}/${filename}`, 'plugins'));
    if (data) {
      // 名称映射
      indexData.namemap[name] = data.name;
      indexData.names[data.name] = name;
      // 星级分类
      indexData.categories[data.rarity]
          ? indexData.categories[data.rarity].push(name)
          : indexData.categories[data.rarity] = [name];
      // 武器升级材料
      for (let ascend in data.costs) {
        let list = data.costs[ascend];
        list.map((cost) => {
          indexData.categories[cost.name]
              ? indexData.categories[cost.name].push(name)
              : indexData.categories[cost.name] = [name];
        });
      }
    }
  });

  // 去重
  for (let key in indexData.categories) {
    indexData.categories[key] = [...new Set(indexData.categories[key])];
  }

  FileUtil.writeFile(`${indexFolder}/${indexFilename}`, JSON.stringify(indexData), 'plugins');
}