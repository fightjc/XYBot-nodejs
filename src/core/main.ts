import moment from 'moment';

import Bot from './bot.js';
import botConfig from './config/botConfig';
import logger from './config/logger';
import redis from './config/redis';
import pluginLoader from './plugins/pluginLoader';
import renderer from '../utils/renderer';

process.title = 'xybot';
process.env.TZ = 'Asia/Shanghai';
moment.locale('zh-cn');

/** 捕获未处理的Promise错误 */
process.on('unhandledRejection', (err, promise) => {
  if (global.logger) {
    global.logger.error(err);
  } else {
    console.log(err);
  }
});

/** 退出事件 */
process.on('exit', async (code) => {
  await renderer.closeBrowser();
  global.redis.close();
  global.logger.info('程序已退出.');
});

export default class XYBot {
  constructor() {
    // 日志
    global.logger = logger;
    global.logger.mark('日志系统加载完成！');

    // 配置
    global.config = botConfig;
    global.logger.mark('配置系统加载完成！');
  }

  public async run() {
    // redis
    global.redis = redis;
    await global.redis.connect();

    // 插件
    global.pluginLoader = pluginLoader;
    await global.pluginLoader.load();

    global.logger.mark('XYBot 启动中...');

    // 机器人
    global.bot = new Bot(global.config.data);
    await global.bot.login(global.config.data.number, global.config.data.password);
  }
}