import util from 'node:util'

import FileUtil from '../utils/file'
import BasePlugin from './plugins/basePlugin';
import switcher, { Switcher } from './plugins/switcher';

type PluginFile = {
  name: string,
  path: string
};

type Plugin = {
  key: string,
  handler: BasePlugin
};

type Task = {};

export default class PluginLoader {
  private plugins: Plugin[];
  private tasks: Task[];
  private readonly switcher: Switcher;

  constructor() {
    this.plugins = [];
    this.tasks = [];
    this.switcher = switcher;
  }

  /**
   * 加载插件
   */
  public async load() {
    global.logger.info('开始加载插件...');

    const files = this.getPluginFiles();
    for (let file of files) {
      try {
        let pluginClass = await import(file.path);
        if (!pluginClass.default) {
          continue;
        }

        // 插件实例化
        let plugin = new pluginClass.default();
        await plugin.init();

        this.plugins.push({
          key: file.name,
          handler: plugin
        });
      } catch (err) {
        global.logger.error(`加载插件错误: ${file.name}`);
        global.logger.error(err);
      }
    }

    global.logger.info(`插件初始化完成！一共加载了${this.plugins.length}个插件！`);
  }

  /**
   * 初始化数据
   */
  public async prepareData() {
    // 设置群启动插件
    await switcher.load();
  }

  /**
   * 调用插件响应事件
   * @param event 收到的事件
   */
  public async handle(event: any) {
    for (let plugin of this.plugins) {
      // 插件是否启用
      // if (!await this.switcher.checkEnable(event['group_id'], plugin.key)) {
      //   continue;
      // }

      // 事件字符串是否匹配
      if (!this.matchEvent(event, plugin.handler.event)) {
        continue;
      }

      //TODO: 插件是否仍在冷却时间

      //TODO: 判断是否匹配正则
      for (let rule of plugin.handler.rules) {
        if (!new RegExp(rule.reg).test(event.raw_message)) {
          continue;
        }

        if (!plugin.handler[rule.func]) {
          global.logger.error(`找不到方法 ${plugin.key}.${rule.func}`);
          continue;
        }

        try {
          console.log('执行方法',rule.func);
          let res = plugin.handler[rule.func](event);
          if (util.types.isPromise(res)) {
            res = await res;
          }
        } catch (err) {
          global.logger.error(`执行方法 ${plugin.key}.${rule.func} 出错:`);
          global.logger.error(err);
        }
      }
    }
  }

  /**
   * 获取需要加载的插件队列
   */
  private getPluginFiles() {
    const pluginsDir = 'src/plugins';
    let list: PluginFile[] = [];

    const files = FileUtil.getDirFilesWithFileType(pluginsDir);
    for (let file of files) {
      let pluginPath = `${pluginsDir}/${file.name}`;
      let filePath = FileUtil.getFilePath(pluginPath);
      let importPath = `../plugins/${file.name}`;

      // 单个文件加载
      if (file.isFile()) {
        if (file.name.endsWith('.js')) {
          // 只处理js文件
          list.push({
            name: file.name,
            path: `${importPath}`
          });
        }
        continue;
      }

      // 文件夹模块加载
      if (FileUtil.isExist(`${filePath}/index.js`)) {
        list.push({
          name: file.name,
          path: `${importPath}/index.js`
        });
        continue;
      }

      // 文件夹分类加载
      let apps = FileUtil.getDirFilesWithFileType(pluginPath);
      for (let app of apps) {
        if (app.isFile() && app.name.endsWith('.js')) {
          list.push({
            name: app.name,
            path: `${importPath}/${app.name}`
          });
        }
      }
    }

    return list;
  }

  /**
   * 是否匹配事件
   * @param event 收到的事件
   * @param match 匹配字符串
   */
  private matchEvent(event: any, match: string): boolean {
    let eventMap = {
      'message': [ 'post_type', 'message_type', 'sub_type' ],
      'notice': [ 'post_type', 'notice_type', 'sub_type' ],
      'request': [ 'post_type', 'request_type', 'sub_type' ]
    };

    let list = eventMap[event.post_type];
    let currentEvent = `${event[list[0]]}.${event[list[1]]}.${event[list[2]]}`;

    return currentEvent.startsWith(match);
  }
}