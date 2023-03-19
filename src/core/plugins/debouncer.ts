type FuncExecInfo = {
  name: string,
  coolDownTime: number,
  lastExecTime: number
};

interface DebouncerInterface {
  /**
   * 从配置文件导入所有数据到redis
   */
  load(): Promise<void>;
  /**
   * 检测插件执行时间是否已经冷却
   * @param name 插件名称
   */
  checkEnabled(name: string): boolean;
  /**
   * 修改插件执行冷却时间
   * @param name 插件名称
   * @param coolDownTime 冷却时间(单位毫秒)
   */
  change(name: string, coolDownTime: number): void;
}

export class Debouncer implements DebouncerInterface {
  private readonly REDIS_KEY_PREFIX: string = 'xybot:debounce:';
  /** 冷却事件，默认500ms */
  private readonly COOL_DOWN_TIME: number = 500;
  private data: Record<string, FuncExecInfo>;

  constructor() {
    this.data = {};
  }

  public async load() {
    //TODO: load from file...?
  }

  public checkEnabled(name: string): boolean {
    let info: FuncExecInfo = this.data[name] ?? {
      name: name,
      coolDownTime: this.COOL_DOWN_TIME,
      lastExecTime: 0
    };

    let execTime = (new Date()).getTime();
    let enabled = (info.coolDownTime + info.lastExecTime) <= execTime;

    // update info
    info.lastExecTime = execTime;
    this.data[name] = info;

    return enabled;
  }

  public change(name: string, coolDownTime: number): void {
    let info: FuncExecInfo = this.data[name] ?? {
      name: name,
      coolDownTime: this.COOL_DOWN_TIME,
      lastExecTime: 0
    };

    info.coolDownTime = coolDownTime > 0 ? coolDownTime : 0;
    this.data[name] = info;
  }

  private getKey(name: string) {
    return `${this.REDIS_KEY_PREFIX}${name}`;
  }

  // TODO: save to file...?
}

export default new Debouncer();