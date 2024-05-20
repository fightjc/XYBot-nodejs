import groupConfig from "../config/groupConfig";

interface SwitcherInterface {
  /**
   * 从配置文件导入所有数据到redis
   * @param list 插件名称列表
   */
  load(list: string[]): Promise<void>;
  /**
   * 新增插件
   * @param name 插件名称
   */
  addPlugin(name: string): void;
  /**
   * 删除插件
   * @param name 插件名称
   */
  deletePlugin(name: string): void;
  /**
   * 是否匹配开关插件命令，若是则处理并返回true
   * @param event 事件
   */
  handle(event: any): Promise<boolean>;
  /**
   * 检测群是否开启插件
   * @param groupId 群Id
   * @param name 插件名称
   */
  checkGroupEnabled(groupId: number, name: string): Promise<boolean>;
  /**
   * 检测人是否开启插件
   * @param userId 用户Id
   * @param name 插件名称
   */
  checkPrivateEnabled(userId: number, name: string): Promise<boolean>;
}

export class Switcher implements SwitcherInterface {
  private readonly REDIS_KEY_PREFIX: string = 'xybot:switcher:';
  private readonly SWITCH_REG = '^开关\\s+\\S+';

  public pluginNameList: string[] = [];

  constructor() {}

  public async load(list: string[]) {
    this.pluginNameList = list;

    // 加载文件配置
    const groupData = groupConfig.getAll();
    for (let groupId in groupData) {
      await this.setGroupFunc(Number(groupId), groupData[groupId]);
    }
  }

  public addPlugin(name: string) {
    var index = this.pluginNameList.indexOf(name);
    if (index == -1) {
      this.pluginNameList.push(name);
    }
  }

  public deletePlugin(name: string) {
    var index = this.pluginNameList.indexOf(name);
    if (index > -1) {
      this.pluginNameList.splice(index, 1);
    }
  }

  public async handle(event: any): Promise<boolean> {
    if (event.post_type != 'message') {
      return false;
    }

    if (!new RegExp(this.SWITCH_REG).test(event.raw_message)) {
      return false;
    }

    //TODO: handle private switch...

    // 群插件开关
    if (event.message_type == 'group') {
      // 判断命令人权限
      if (event.sender.user_id != global.config.data.master && !['owner', 'admin'].includes(event.sender.role)) {
        return false;
      }

      // 判断参数数量
      let args = event.raw_message.split(' ').filter((e: string) => e);
      if (args.length < 2) {
        await global.bot.sendGroupMsg(event.group_id, '使用方式：开关 [列表] [开启/关闭 组件名]');
      }

      // 解析
      if (args[1] == '列表') {
        await this.handleList(event.group_id);
      } else if (args[1] == '开启' || args[1] == '关闭') {
        let on: boolean = args[1] == '开启' ? true :  false;

        if (this.pluginNameList.includes(args[2])) {
          await this.change(event.group_id, args[2], on);
          await global.bot.sendGroupMsg(event.group_id, `[${args[2]}] ${on ? '已开启' : '已关闭'}`);
        } else {
          await global.bot.sendGroupMsg(event.group_id, `[${args[2]}] 功能不存在。请使用命令 '开关 列表' 查询所有已加载插件`);
        }
      } else {
        // 一级菜单错误
        await global.bot.sendGroupMsg(event.group_id, '使用方式：开关 [列表] [开启/关闭 组件名]');
      }
      return true;
    }

    return false;
  }

  public async checkGroupEnabled(groupId: number, name: string): Promise<boolean> {
    const list = await this.getGroupFunc(groupId);
    return list.includes(name);
  }

  public async checkPrivateEnabled(userId: number, name: string): Promise<boolean> {
    // TODO: plugins for private
    return false;
  }

  /**
   * 改变群插件激活状态
   * @param groupId 群Id
   * @param name 插件名称
   * @param enable 是否激活
   */
  private async change(groupId: number, name: string, enable: boolean) {
    let hasChange = false;

    const list = await this.getGroupFunc(groupId);
    let index = list.indexOf(name);
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
      await this.setGroupFunc(groupId, list);
      groupConfig.setFunction(groupId, list);
    }
  }

  /**
   * 打印群插件列表开关状态
   * @param groupId 群Id
   */
  private async handleList(groupId: number) {
    const list = await this.getGroupFunc(groupId);

    let msg = '当前组件有:';
    this.pluginNameList.forEach(name => {
        msg += `\n${name} ${list.includes(name) ? '开启中' : '未开启'}`;
    });
    await global.bot.sendGroupMsg(groupId, msg);
  }

  private getKey(groupId: number): string {
    return `${this.REDIS_KEY_PREFIX}${groupId}`;
  }

  private async getGroupFunc(groupId: number): Promise<string[]> {
    let key = this.getKey(groupId);
    let data: string = await global.redis.getString(key) || '[]';
    try {
      let list: string[] = JSON.parse(data);
      return list;
    } catch(e) {
      global.logger.error(`解析redis[key:'${key}']JSON值失败`, e);
      return [];
    }
  }

  private async setGroupFunc(groupId: number, list: string[]): Promise<void> {
    let key = this.getKey(groupId);
    let data: string = JSON.stringify(list) || `'[]'`;
    await global.redis.setString(key, data);
  }
}

export default new Switcher()