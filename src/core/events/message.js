import BaseEvent from './baseEvent';

/**
 * 所有消息
 */
export default class MessageEvent extends BaseEvent {
  constructor() {
    super({
      event: 'message'
    });
  }

  async execute(event) {
    global.pluginLoader.handle(event);
  }
}