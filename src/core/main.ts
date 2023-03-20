import logger from './config/logger';
import botConfig from './config/botConfig';
import Bot from './bot.js';
import redis from './config/redis';
import pluginLoader from './plugins/pluginLoader'

process.title = 'XYBot';
process.env.TZ = 'Asia/Shanghai';

/** 捕获未处理的Promise错误 */
process.on('unhandledRejection', (err, promise) => {
  if (global.logger) {
    global.logger.error(err);
  } else {
    console.log(err);
  }
});

/** 退出事件 */
process.on('exit', (code) => {
  global.redis.close();
  global.logger.info('程序已退出.');
});

export default class XYBot {
  constructor() {
    // 日志
    global.logger = logger;
    global.logger.info('日志系统加载完成！');

    // 配置
    global.config = botConfig;
    global.logger.info('配置系统加载完成！');
  }

  public async run() {
    // redis
    global.redis = redis;
    await global.redis.connect();

    // 插件
    global.pluginLoader = pluginLoader;
    await global.pluginLoader.load();

    global.logger.info('XYBot 启动中...');

    // 机器人
    global.bot = new Bot(global.config.number, global.config);
    await global.bot.login(global.config.password);
  }
}