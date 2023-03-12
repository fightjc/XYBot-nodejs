import BaseEvent from './baseEvent';

/**
 * 下线事件
 */
export default class OfflineEvent extends BaseEvent {
  constructor() {
    super({
      event: 'system.offline'
    });
  }

  async execute(event) {
    logger.info('qq下线了');
  }
}