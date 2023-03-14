import BaseEvent from './baseEvent';

/**
 * 上线事件
 */
export default class OnlineEvent extends BaseEvent {
  constructor() {
    super({
      event: 'system.online',
      once: true
    });
  }

  async execute(event) {
    global.logger.info('上线成功');

    global.pluginLoader.prepareData();
  }
}