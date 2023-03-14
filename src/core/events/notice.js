import BaseEvent from './baseEvent';

/**
 * 所有通知
 */
export default class NoticeEvent extends BaseEvent {
  constructor() {
    super({
      event: 'notice'
    });
  }

  async execute(event) {
    global.pluginLoader.handle(event);
  }
}