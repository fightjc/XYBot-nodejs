import moment from 'moment';

import BasePlugin from '../../core/plugins/basePlugin';

export default class Status extends BasePlugin {
  constructor() {
    super({
      name: '状态',
      desc: '查询当前bot状态',
      event: 'message.private',
      rules: [
        {
          reg: '^状态$',
          func: 'status',
          permission: 'master'
        }
      ]
    });
  }

  async status() {
    let msg = `当前时间: ${moment().format('YYYY年MM月DD日 HH时mm分ss秒')}`;

    // 运行时间
    let runTime = moment().diff(moment.unix(global.bot.stat.start_time), 'second');
    let day = Math.floor(runTime / 3600 / 24);
    let hour = Math.floor((runTime / 3600) % 24);
    let min = Math.floor((runTime / 60) % 60);
    msg += `\n运行时间: ${day > 0 ? (day + '天') : '' }${hour}小时${min}分钟`;

    // 使用内存
    let b = process.memoryUsage().rss;
    if (b < 1024) {
      msg += `\n内存使用: ${b}B`;
    } else {
      let kb = usage / 1024;
      if (kb < 1024) {
        msg += `\n内存使用: ${kb.toFixed(2)}KB`;
      } else {
        msg += `\n内存使用: ${(kb / 1024).toFixed(2)}KB`;
      }
    }

    // 数据统计
    msg += `\n接收消息: ${global.bot.stat.recv_msg_cnt}`;
    msg += `\n发送消息: ${global.bot.stat.sent_msg_cnt}`;
    msg += `\n接收图片: ${global.bot.stat.recv_pkt_cnt}`;
    msg += `\n发送图片: ${global.bot.stat.sent_pkt_cnt}`;
    msg += `\n图片丢失: ${global.bot.stat.lost_pkt_cnt}`;

    await global.bot.sendPrivateMsg(global.config.data.master, msg);
  }
}