import BaseEvent from './baseEvent';

/**
 * 所有请求
 */
export default class RequestEvent extends BaseEvent {
  constructor() {
    super({
      event: 'request'
    });
  }

  async execute(event) {
    global.logger.info(`收到请求: ${JSON.stringify(event)}`);

    global.pluginLoader.handle(event);
  }
}