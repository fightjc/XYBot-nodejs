import BasePlugin from '../../core/plugins/basePlugin';
import * as mysHelper from './services/mys/index';

export default class MYS extends BasePlugin {
  constructor() {
    super({
      name: '米游社',
      desc: '米游社账号信息获取，原神签到',
      event: 'message.private',
      rules: [
        {
          reg: '^米游社\\s+\\S+$',
          func: 'handle',
          permission: 'friend'
        }
      ],
      tasks: [
        {
          cron: '0 0 8 * * ?', // 每天8点米游社签到
          func: 'signReward'
        }
      ]
    });
  }

  async handle(event) {
    const usage = '使用方式：米游社 [帮助] [绑定] [原神签到]';
    
    // 判断参数数量
    let args = event.raw_message.split(' ').filter((e) => e);
    if (args.length < 2) {
      await global.bot.sendPrivateMsg(event.sender.user_id, usage);
      return;
    }

    // 解析
    if (args[1] == '帮助') {
      await global.bot.sendPrivateMsg(event.sender.user_id, usage);
    } else if (args[1] == '绑定') {
      let cookie = args[2];
      let msg = cookie ?
          await mysHelper.saveConfig(event.sender.user_id, cookie)
          : '请提供米游社账号缓存，缓存获取方式请咨询qq机器人提供者';
      await global.bot.sendPrivateMsg(event.sender.user_id, msg);
    } else if (args[1] == '原神签到') {
      let msg = await mysHelper.signIn(event.sender.user_id);
      await global.bot.sendPrivateMsg(event.sender.user_id, msg);
    }
  }

  async signReward() {
    let result = await mysHelper.signInAll();

    // TODO: 逐个用户通知？

    // 签到情况发送给主人qq
    if (result) {
      await global.bot.sendPrivateMsg(global.config.master, result);
    }
  }
}