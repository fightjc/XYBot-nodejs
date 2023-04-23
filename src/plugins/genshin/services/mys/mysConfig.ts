import FileUtil from '../../../../utils/file'

type MysConfigData = {
  uid: string,
  region: string,
  deviceId: string,
  cookie: string
};

interface MysConfigInterface {
  /** 获取所有米游社账号缓存信息 */
  getAll(): { [key: string]: MysConfigData } | {};
  /**
   * 获取用户米游社账号缓存信息
   * @param userId qq
   */
  getConfig(userId: string): MysConfigData | null;
  /**
   * 更新用户米游社账号缓存信息 
   * @param userId qq
   * @param config 配置信息
   */
  setConfig(userId: string, config: MysConfigData): void;
}

export class MysConfig implements MysConfigInterface {
  private readonly filePath: string = 'genshin/config/mys.yml';

  constructor() {
    // 若文件不存在则创建文件
    if (!FileUtil.isExist(FileUtil.getFilePath(this.filePath, 'plugins'))) {
      global.logger.info(`检测到配置文件 ${this.filePath} 不存在，准备创建`);

      FileUtil.createDir('bilibili/config', 'plugins');
      FileUtil.writeYAML(this.filePath, {}, 'plugins');
    }
  }

  public getAll(): { [key: string]: MysConfigData } | {} {
    let data = FileUtil.loadYAML(this.filePath, 'plugins') ?? {};
    return data;
  }

  public getConfig(userId: string): MysConfigData | null {
    let data = FileUtil.loadYAML(this.filePath, 'plugins') ?? {};
    return data[userId];
  }

  public setConfig(userId: string, config: MysConfigData) {
    let data = FileUtil.loadYAML(this.filePath, 'plugins') ?? {};
    data[userId] = config;

    FileUtil.writeYAML(this.filePath, data, 'plugins');
  }
}

export default new MysConfig()