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
    //refs: https://oicqjs.github.io/oicq/interfaces/MessageEvent.html
    await global.pluginLoader.handle(event);
  }
}