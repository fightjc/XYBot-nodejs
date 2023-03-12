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
    global.logger.info(`收到消息: ${JSON.stringify(event)}`);

    global.pluginLoader.handle(event);
  }
}