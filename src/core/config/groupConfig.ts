import FileUtil from '../../utils/file'

type GroupData = {
  [key: string]: string[]
}

interface GroupConfigInterface {
  /**
   * 获取所有预设
   */
  getAll(): GroupData;
  /**
   * 设置所有预设
   * @param data 群激活插件数据
   */
  setAll(data: GroupData): void;
  /**
   * 获取指定群激活插件
   * @param groupId 群Id
   */
  getFunctions(groupId: number): string[];
  /**
   * 设置指定群激活插件
   * @param groupId 群Id
   * @param name 插件名
   */
  setFunction(groupId: number, name: string | string[]): void;
}

export class GroupConfig implements GroupConfigInterface {
  private readonly filename: string = 'group';

  constructor() {
    // 若文件不存在则创建文件
    if (!FileUtil.isExist(FileUtil.getFilePath(`${this.filename}.yml`, 'config'))) {
      if (global.logger) {
        global.logger.info(`检测到配置文件 ${this.filename}.yml 不存在，准备创建`);
      } else {
        console.log(`检测到配置文件 ${this.filename}.yml 不存在，准备创建`);
      }

      FileUtil.createDir('config');
      FileUtil.writeYAML(this.filename, '');
    }
  }

  public getAll(): GroupData {
    const settings: GroupData = FileUtil.loadYAML(this.filename);
    return settings;
  }

  public setAll(data: GroupData): void {
    FileUtil.writeYAML(this.filename, data);
  }

  public getFunctions(groupId: number): string[] {
    const settings: GroupData = FileUtil.loadYAML(this.filename);
    return settings[`${groupId}`] ?? [];
  }

  public setFunction(groupId: number, name: string | string[]): void {
    let settings: GroupData = FileUtil.loadYAML(this.filename);
    let enabled: string[] = Array.isArray(name) ? name : [name];
    settings[`${groupId}`] = enabled;
    FileUtil.writeYAML(this.filename, settings);
  }
}

export default new GroupConfig()