import groupConfig from "../config/groupConfig";

type GroupFuncInfo = {
  list: string[],
  index: number
};

interface SwitcherInterface {
  /**
   * 从配置文件导入所有数据到redis
   * @param list 插件名称列表
   */
  load(list: string[]): Promise<void>;
  /**
   * 是否匹配开关插件命令，若是则处理并返回true
   * @param event 事件
   */
  handle(event: any): Promise<boolean>;
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

  public pluginNameList: string[];

  constructor() {
    this.pluginNameList = [];
  }

  public async load(list: string[]) {
    this.pluginNameList = list;

    const groupData = groupConfig.getAll();
    for (let groupId in groupData) {
      await global.redis.setString(this.getKey(groupId), JSON.stringify(groupData[groupId]));
    }
  }

  public async handle(event: any): Promise<boolean> {
    if (event.post_type == 'message') {
      return false;
    }

    if (!new RegExp(this.SWITCH_REG).test(event.raw_message)) {
      return false;
    }

    if (event.message_type == 'group') {
      //TODO: 判断命令人权限
      if (event.user_id != global.config.master) {
        return false;
      }

      // 群插件
      let args = event.raw_message.split(' ').filter(e => e);
      if (args.length < 2) {
        global.bot.sendGroupMsg(event.group_id, '使用方式：开关 [列表] [开启/关闭 组件名]');
      }

      if (args[1] == '列表') {
        await this.handleList(event.group_id);
      } else if (args[1] == '开启' || args[1] == '关闭') {
        let on: boolean = args[1] == '开启' ? true :  false;

        if (this.pluginNameList.indexOf(args[2]) > -1) {
          await this.change(event.group_id, args[2], on);
          global.bot.sendGroupMsg(event.group_id, `[${args[2]}] ${on ? '已开启' : '已关闭'}`);
        } else {
          global.bot.sendGroupMsg(event.group_id, `[${args[2]}] 功能不存在。请使用命令 '开关 列表' 查询所有已加载插件`);
        }
      }
      return true;
    }

    return false;
  }

  public async checkEnabled(groupId: string, name: string): Promise<boolean> {
    //TODO: private message with groupId != null

    const { index } = await this.getGroupFunc(groupId, name);
    return index > -1;
  }

  /**
   * 改变群插件激活状态
   * @param groupId 群Id
   * @param name 插件名称
   * @param enable 是否激活
   */

  private async change(groupId: string, name: string, enable: boolean) {
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

  /**
   * 打印群插件列表开关状态
   * @param groupId 群Id
   */
  private async handleList(groupId: string) {
    const { list, index } = await this.getGroupFunc(groupId, '');

    let msg = '当前组件有：\n';
    this.pluginNameList.forEach(name => {
        msg += `${name} ${list[name] ? '开启中' : '未开启'}\n`;
    });
    global.bot.sendGroupMsg(groupId, msg);
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