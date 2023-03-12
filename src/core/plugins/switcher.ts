import groupConfig from "../config/groupConfig";

type GroupFuncInfo = {
  list: string[],
  index: number
};

interface SwitcherInterface {
  /**
   * 从配置文件导入所有数据到redis
   */
  load(): Promise<void>;
  /**
   * 改变群插件激活状态
   * @param groupId 群Id
   * @param name 插件名称
   * @param enable 是否激活
   */
  change(groupId: string, name: string, enable: boolean): Promise<void>;
  /**
   * 监测收到事件的群是否开启插件
   * @param groupId 群Id
   * @param name 插件名称
   */
  checkEnable(groupId: string, name: string): Promise<boolean>
}

export class Switcher implements SwitcherInterface {
  private REDIS_KEY_PREFIX: string = 'xybot:group:';

  constructor() {

  }

  public async load() {
    const groupData = groupConfig.getAll();
    for (let groupId in groupData) {
      await global.redis.setString(this.getKey(groupId), JSON.stringify(groupData[groupId]));
    }
  }

  public async change(groupId: string, name: string, enable: boolean) {
    let hasChange = false;

    const { list, index } = await this.getGroupFunc(groupId, name)
    if (enable) {
      if (index == -1) {
        list.push(name);
        hasChange = true;
      }
    } else {
      if (index > -1) {
        list.splice(index, 1);
        hasChange = true;
      }
    }

    if (hasChange) {
      groupConfig.setFunction(groupId, list);
    }
  }

  public async checkEnable(groupId: string, name: string): Promise<boolean> {
    const { index } = await this.getGroupFunc(groupId, name);
    return index > -1;
  }

  private getKey(groupId: string) {
    return `${this.REDIS_KEY_PREFIX}${groupId}`;
  }

  private async getGroupFunc(groupId: string, name: string): Promise<GroupFuncInfo> {
    let key = this.getKey(groupId);
    let data = await global.redis.getString(key);
    let list: string[] = JSON.parse(data) || [];
    return { list, index: list.indexOf(name) };
  }
}

export default new Switcher()