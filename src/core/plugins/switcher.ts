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
   * 是否匹配开关插件
   * @param event 事件
   */
  matchReg(event: any): boolean;
  /**
   * 改变群插件激活状态
   * @param groupId 群Id
   * @param name 插件名称
   * @param enable 是否激活
   */
  change(groupId: string, name: string, enable: boolean): Promise<void>;
  /**
   * 检测收到事件的群是否开启插件
   * @param groupId 群Id
   * @param name 插件名称
   */
  checkEnabled(groupId: string, name: string): Promise<boolean>;
}

export class Switcher implements SwitcherInterface {
  private readonly REDIS_KEY_PREFIX: string = 'xybot:switcher:';
  private readonly SWITCH_REG = '^开关\\s+\\w+';

  constructor() {}

  public matchReg(event: any): boolean {
    if (event.post_type == 'message') {
      return false;
    }

    if (!new RegExp(this.SWITCH_REG).test(event.raw_message)) {
      return false;
    }

    if (event.message_type == 'group') {
      // 群插件
      let msg = event.raw_message;
    }

    return false;
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

  public async checkEnabled(groupId: string, name: string): Promise<boolean> {
    //TODO: private message with groupId != null

    const { index } = await this.getGroupFunc(groupId, name);
    return index > -1;
  }

  private getKey(groupId: string): string {
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