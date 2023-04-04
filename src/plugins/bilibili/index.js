import BasePlugin from '../../core/plugins/basePlugin';
import FileUtil from '../../utils/file';
import * as apiHelper from './services/apiHelper';

export default class Bilibili extends BasePlugin {
  constructor() {
    super({
      name: 'b站订阅',
      desc: 'b站订阅',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^b站\\s+\\S+$',
          func: 'handle',
          permission: 'everyone'
        }
      ],
      tasks: [
        {
          // cron: '0 0/5 * * * ?', // 每隔5分钟查看一次b站订阅
          cron: '0 0/1 * * * ?', // test
          func: 'lookUp'
        }
      ]
    });

    // 初始化配置文件
    this.filePath = 'bilibili/config/subscribe.yml';
    if (!FileUtil.isExist(FileUtil.getFilePath(this.filePath, 'plugins'))) {
      global.logger.info(`检测到配置文件 ${this.filePath} 不存在，准备创建`);

      FileUtil.createDir('bilibili/config', 'plugins');
      FileUtil.writeYAML(this.filePath, { 'groups': [], 'dynamics': [] }, 'plugins');
    }
  }

  async handle(event) {
    const usage = '使用方式：b站 [帮助] [列表] [查询 关键字] [up mid] [订阅/退订 mid]';

    // 判断参数数量
    let args = event.raw_message.split(' ').filter((e) => e);
    if (args.length < 2) {
      await global.bot.sendGroupMsg(event.group_id, usage);
      return;
    }

    // 解析
    if (args[1] == '帮助') {
    } else if (args[1] == '列表') {
    } else if (args[1] == '查询') {
    } else if (args[1] == 'up') {
    } else if (args[1] == '订阅' || args[1] == '退订') {
    } else {
      await global.bot.sendGroupMsg(event.group_id, usage);
    }
  }

  async lookUp() {
    global.logger.mark('查看b站订阅');
    // const data = await apiHelper.getUserDynamic(401742377);
    // console.log(data);
  }
}