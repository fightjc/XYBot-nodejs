type RuleData = {
  /** 命令正则 */
  reg: string,
  /** 执行方法的方法名 */
  func: string,
  /** 响应权限 */
  permission?: 'master' | 'admin' | 'friend' | 'everyone'
};

type PluginData = {
  /** 插件名称 */
  name: string,
  /** 插件描述 */
  desc: string,
  /** 监听事件 */
  event: string,
  /** 匹配规则 */
  rules?: RuleData[]
};

interface BasePluginInterface {
  /**
   * 初始化
   */
  init(): void;
  /**
   * 判断是否有权限响应事件
   * @param event 收到的事件
   * @param rule 匹配规则
   */
  checkPermission(event: any, rule: RuleData): boolean;
}

export default class BasePlugin implements BasePluginInterface {
  public readonly name: string;
  public readonly desc: string;
  public readonly event: string;
  public readonly rules: RuleData[];

  constructor(data: PluginData) {
    this.name = data.name;
    this.desc = data.desc;
    this.event = data.event || "message";
    this.rules = data.rules || [];
  }

  public init(): void {
  }

  public checkPermission(event: any, rule: RuleData): boolean {
    if (rule.permission || rule.permission == 'everyone') {
      return true;
    }

    if (rule.permission == 'master' && event.user_id == global.config.master) {
      return true;
    }

    if (rule.permission == 'admin') {
      let sender = event['sender'];
      if (sender && sender['role'] == 'owner') {
        return true;
      }
    }

    return false;
  }
}