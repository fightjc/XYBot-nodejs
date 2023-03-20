import BasePlugin from '../core/plugins/basePlugin';
import { random } from '../utils/common';

export default class Greeting extends BasePlugin {
  constructor() {
    super({
      name: '寒暄',
      desc: '打招呼',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^(早|早安|早上好|晚|晚安|晚上好)$',
          func: 'greet',
          permission: 'everyone'
        }
      ]
    });

    this.morning = [
      '早',
      '早安',
      '早上好',
      '早上好！新的一天可要元气满满啊ଘ(੭ˊ꒳\u200Bˋ)੭',
      '( ｣ﾟДﾟ)｣＜早早早',
      '早啊，不要忘记吃早餐哦，不然会饿坏小肚几的_(:з」∠)_'
    ];

    this.evening = [
      '晚',
      '晚安',
      '晚上好',
      '晚上好啊，辛苦了一天，是要先洗澡，还是先吃饭？还是~(*/ω＼*)',
      '晚上好！今晚可别忘了早点休息_(:з」∠)_',
      '晚上好！今天的任务还没有完成,你还不能休息'
    ];
  }

  async greet(event) {
    if (random(1, 20) == 1) {
      // 5%概率彩蛋
      return '不听不听，王八念经';
    }

    let list = event.raw_message.includes('早') ? this.morning : this.evening;
    let r = random(1, list.length);
    let msg = list[r - 1];

    // 发送群消息
    await global.bot.sendGroupMsg(event.group_id, msg);
  }
}