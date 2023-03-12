import BasePlugin from '../../core/plugins/basePlugin';
import switcher from '../../core/plugins/switcher';

export default class Switch extends BasePlugin {
  constructor() {
    super({
      name: '开关',
      desc: '切换插件激活状态',
      event: 'message.group.normal',
      rules: [
        {
          reg: '^开关.*$',
          func: 'handle',
          permission: 'master'
        }
      ]
    })
  }

  handle(event) {
    let msg = event.msg;
    console.log('event', event)
    console.log('msg', msg)
    // switcher.change(event.groud_id, )

    return "";
  }
}