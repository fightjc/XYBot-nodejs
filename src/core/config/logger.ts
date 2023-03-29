import log4js from 'log4js'
import FileUtil from '../../utils/file'

interface LoggerInterface {
  debug(message: any, ...args: any[]): void;
  mark(message: any, ...args: any[]): void;
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

    const console = {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
      }
    };
    const logFile = {
      type: 'dateFile',
      filename: 'logs/command/xybot',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
      }
    };
    const errFile = {
      type: 'dateFile',
      filename: 'logs/error/xybot',
      pattern: 'yyyy-MM-dd.err',
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
      }
    };

    log4js.configure({
      appenders: { console, logFile, errFile },
      categories: {
        default: { appenders: ['console'], level: 'debug' },
        command: { appenders: ['console', 'logFile'], level: 'mark' },
        error: { appenders: ['console', 'errFile'], level: 'error' }
      },
      pm2: true, // 使用pm2需要设置为true，这样日志输出才不会被pm2拦截
      disableClustering: true
    });

    this.defaultLogger = log4js.getLogger('default');
    this.commandLogger = log4js.getLogger('command');
    this.errorLogger = log4js.getLogger('error');
  }

  public debug(message: any, ...args: any[]) {
    this.defaultLogger.debug(message, ...args);
  }

  public mark(message: any, ...args: any[]) {
    this.commandLogger.mark(message, ...args);
  }

  public info(message: any, ...args: any[]) {
    this.commandLogger.info(message, ...args);
  }

  public error(message: any, ...args: any[]) {
    this.errorLogger.error(message, ...args);
  }
}

export default new Logger()