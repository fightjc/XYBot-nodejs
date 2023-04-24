import FileUtil from '../../utils/file';

type BotData = {
  number: number,
  password: string,
  master: number,
  platform: 1 | 2 | 3 | 4 | 5,
  log_level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'mark' | 'off',
  ignore_self: boolean,
  resend: boolean,
  data_dir?: string
};

export class BotConfig {
  public readonly number: number;
  public readonly password: string;
  public readonly master: number;
  /** 1:安卓手机(默认) 2:aPad 3:安卓手表 4:MacOS 5:iPad */
  public readonly platform: 1 | 2 | 3 | 4 | 5;
  /** 日志等级，默认info (打印日志会降低性能，若消息量巨大建议修改此参数) */
  public readonly log_level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'mark' | 'off';
  /** 群聊和频道中过滤自己的消息(默认true) */
  public readonly ignore_self: boolean;
  /** 被风控时是否尝试用分片发送，默认true */
  public readonly resend: boolean;
  /** 数据存储文件夹，需要可写权限，默认主模块下的data文件夹 */
  public readonly data_dir: string;

  private readonly filename: string = 'bot.yml';

  constructor() {
    // 若文件不存在则创建文件
    if (!FileUtil.isExist(FileUtil.getFilePath(this.filename, 'config'))) {
      if (global.logger) {
        global.logger.info(`检测到配置文件 ${this.filename} 不存在，准备创建`);
      } else {
        console.log(`检测到配置文件 ${this.filename} 不存在，准备创建`);
      }

      let data: BotData = {
        number: 0,
        password: '',
        master: 0,
        platform: 5,
        log_level: 'info',
        ignore_self: true,
        resend: false
      };
      FileUtil.createDir('config');
      FileUtil.writeYAML(this.filename, data);

      if (global.logger) {
        global.logger.info(`请修改配置文件 ${this.filename} 后再次运行程序`);
      } else {
        console.log(`请修改配置文件 ${this.filename} 后再次运行程序`);
      }
      process.exit();
    }

    const settings: BotData = FileUtil.loadYAML(this.filename);

    this.number = settings.number;
    this.password = settings.password;
    this.master = settings.master;
    this.platform = settings.platform ?? 5;
    this.log_level = settings.log_level ?? 'info';
    this.ignore_self = settings.ignore_self ?? true;
    this.resend = settings.resend ?? false;
    
    this.data_dir = FileUtil.getFilePath('data');
  }
}

export default new BotConfig()