import moment from 'moment';
import { segment } from 'icqq';
import BasePlugin from '../../core/plugins/basePlugin';
import { random } from '../../utils/common';
import FileUtil from '../../utils/file';

export default class DailyLuck extends BasePlugin {
  constructor() {
    super({
      name: '抽签',
      desc: '每日抽签',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^抽签$',
          func: 'gacha',
          permission: 'everyone'
        }
      ]
    });

    // 预加载抽签列表
    try  {
      let data = JSON.parse(FileUtil.loadFile('dailyLuck/gacha.json', 'plugins')) || { 'gacha': [] };
      this.list = data.gacha;
      this.sum = this.list.reduce((prev, item) => (prev + item.weight), 0);
    } catch(e) {
      this.list = [];
      this.sum = 0;
      global.logger.error('加载抽签列表失败', e);
    }
  }

  async gacha(event) {
    // 当天一个 Id 只能抽签一次
    if (await this.checkHasGacha(event.sender.user_id)) {
      const at = segment.at(event.sender.user_id);
      const text = `你今天已经抽过签了，欢迎明天再来～`;
      const msg = [ at, ' ',  text ];
      await global.bot.sendGroupMsg(event.group_id, msg);
      return;
    }

    let r = random(1, this.sum); // 获取随机数
    let s = 0; // 记录抽签概率区间
    for (var i = 0; i < this.list.length; i++) {
      let sign = this.list[i];
      s += sign.weight;
      if (r <= s) {
        // 发送消息
        const at = segment.at(event.sender.user_id);
        const text = `你抽到了 ${sign.title}\n${sign.content}`;
        const msg = [ at, ' ', text ];
        await global.bot.sendGroupMsg(event.group_id, msg);
        // 记录该用户已抽签
        await this.refreshRecord(event.sender.user_id);
        break;
      }
    }
  }

  /**
   * 判断命令触发者今日是否已抽签
   * @param {number} userId 触发者QQ
   */
  async checkHasGacha(userId) {
    let key = 'xybot:dailyLuck';
    let data = await global.redis.getString(key) || '[]';
    try {
      let list = JSON.parse(data);
      return list.includes(userId);
    } catch(e) {
      global.logger.error(`解析redis[key:'${key}']JSON值失败`, e);
      return true;
    }
  }

  /**
   * 更新抽签记录
   */
  async refreshRecord(userId) {
    let key = 'xybot:dailyLuck';
    let data = await global.redis.getString(key) || '[]';
    try {
      let list = JSON.parse(data);
      list.push(userId);

      const current = moment();
      // 早上四点重置抽签记录
      let expired = current.hours() >= 4
          ? moment().add(1, 'day').set({ 'h': 4, 'm': 0, 's': 0 })
          : moment().set({ 'h': 4, 'm': 0, 's': 0 });
      let timeout = Math.trunc((expired.valueOf() - current.valueOf()) / 1000);
      await global.redis.setString(key, JSON.stringify(list), timeout);
    } catch(e) {
      global.logger.error(`解析redis[key:'${key}']JSON值失败`, e);
    }
  }
}