import template from 'art-template';
import moment from 'moment';
import { segment } from 'oicq';

import BasePlugin from '../../core/plugins/basePlugin';
import FileUtil from '../../utils/file';
import { gets } from '../../utils/httpHelper';
import renderer from '../../utils/renderer';

export default class GenshinCalendar extends BasePlugin {
  constructor() {
    super({
      name: '原神日历',
      desc: '原神日历',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^原神日历$',
          func: 'calendar',
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
    this.filePath = 'genshin/config/calendar.yml';
    this.defaultConfig = {
      'calendar': []
    };
    if (!FileUtil.isExist(FileUtil.getFilePath(this.filePath, 'plugins'))) {
      global.logger.info(`检测到配置文件 ${this.filePath} 不存在，准备创建`);

      FileUtil.createDir('genshin/config', 'plugins');
      FileUtil.writeYAML(this.filePath, this.defaultConfig, 'plugins');
    }

    // 忽略推送Id
    this.ignoreAnnId = [
      495,  // 有奖问卷调查开启！
      1263, // 米游社《原神》专属工具一览
      423,  // 《原神》玩家社区一览
      422,  // 《原神》防沉迷系统说明
      762   // 《原神》公平运营声明
    ];
    // 忽略推送关键词
    this.ignoreKeyword = [
      '修复', '版本内容专题页', '米游社', '调研', '防沉迷', '专项'
    ];
  }

  async calendar(event) {
    const image = await this.getCalendarImage();
    if (image != null) {
      await global.bot.sendGroupMsg(event.group_id, image);
    }
  }

  async handle(event) {
    // 判断参数数量
    let args = event.raw_message.split(' ').filter((e) => e);
    if (args.length < 2) {
      await global.bot.sendGroupMsg(event.group_id, '使用方式：原神日历 [开启推送/关闭推送/状态]');
      return;
    }

    // 解析
    if (args[1] == '状态') {
      const at = segment.at(event.sender.user_id);
      let text = '';
      try {
        let groups = this.getSubscribes();
        text = `原神日历推送${groups.includes(event.group_id) ? '已' : '未'}开启`;
      } catch (e) {
        text = '获取原神日历配置文件失败';
      }
      const msg = [ at, ' ',  text ];
      await global.bot.sendGroupMsg(event.group_id, msg);
    } else if (args[1] == '开启推送' || args[1] == '关闭推送') {
      let enabled = args[1] == '开启推送' ? true :  false;

      const at = segment.at(event.sender.user_id);
      let text = '';
      try {
        this.setSubscribe(event.group_id, enabled);
        text = `原神日历推送已${enabled ? '开启' : '关闭'}`;
      } catch (e) {
        text = '配置原神日历失败';
      }
      const msg = [ at, ' ',  text ];
      await global.bot.sendGroupMsg(event.group_id, msg);
    } else {
      // 一级菜单错误
      await global.bot.sendGroupMsg(event.group_id, '使用方式：原神日历 [开启推送/关闭推送/状态]');
    }
  }

  async push() {
    global.logger.mark('开始推送原神日历...');

    let groups = [];
    try {
      groups = this.getSubscribes();
    } catch (e) {
      groups = [];
    }

    if (groups.length > 0) {
      const image = await this.getCalendarImage();
      if (image != null) {
        for (let group of groups) {
          try {
            await global.bot.sendGroupMsg(group, image);
          } catch (e) {
            global.logger.error(`推送原神日历到群 ${group} 失败: ${e}`);
          }
        }
      }
    }

    global.logger.mark('推送原神日历完成！');
  }

  /** 获取日历图片 */
  async getCalendarImage() {
    // get list
    let list = await this.fetchData();
    if (!list || list.length == 0) {
      return null;
    }

    // data to html
    const templatePath = 'genshin/resources/template/calendar.art';
    let templateData = FileUtil.loadFile(templatePath, 'plugins');
    let html = template.render(templateData, {
      dateTime: moment().format('YYYY-MM-DD'),
      list: list
    });

    // html to image
    const htmlPath = `genshin/resources/template/calendar.html`;
    FileUtil.writeFile(htmlPath, html, 'plugins');
    let path = `file://${FileUtil.getFilePath(htmlPath, 'plugins')}`;
    let base64 = await renderer.screenshot(path, '#canvas');
    
    // delete temp file
    FileUtil.deleteFile(htmlPath, 'plugins');

    return segment.image(base64);
  }

  /** 请求原神日历 */
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

    try {
      const response = await gets(url, params);
      if (response && response.retcode == 0) {
        return this.handleData(response.data);
      }
    } catch(e) {
      global.logger.error(`生成原神日历失败: ${e}`);
    }
    return [];
  }

  /**
   * 提取需要推送的内容
   * @param {any} rawData 
   */
  async handleData(rawData) {
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
          title: item.title,
          startTime: moment(item.start_time),
          endTime: moment(item.end_time),
          isForever: item.title.includes('任务')
        });
      }
    });
    
    // 添加深渊提醒
    if (moment().format('DDHHmmss') <= '16035959') {
      // 上半月深渊
      announcelist.push({
        type: 'abyss',
        title: '「深境螺旋」',
        startTime: moment().set({ 'D': 1, 'h': 4, 'm': 0, 's': 0 }),
        endTime: moment().set({ 'D': 16, 'h': 3, 'm': 59, 's': 59 }),
        isForever: false
      });
      // 下半月深渊
      announcelist.push({
        type: 'abyss',
        title: '「深境螺旋」',
        startTime: moment().set({ 'D': 16, 'h': 4, 'm': 0, 's': 0 }),
        endTime: moment().add(1, 'month').set({ 'D': 1, 'h': 3, 'm': 59, 's': 59 }),
        isForever: false
      });
    } else {
      // 下半月深渊
      announcelist.push({
        type: 'abyss',
        title: '「深境螺旋」',
        startTime: moment().set({ 'D': 16, 'h': 4, 'm': 0, 's': 0 }),
        endTime: moment().add(1, 'month').set({ 'D': 1, 'h': 3, 'm': 59, 's': 59 }),
        isForever: false
      });
      // 下一个月的上半月深渊
      announcelist.push({
        type: 'abyss',
        title: '「深境螺旋」',
        startTime: moment().add(1, 'month').set({ 'D': 1, 'h': 4, 'm': 0, 's': 0 }),
        endTime: moment().add(1, 'month').set({ 'D': 16, 'h': 3, 'm': 59, 's': 59 }),
        isForever: false
      });
    }

    // 按开始时间排序
    announcelist.sort((a, b) => {
      let isAStart = a.startTime.isSameOrBefore();
      let isBStart = b.startTime.isSameOrBefore();

      if (isAStart && isBStart) {
        // 两者均已开始
        return a.endTime.isAfter(b.endTime) ? 1 : -1;
      }
      if (!isAStart && !isBStart) {
        // 两者均未开始
        return a.startTime.isAfter(b.startTime) ? 1 : -1;
      }
      if (isAStart) {
        // A已开始，B未开始
        return a.endTime.isAfter(b.startTime) ? 1 : -1;
      }
      // B已开始，A未开始
      return a.startTime.isAfter(b.endTime) ? 1 : -1;
    });

    // 生成截止日期描述
    announcelist.forEach((ann) => {
      if (ann.startTime.isAfter()) {
        // 未开始
        ann.deadline = `${ann.startTime.fromNow()}开始`;
      } else {
        // 进行中
        ann.deadline = ann.isForever ? '永久开放' : `${ann.endTime.fromNow()}结束`;
      }
    });

    return announcelist;
  }

  /** 获取订阅群列表 */
  getSubscribes() {
    try {
      let data = FileUtil.loadYAML(this.filePath, 'plugins');
      return data['calendar'] ?? [];
    } catch (e) {
      global.logger.error('获取原神日历配置文件失败', e);
      throw new Error('获取原神日历配置文件失败');
    }
  }

  /**
   * 设置群订阅
   * @param {number} groupId 
   * @param {boolean} enabled 
   */
  setSubscribe(groupId, enabled) {
    let groups = [];
    try {
      let data = FileUtil.loadYAML(this.filePath, 'plugins');
      groups = data['calendar'] ?? [];
    } catch (e) {
      global.logger.error('获取原神日历配置文件失败', e);
      throw new Error('获取原神日历配置文件失败');
    }

    let hasChange = false;
    let index = groups.indexOf(groupId);
    if (enabled) {
      if (index == -1) {
        groups.push(groupId);
        hasChange = true;
      }
    } else {
      if (index > -1) {
        groups.splice(index, 1);
        hasChange = true;
      }
    }

    if (hasChange) {
      FileUtil.writeYAML(this.filePath, { 'calendar': groups }, 'plugins');
    }
  }
}