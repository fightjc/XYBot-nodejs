import template from 'art-template';
import { segment } from 'oicq';

import BasePlugin from '../../core/plugins/basePlugin';
import * as apiHelper from './services/apiHelper';
import FileUtil from '../../utils/file';
import renderer from '../../utils/renderer';

export default class Bilibili extends BasePlugin {
  constructor() {
    super({
      name: 'b站',
      desc: 'b站',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^b站\\s+\\S+',
          func: 'handle',
          permission: 'everyone'
        }
      ],
      tasks: [
        {
          cron: '0 0/5 * * * ?', // 每隔5分钟查看一次b站订阅
          func: 'lookUp'
        }
      ]
    });

    // 初始化配置文件
    this.filePath = 'bilibili/config/subscribe.yml';
    this.defaultConfig = {
      'groups': {},
      'mids': {}
    };
    if (!FileUtil.isExist(FileUtil.getFilePath(this.filePath, 'plugins'))) {
      global.logger.info(`检测到配置文件 ${this.filePath} 不存在，准备创建`);

      FileUtil.createDir('bilibili/config', 'plugins');
      FileUtil.writeYAML(this.filePath, this.defaultConfig, 'plugins');
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
      await global.bot.sendGroupMsg(event.group_id, usage);
    } else if (args[1] == '列表') {
      try {
        config = this.getConfig();
      } catch (e) {
        config = this.defaultConfig;
      }
      let mids = config.groups[event.group_id] ?? [];
      let text = `当前已订阅 ${mids.length} 个\n`;
      //TODO: how to get name?
      mids.map((m) => text += `${m}\n`);
      await global.bot.sendGroupMsg(event.group_id, msg);
    } else if (args[1] == '查询') {
      let text = '为您查询到下面结果:\n';
      let keyword = args[2];
      const data = await apiHelper.searchUser(keyword);
      data.map((user) => {
        text += `\n${user.uname} (${user.mid})\n粉丝: ${user.fans}\n个性签名: ${user.usign}\n`
      });
      const msg = [ at, ' ',  text ];
      await global.bot.sendGroupMsg(event.group_id, msg);
    } else if (args[1] == 'up') {
      let mid = args[2];
      const at = segment.at(event.sender.user_id);
      let text = '';

      let userInfo = await apiHelper.getUserInfo(mid);
      if (userInfo != null) {
        text = `
${userInfo.name} (${userInfo.mid})
性别: ${userInfo.sex}
个性签名: ${userInfo.sign}

直接访问个人空间: https://space.bilibili.com/${userInfo.mid}`;
      } else {
        text = `获取b站up ${mid} 信息失败`;
      }
      const msg = [ at, ' ', text ];
      await global.bot.sendGroupMsg(event.group_id, msg);
    } else if (args[1] == '订阅' || args[1] == '退订') {
      const at = segment.at(event.sender.user_id);
      let subscribe = args[1] == '订阅';
      let mid = args[2];

      // 查询用户是否存在
      let userInfo = await apiHelper.getUserInfo(mid);
      if (userInfo == null) {
        await global.bot.sendGroupMsg(event.group_id, [at, ' ', '找不到要操作的对象，请再次检查mid']);
        return;
      }

      // 修改订阅配置
      let text = '';
      try {
        this.updateConfig(event.group_id, mid, subscribe);
        text = `${args[1]}b站up ${userInfo.name}(${mid}) 动态成功`;
      } catch (e) {
        text = `${args[1]}b站up ${mid} 动态失败`;
      }
      const msg = [ at, ' ',  text ];
      await global.bot.sendGroupMsg(event.group_id, msg);
    } else {
      await global.bot.sendGroupMsg(event.group_id, usage);
    }
  }

  async lookUp() {
    global.logger.mark('查看b站订阅');

    let config = {};
    try {
      config = this.getConfig();
    } catch (e) {
      config = this.defaultConfig;
    }

    for (let mid in config.mids) {
      const groups = config.mids[mid];
      if (groups.length == 0) {
        // 没有订阅
        continue;
      }

      const list = await apiHelper.getUserDynamic(mid);
      if (list.length == 0) {
        // 没有更新
        continue;
      }

      for (var i = 0; i < list.length; i++)  {
        // 获取动态图片
        const dynamic = list[i];
        const image = await this.getDynamicImage(dynamic);
        if (image == null) {
          continue;
        }
        // 逐个群推送
        for (let group of groups) {
          try {
            await global.bot.sendGroupMsg(group, image);
          } catch (e) {
            global.logger.error(`推送b站动态 ${dynamic.dynamicId} 到群 ${group} 失败: ${e}`);
          }
        }
      }
    }
  }

  /**
   * 数据转换b站动态图片
   * @param {BILI_DynamicDto} data 获取动态api后处理数据
   * @return qq消息格式图片
   */
  async getDynamicImage(data) {
    //暂时只处理图片和视频动态
    if ([2, 8].includes(data.type)) {
      const typeName = data.type == 2 ? 'dynamic_pic' : (data.type == 8 ? 'dynamic_video' : '');
      const templatePath = `bilibili/resources/template/${typeName}.art`;

      let templateData = FileUtil.loadFile(templatePath, 'plugins');
      let html = template.render(templateData, data);

      // html to image
      const htmlPath = `bilibili/resources/template/${data.dynamicId}.html`;
      FileUtil.writeFile(htmlPath, html, 'plugins');
      let path = `file://${FileUtil.getFilePath(htmlPath, 'plugins')}`;
      let base64 = await renderer.screenshot(path, '#canvas');

      // delete temp file
      FileUtil.deleteFile(htmlPath, 'plugins');

      return segment.image(base64);
    }
  }

  /**
   * 获取订阅列表
   * @return 配置对象
   */
  getConfig() {
    try {
      return FileUtil.loadYAML(this.filePath, 'plugins') ?? this.defaultConfig;
    } catch (e) {
      global.logger.error('获取b站订阅信息配置文件失败', e);
      throw new Error('获取b站订阅信息配置文件失败');
    }
  }

  /**
   * 设置群订阅
   * @param {number} groupId QQ群号
   * @param {string} mid b站用户mid
   * @param {boolean} subscribe 是否订阅
   */
  updateConfig(groupId, mid, subscribe) {
    let config = this.getConfig();
    config.groups[groupId] = config.groups[groupId] ?? [];
    config.mids[mid] = config.mids[mid] ?? [];

    let hasChange = false;
    let gIndex = config.groups[groupId].indexOf(mid);
    let mIndex = config.mids[mid].indexOf(groupId);
    if (subscribe) {
      if (gIndex == -1) {
        config.groups[groupId].push(mid);
        config.mids[mid].push(groupId);
        hasChange = true;
      }
    } else {
      if (gIndex > -1) {
        config.groups[groupId].splice(gIndex, 1);
        config.mids[mid].splice(mIndex, 1);
        hasChange = true;
      }
    }

    if (hasChange) {
      FileUtil.writeYAML(this.filePath, config, 'plugins');
    }
  }
}