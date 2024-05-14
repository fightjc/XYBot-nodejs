import log4js from 'log4js'
import FileUtil from '../../utils/file'

interface LoggerInterface {
  mark(message: any, ...args: any[]): void;
  debug(message: any, ...args: any[]): void;
  info(message: any, ...args: any[]): void;
  error(message: any, ...args: any[]): void;
}

export class Logger implements LoggerInterface {
  private defaultLogger: log4js.Logger;
  private commandLogger: log4js.Logger;
  private errorLogger: log4js.Logger;

  constructor() {
    // 准备日志文件夹
    FileUtil.createDir('logs');

    // 输出源
    const console = {
      type: 'console'
    };
    const logFile = {
      type: 'dateFile',
      filename: 'logs/command/xybot',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
      },
      numBackups: 100
    };
    const errFile = {
      type: 'dateFile',
      filename: 'logs/error/xybot',
      pattern: 'yyyy-MM-dd.err',
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
      },
      numBackups: 100
    };

    log4js.configure({
      // 日志出口
      appenders: {
        console, logFile, errFile,
        qqFilter: { type: 'logLevelFilter', appender: 'logFile', level: 'info', maxLevel: 'mark' }, // 监听icqq模块的日志输出
      },
      // 模块分类
      categories: {
        default: { appenders: ['console', 'qqFilter'], level: 'debug' },
        command: { appenders: ['console', 'logFile'], level: 'info' },
        error: { appenders: ['console', 'errFile'], level: 'error' }
      },
      pm2: true, // 使用pm2需要设置为true，这样日志输出才不会被pm2拦截
      // disableClustering: true
    });

    this.defaultLogger = log4js.getLogger('default');
    this.commandLogger = log4js.getLogger('command');
    this.errorLogger = log4js.getLogger('error');
  }

  public debug(message: any, ...args: any[]) {
    this.defaultLogger.debug(message, ...args);
  }

  public info(message: any, ...args: any[]) {
    this.commandLogger.info(message, ...args);
  }

  public mark(message: any, ...args: any[]) {
    this.commandLogger.mark(message, ...args);
  }

  public error(message: any, ...args: any[]) {
    this.errorLogger.error(message, ...args);
  }
}

export default new Logger()