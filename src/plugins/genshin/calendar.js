import BasePlugin from '../../core/plugins/basePlugin';
import FileUtil from '../../utils/file';
import { gets } from '../../utils/httpHelper';

export default class GenshinCalendar extends BasePlugin {
  constructor() {
    super({
      name: '原神日历',
      desc: '原神日历',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^原神日历$',
          func: 'getCalendar',
          permission: 'everyone'
        },
        {
          reg: '^原神日历\\s+\\S+',
          func: 'handle',
          permission: 'admin'
        }
      ],
      tasks: [
        {
          cron: '0 0 9 * * ?', // 每天9时推送原神日历
          func: 'push'
        }
      ]
    });

    // 初始化配置文件
    this.file = 'genshin/config/calendar.yml';
    if (!FileUtil.isExist(FileUtil.getFilePath(this.file, 'plugins'))) {
      global.logger.info(`检测到配置文件 ${this.file} 不存在，准备创建`);

      FileUtil.createDir('genshin/config', 'plugins');
      FileUtil.writeYAML(this.file, [], 'plugins');
    }

    // 忽略推送触发
    this.ignoreAnnId = [
      495,  // 有奖问卷调查开启！
      1263, // 米游社《原神》专属工具一览
      423,  // 《原神》玩家社区一览
      422,  // 《原神》防沉迷系统说明
      762   // 《原神》公平运营声明
    ];
    this.ignoreKeyword = [
      '修复', '版本内容专题页', '米游社', '调研', '防沉迷', '专项'
    ];
  }

  getCalendar() {
    // TODO: 获取原神日历
  }

  async handle(event) {
    // TODO: 处理指令

    // 判断参数数量
    let args = event.raw_message.split(' ').filter((e) => e);
    if (args.length < 2) {
      await global.bot.sendGroupMsg(event.group_id, '使用方式：开关 [列表] [开启/关闭 组件名]');
    }
  }

  async push() {
    global.logger.info('开始推送原神日历...');

    await this.fetchData();

    // let groups = [];
    // try {
    //   let data = FileUtil.loadYAML(this.file, 'plugins');
    //   groups = data['calendar'];
    // } catch (e) {
    //   groups = [];
    // }

    // for (let group in groups) {
    //   try {
    //     await global.bot.sendGroupMsg(group, []);
    //   } catch (e) {
    //     global.logger.error(`推送原神日历失败: ${e}`);
    //   }
    // }

    global.logger.info('推送原神日历完成！');
  }

  /**
   * 请求原神日历
   */
  async fetchData() {
    const url = 'https://hk4e-api.mihoyo.com/common/hk4e_cn/announcement/api/getAnnList';
    const params = {
      'game': 'hk4e',
      'game_biz': 'hk4e_cn',
      'bundle_id': 'hk4e_cn',
      'lang': 'zh-cn',
      'platform': 'pc',
      'region': 'cn_gf01',
      'level': 55,
      'uid': 100000000
    };

    await gets(url, params)
      .then((response) => {
        if (response && response.retcode == 0) {
          this.handleData(response.data);
        }
      })
      .catch((error) => {
        global.logger.error(`请求原神日历失败: ${error}`);
      });
  }

  /**
   * 提取需要推送的内容
   * @param {object} rawData 
   */
  handleData(rawData) {
    let announcelist = [];
    rawData.list.map((data) => {
      let list = data.list || [];
      for (let item of list) {
        // 筛选 1 活动公告 2 游戏公告
        if (item.type == 2) {
          if (this.ignoreAnnId.includes(item.ann_id)) {
            continue;
          }
          if (this.ignoreKeyword.filter((word) => item.title.includes(word)).length > 0) {
            continue;
          }
        }

        // 自定义公告类型
        let type = 'other';
        if (item.type == 1) {
          type = 'event';
        }
        if (item.tag_label.includes('扭蛋')) {
          type = 'gacha';
        }
        if (item.title.includes('倍')) {
          type = 'award';
        }

        announcelist.push({
          type,
          'title': item.title,
          'startTime': new Date(item.start_time),
          'endTime': new Date(item.end_time),
          'isForever': item.title.includes('任务')
        });
      }
    });
    
    // 添加深渊提醒
    let today = new Date();
    if (today.getDate() <= 16) {
      // 上半月深渊
      announcelist.push({
        'type': 'abyss',
        'title': '「深境螺旋」',
        'startTime': new Date(today.getFullYear(), today.getMonth(), 1, 4, 0, 0),
        'endTime': new Date(today.getFullYear(), today.getMonth(), 16, 3, 59, 59),
        'isForever': false
      });
      // 下半月深渊
      announcelist.push({
        'type': 'abyss',
        'title': '「深境螺旋」',
        'startTime': new Date(today.getFullYear(), today.getMonth(), 16, 4, 0, 0),
        'endTime': new Date(today.getFullYear(), today.getMonth() + 1, 0, 3, 59, 59),
        'isForever': false
      });
    } else {
      // 下半月深渊
      announcelist.push({
        'type': 'abyss',
        'title': '「深境螺旋」',
        'startTime': new Date(today.getFullYear(), today.getMonth(), 16, 4, 0, 0),
        'endTime': new Date(today.getFullYear(), today.getMonth() + 1, 0, 3, 59, 59),
        'isForever': false
      });
      // 下一个月的上半月深渊
      announcelist.push({
        'type': 'abyss',
        'title': '「深境螺旋」',
        'startTime': new Date(today.getFullYear(), today.getMonth() + 1, 1, 4, 0, 0),
        'endTime': new Date(today.getFullYear(), today.getMonth() + 1, 16, 3, 59, 59),
        'isForever': false
      });
    }

    // 按开始时间排序
    announcelist.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    //TODO: data to image
  }
}