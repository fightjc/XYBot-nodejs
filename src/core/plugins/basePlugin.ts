type RuleData = {
  /** 命令正则 */
  reg: string,
  /** 执行方法的方法名 */
  func: string,
  /** 响应权限 */
  permission?: 'master' | 'admin' | 'friend' | 'everyone'
};

type TaskData = {
  /** cron 表达式 */
  cron: string,
  /** 执行方法的方法名 */
  func: string
};

type PluginData = {
  /** 插件名称 */
  name: string,
  /** 插件描述 */
  desc: string,
  /** 监听事件 */
  event: string,
  /** 插件冷却时间，单位毫秒 */
  coolDownTime: number,
  /** 匹配规则 */
  rules?: RuleData[],
  /** 定时任务 */
  tasks?: TaskData[]
};

interface BasePluginInterface {
  /**
   * 初始化
   */
   init(): Promise<void>;
  /**
   * 判断是否有权限响应事件
   * @param event 收到的事件
   * @param rule 匹配规则
   */
  checkPermission(event: any, rule: RuleData): boolean;
}

export default class BasePlugin implements BasePluginInterface {
  public readonly data: PluginData;

  constructor(data: PluginData) {
    this.data = {
      name: data.name,
      desc: data.desc,
      event: data.event ?? 'message',
      coolDownTime: data.coolDownTime ?? 500,
      rules: data.rules ?? [],
      tasks: data.tasks ?? []
    };
  }

  public async init(): Promise<void> {}

  public checkPermission(event: any, rule: RuleData): boolean {
    if (!rule.permission || rule.permission == 'everyone') {
      return true;
    }

    let sender = event['sender'];
    if (sender) {
      if (sender.user_id == global.config.master) {
        // 所有命令默认对主人QQ开放
        return true;
      }

      if (rule.permission == 'admin' && [ 'owner', 'admin' ].includes(sender['role'])) {
        return true;
      }
    }

    return false;
  }
}