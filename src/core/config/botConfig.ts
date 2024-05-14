import FileUtil from '../../utils/file';

type BotData = {
  number: number,
  password: string,
  master: number,

  // 1:安卓手机(默认) 2:aPad 3:安卓手表 4:MacOS 5:iad 6:Tim
  platform: 1 | 2 | 3 | 4 | 5 | 6,
  // 日志等级，默认info (打印日志会降低性能，若消息量巨大建议修改此参数)
  log_level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'mark' | 'off',
  // 群聊和频道中过滤自己的消息(默认true)
  ignore_self: boolean,
  // 被风控时是否尝试用分片发送，默认true
  resend: boolean,
  // 数据存储文件夹，需要可写权限，默认主模块下的data文件夹
  data_dir?: string
};

export class BotConfig {
  public readonly data: BotData;

  private readonly filename: string = 'bot.yml';

  constructor() {
    // 若文件不存在则创建文件
    if (!FileUtil.isExist(FileUtil.getFilePath(this.filename, 'config'))) {
      if (global.logger) {
        global.logger.info(`检测到配置文件 ${this.filename} 不存在，准备创建`);
      } else {
        console.log(`检测到配置文件 ${this.filename} 不存在，准备创建`);
      }

      let tempData: BotData = {
        number: 0,
        password: '',
        master: 0,
        platform: 6,
        log_level: 'info',
        ignore_self: true,
        resend: false
      };
      FileUtil.createDir('config');
      FileUtil.writeYAML(this.filename, tempData);

      if (global.logger) {
        global.logger.info(`请修改配置文件 ${this.filename} 后再次运行程序`);
      } else {
        console.log(`请修改配置文件 ${this.filename} 后再次运行程序`);
      }
      process.exit();
    }

    const settings: BotData = FileUtil.loadYAML(this.filename);
    this.data = {
      number: settings.number,
      password: settings.password,
      master: settings.master,
      platform: settings.platform ?? 5,
      log_level: settings.log_level ?? 'info',
      ignore_self: settings.ignore_self ?? true,
      resend: settings.resend ?? false,
      data_dir: FileUtil.getFilePath('data')
    };
  }
}

export default new BotConfig()