import FileUtil from '../utils/file'

class EventLoader {
  async load(client) {
    const files = FileUtil.getDirFiles('src/core/events').filter(file => file.endsWith('.js'));
    for (let file of files) {
      try {
        let listenerClass = await import(`./events/${file}`);
        if (!listenerClass.default) {
          continue;
        }

        let listener = new listenerClass.default();
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