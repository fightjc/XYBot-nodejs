import moment from 'moment';

import BasePlugin from '../../core/plugins/basePlugin';
import FileUtil from '../../utils/file';
import * as resourceService from './services/data/resource';
import * as dailyMaterialService from './services/data/dailyMaterial';

export default class DailyMaterial extends BasePlugin {
  constructor() {
    super({
      name: '每日素材',
      desc: '查询原神角色武器材料等',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^原神数据更新$',
          func: 'update',
          permission: 'admin'
        },
        {
          reg: '^原神数据检查$',
          func: 'check',
          permission: 'admin'
        },
        {
          reg: '^(每日|今日|今天)(素材|材料)[\\s+\\S+]$',
          func: 'handle',
          permission: 'everyone'
        },
        // {
        //   reg: '^查询\\s+\\S+$',
        //   func: 'handle',
        //   permission: 'everyone'
        // }
      ]
    });
  }

  async update(event) {
    // 重构索引文件
    resourceService.generateAllIndexes();
    // 生成每日素材图片
    await dailyMaterialService.updateDailyMaterial();

    await global.bot.sendPrivateMsg(event.sender.user_id, '数据更新完成！');
  }

  async check(event) {
    let { success, info } = resourceService.checkedAllResources();
    if (!success) {
      global.logger.info(info);
    }

    const msg = `${success ? '原神数据完整!' : '数据缺失，详情请查看日志清单'}`;
    await global.bot.sendPrivateMsg(event.sender.user_id, msg);
  }

  async handle(event) {
    const usage = '使用方式：每日素材 [星期X/周X/礼拜X/X]';

    let imageNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    // 默认当天
    let day = moment.hours() >= 4 ? moment().day() : moment().add(-1, 'day').day();

    // 判断参数数量
    let args = event.raw_message.split(' ').filter((e) => e);
    if (args.length > 1) {
      let opt = args[1].replace('星期', '').replace('周', '').replace('礼拜', '');
      switch (opt) {
        case '一': case '1': day = 1; break;
        case '二': case '2': day = 2; break;
        case '三': case '3': day = 3; break;
        case '四': case '4': day = 4; break;
        case '五': case '5': day = 5; break;
        case '六': case '6': day = 6; break;
        case '日': case '7': case '天': day = 0; break;
        default:
          const at = segment.at(event.sender.user_id);
          const msg = [ at, ' ', usage ];
          await global.bot.sendGroupMsg(event.group_id, msg);
          return;
      }
    }

    // 周日不查询直接回复
    if (day == 0) {
      const at = segment.at(event.sender.user_id);
      const text = '笨蛋，周日啥资源都有哦～';
      const msg = [ at, ' ', text ];
      await global.bot.sendGroupMsg(event.group_id, msg);
      return;
    }

    // 读取图片
    let imagePath = `genshin/resources/images/dailyMaterial/${imageNames[day]}.jpeg`;
    let imageData = FileUtil.loadFile(imagePath, 'plugins');
    let base64 = Buffer.from(imageData).toString('base64');

    const msg = [segment.image(base64)];
    await global.bot.sendGroupMsg(event.group_id, msg);
  }
}