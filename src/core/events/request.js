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
    await global.pluginLoader.handle(event);
  }
}