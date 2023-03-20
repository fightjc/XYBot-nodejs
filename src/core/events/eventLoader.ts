import { Client } from 'oicq';
import FileUtil from '../../utils/file'
import BaseEvent from './baseEvent';

interface EventLoaderInterface {
  /**
   * 加载插件
   * @param client QQ客户端
   */
  load(client: Client): Promise<void>;
}

export class EventLoader implements EventLoaderInterface {
  constructor() {}

  async load(client: Client) {
    const files = FileUtil.getDirFiles('src/core/events').filter(file => file.endsWith('.js'));
    for (let file of files) {
      try {
        let listenerClass = await import(`./${file}`);
        if (!listenerClass.default) {
          continue;
        }

        let listener = new listenerClass.default();
        if (!BaseEvent.prototype.isPrototypeOf(listener)) {
          continue;
        }
        listener.client = client;
        const on = listener.once ? 'once' : 'on';

        if (Array.isArray(listener.event)) {
          // 多事件处理
          listener.event.forEach((type) => {
            const e = listener[type] ? type : 'execute'; // 处理时事件方法
            client[on](listener.prefix + type, (event) => listener[e](event));
          });
        } else {
          // 单事件处理
          const e = listener[listener.event] ? listener.event : 'execute'; // 处理时事件方法
          client[on](listener.prefix + listener.event, (event) => listener[e](event));
        }
      } catch (err) {
        global.logger.error(`加载监听事件错误: ${file}`);
        global.logger.error(err);
      }
    }
  }
}

export default new EventLoader()