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
    global.logger.info(`收到通知: ${JSON.stringify(event)}`);

    global.pluginLoader.handle(event);
  }
}