// declare module 'genshin' {}
export type DayType = '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日';
export type RegionType = '蒙德' | '璃月' | '稻妻' | '须弥';
export type ConcernRarity = '5' | '4';

export interface AscensionCost {
  id: number,
  name: string,
  count: number
}

export interface TalentPassive {
  name: string,
  info: string
}

export interface TalentCombat extends TalentPassive {
  description?: string
  attributes: {
    labels: string[]
  }
}

export interface Character {
  id: number,
  name: string,
  title: string,
  description: string,
  weaponText: string,
  gender: string,
  rarity: number,
  birthday: string,
  elementText: string,
  region: string,
  substatText: string,
  constellation: string,
  costs: {
    [key: string]: AscensionCost
  }
}

export interface Talent {
  name: string,
  combat1: TalentCombat,
  combat2: TalentCombat,
  combat3: TalentCombat,
  combatsp?: TalentCombat,
  passive1: TalentPassive,
  passive2: TalentPassive,
  passive3: TalentPassive,
  passive4?: TalentPassive,
  costs: {
    [key: string]: AscensionCost[]
  }
}

export interface Weapon {
  id: number,
  name: string,
  description: string,
  weaponText: string,
  rarity: number,
  story: string,
  baseAtkValue: number,
  baseStatText: string,
  mainStatText: string,
  effectName: string,
  effectTemplateRaw: string,
  costs: {
    [key: string]: AscensionCost[]
  }
}

export interface CharacterTalentMaterial {
  name: string,
  '2starname': string,
  '3starname': string,
  '4starname': string,
  day: DayType[],
  location: string,
  region: string,
  domainofmastery: string
}

export interface WeaponAscensionMaterial {
  name: string,
  '2starname': string,
  '3starname': string,
  '4starname': string,
  '5starname': string,
  day: DayType[],
  location: string,
  region: string,
  domainofmastery: string
}

export interface IndexFile {
  names: { [key: string]: string },
  namemap: { [key: string]: string },
  aliases?: { [key: string]: string },
  categories: { [key: string]: string[] }
}