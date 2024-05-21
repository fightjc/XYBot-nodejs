import util from 'node:util'
import { Job, scheduleJob } from 'node-schedule';
import chokidar from 'chokidar'

import FileUtil from '../../utils/file'
import BasePlugin from './basePlugin';
import debouncer, { Debouncer } from './debouncer';
import switcher, { Switcher } from './switcher';

type PluginFile = {
  /** 插件名称 */
  name: string,
  /** 插件路径 */
  pluginPath: string,
  /** 引用路径 */
  importPath: string
};

type Plugin = {
  key: string,
  handler: BasePlugin
};

type Task = {
  key: string,
  handler: Job
};

interface PluginLoaderInterface {
  /** 加载插件 */
  load(): Promise<void>;
  /**
   * 调用插件响应事件
   * @param event 收到的事件
   */
  handle(event: any): Promise<void>;
}

export class PluginLoader implements PluginLoaderInterface {
  private readonly EventMap = {
    'message': [ 'post_type', 'message_type', 'sub_type' ],
    'notice': [ 'post_type', 'notice_type', 'sub_type' ],
    'request': [ 'post_type', 'request_type', 'sub_type' ]
  };

  private plugins: Plugin[];
  private tasks: Task[];
  private readonly switcher: Switcher;
  private readonly debouncer: Debouncer;
  private watchFilePaths: string[];

  constructor() {
    this.plugins = [];
    this.tasks = [];
    this.switcher = switcher;
    this.debouncer = debouncer;
    this.watchFilePaths = []; // 监测文件夹改动，防止重复
  }

  public async load() {
    await this.loadExterior();
    await this.loadInterior(); // 开关插件需要先加载所有外部插件后进行
  }

  public async handle(event: any) {
    // 是否是开关命令
    if (await this.switcher.handle(event)) {
      return;
    }

    for (let plugin of this.plugins) {
      // 是否是群插件且启用
      if (event.message_type == 'group' && !await this.switcher.checkGroupEnabled(event['group_id'], plugin.key)) {
        continue;
      }

      // 事件字符串是否匹配
      if (!this.matchEvent(event, plugin.handler.data.event)) {
        continue;
      }

      // 判断是否匹配正则
      if (!plugin.handler.data.rules) {
        continue;
      }
      for (let rule of plugin.handler.data.rules) {
        // 发起命令者是否有权限操作群插件
        if (!plugin.handler.checkPermission(event, rule)) {
          continue;
        }

        // 插件是否匹配
        if (!new RegExp(rule.reg).test(event.raw_message)) {
          continue;
        }

        // 插件方法是否可运行
        if (!plugin.handler[rule.func]) {
          global.logger.error(`找不到插件方法 ${plugin.key} - ${rule.func}`);
          continue;
        }

        // 插件是否仍在冷却时间
        if (!this.debouncer.checkEnabled(plugin.key)) {
          global.logger.error(`插件 ${plugin.key} 仍处于冷却时间当中`);

          // 返回限制信息
          let msg = `插件 [${plugin.key}] 仍处于冷却时间当中，请稍后再试`;
          if (event.group_id) {
            await global.bot.sendGroupMsg(event.group_id, msg);
          } else {
            await global.bot.sendPrivateMsg(event.sender.user_id, msg);
          }

          continue;
        }

        try {
          let res = plugin.handler[rule.func](event);
          if (util.types.isPromise(res)) {
            res = await res;
          }
        } catch (err) {
          global.logger.error(`执行插件方法 ${plugin.key} - ${rule.func} 出错:`);
          global.logger.error(err);
        }
      }
    }
  }

  /** 加载内部插件 */
  private async loadInterior() {
    global.logger.mark('开始加载内部插件...');

    // 群插件开关控制组件
    let pluginNameList: string[] = [];
    this.plugins.forEach(plugin => pluginNameList.push(plugin.key));
    await switcher.load(pluginNameList);

    // 群插件冷却控制组件
    await debouncer.load();

    global.logger.mark(`内部插件加载完成！`);
  }

  /** 加载外部插件 */
  private async loadExterior() {
    global.logger.mark('开始加载外部插件...');

    const files: PluginFile[] = this.getPluginFiles();
    for (let file of files) {
      try {
        let pluginClass = await import(FileUtil.getFilePath(file.importPath));
        if (!pluginClass.default || typeof pluginClass.default !== 'function') {
          continue;
        }

        // 插件实例化
        let plugin = new pluginClass.default();
        if (!BasePlugin.prototype.isPrototypeOf(plugin)) {
          continue;
        }
        await plugin.init();

        // 热更新
        this.addWatch(plugin.data.name, file.pluginPath);

        // 冷却组件
        this.debouncer.change(plugin.data.name, plugin.data.coolDownTime);

        this.plugins.push({
          key: plugin.data.name,
          handler: plugin
        });
      } catch (err) {
        global.logger.error(`加载插件文件错误: ${file.name}`);
        global.logger.error(err);
      }
    }

    // 加载定时任务
    await this.loadScheduleTask();

    global.logger.mark(`外部插件加载完成！一共加载了${this.plugins.length}个外部插件！`);
  }

  /** 加载插件定时任务 */
  private async loadScheduleTask() {
    global.logger.mark('开始加载定时任务...');
    let count: number = 0; // 统计定时任务数量

    for (let plugin of this.plugins) {
      let tasks = plugin.handler.data.tasks;
      if (!tasks || tasks.length == 0) {
        // 没有定时任务不处理
        continue;
      }
      
      for (let task of tasks) {
        // 定时方法是否可运行
        if (!plugin.handler[task.func]) {
          global.logger.error(`找不到定时方法 ${plugin.key} - ${task.func}`);
          continue;
        }

        let job: Job = scheduleJob(task.cron, async () => {
          try {
            let res = plugin.handler[task.func]();
            if (util.types.isPromise(res)) {
              res = await res;
            }
          } catch (err) {
            global.logger.error(`执行定时方法 ${plugin.key} - ${task.func} 出错:`);
            global.logger.error(err);
          }
        });

        // 存储定时任务供取消定时任务
        this.tasks.push({
          key: `${plugin.key}.${task.func}`,
          handler: job
        });
        count++;
      }
    }

    global.logger.mark(`定时任务加载完成！一共加载了${count}个定时任务！`);
  }

  /**
   * 监听插件热更新
   * @param key 插件标识
   * @param path 文件夹路径
   */
  private addWatch(key: string, pluginPath: string) {
    let filePath = FileUtil.getFilePath(pluginPath);
    if (this.watchFilePaths.includes(filePath)) {
      return;
    }
    this.watchFilePaths.push(filePath);
    
    const watcher = chokidar.watch(filePath, { ignoreInitial: true });
    // 文件新增
    if (FileUtil.isDirectory(filePath)) {
      watcher.on("add", async (path, stats) => {
        global.logger.mark(`检测到插件文件新增: ${path}，准备热更新...`);
        await this.reloadPlugin(pluginPath);
        global.logger.mark(`插件文件: ${pluginPath} 热更新完成.`);
      });
    }

    // 文件修改
    watcher.on("change", async (path, stats) => {
      if (path.includes("/config/")) {
        // 忽略config文件夹改动
        return;
      }
      global.logger.mark(`检测到插件文件修改: ${path}，准备热更新...`);
      await this.reloadPlugin(pluginPath);
      global.logger.mark(`插件文件: ${pluginPath} 热更新完成.`);
    });

    // 文件删除
    watcher.on("unlink", async (path, stats) => {
      global.logger.mark(`检测到插件文件删除: ${path}，准备热更新...`);
      if (FileUtil.isExist(path)) {
        await this.reloadPlugin(pluginPath);
        global.logger.mark(`插件文件: ${pluginPath} 热更新完成.`);
      } else {
        // 移除插件
        var pluginIndex = this.plugins.findIndex((p) => p.key == key);
        if (pluginIndex != -1) {
          delete this.plugins[pluginIndex];
        }
        // 移除监听
        watcher.removeAllListeners("change");
        var pathIndex = this.watchFilePaths.findIndex((p) => p == filePath);
        if (pathIndex != -1) {
          this.watchFilePaths.splice(pathIndex, 1);
        }
        global.logger.mark(`插件文件: ${pluginPath} 监听热更新已删除.`);
      }
    });
  }

  /**
   * 重载插件
   * @param path 文件夹路径
   */
  private async reloadPlugin(pluginPath: string) {
    var path = pluginPath, fileName, isFile = false;
    let pathComponents = pluginPath.split('/');
    if (pathComponents[pathComponents.length - 1].indexOf('.') > -1) {
      // 路径含有文件名
      isFile = true;
      fileName = pathComponents.pop();
      path = pathComponents.join('/');
    }

    // 删除旧文件引用缓存
    var filePath = FileUtil.getFilePath(path);
    Object.keys(require.cache).forEach((key) => {
      if (key.includes(filePath)) {
        delete require.cache[key];
      }
    });
    
    const files: PluginFile[] = this.getPluginFiles(path);
    for (let file of files) {
      if (isFile && file.name != fileName) {
        // 如果传入单文件，重载时只处理制定文件
        continue;
      }
      try {
        let pluginClass = await import(FileUtil.getFilePath(file.importPath));
        if (!pluginClass.default || typeof pluginClass.default !== 'function') {
          continue;
        }

        // 插件实例化
        let plugin: BasePlugin = new pluginClass.default();
        if (!BasePlugin.prototype.isPrototypeOf(plugin)) {
          continue;
        }
        await plugin.init();

        // 冷却组件
        this.debouncer.change(plugin.data.name, plugin.data.coolDownTime);

        // 替换旧插件
        var pluginIndex = this.plugins.findIndex((p) => p.key == plugin.data.name);
        if (pluginIndex != -1) {
          // 销毁旧插件
          this.plugins[pluginIndex].handler.destroy();
          // 替换新插件
          this.plugins[pluginIndex] = {
            key: plugin.data.name,
            handler: plugin
          };
        } else {
          this.plugins.push({
            key: plugin.data.name,
            handler: plugin
          });
        }

        // 定时任务
        let tasks = plugin.data.tasks;
        if (!tasks || tasks.length == 0) {
          // 没有定时任务不处理
          continue;
        }
        for (let task of tasks) {
          // 定时方法是否可运行
          if (!plugin[task.func]) {
            global.logger.error(`找不到定时方法 ${plugin.data.name} - ${task.func}`);
            continue;
          }
          let job: Job = scheduleJob(task.cron, async () => {
            try {
              let res = plugin[task.func]();
              if (util.types.isPromise(res)) {
                res = await res;
              }
            } catch (err) {
              global.logger.error(`执行定时方法 ${plugin.data.name} - ${task.func} 出错:`);
              global.logger.error(err);
            }
          });
          // 替换旧定时任务
          var taskKey = `${plugin.data.name}.${task.func}`;
          var taskIndex = this.tasks.findIndex((p) => p.key == taskKey);
          if (taskIndex != -1) {
            // 取消已有定时任务
            this.tasks[taskIndex].handler.cancel();
            this.tasks[taskIndex].handler = null;
            // 替换新任务
            this.tasks[taskIndex] = {
              key: taskKey,
              handler: job
            };
          } else {
            this.tasks.push({
              key: taskKey,
              handler: job
            });
          }
        }
      } catch (err) {
        global.logger.error(`加载插件文件错误: ${file.name}`);
        global.logger.error(err);
      }
    }
  }

  /**
   * 获取需要加载的插件队列
   * @param path 插件文件夹，默认 src/plugins
   */
  private getPluginFiles(path?: string) {
    const pluginsDir = path ?? 'src/plugins';
    let list: PluginFile[] = [];

    const files = FileUtil.getDirFilesWithFileType(pluginsDir);
    for (let file of files) {
      let pluginPath = `${pluginsDir}/${file.name}`;
      let filePath = FileUtil.getFilePath(pluginPath);

      // 单个文件加载
      if (file.isFile()) {
        if (file.name.endsWith('.js')) {
          // 只处理js文件
          list.push({
            name: file.name,
            pluginPath: pluginPath,
            importPath: pluginPath
          });
        }
        continue;
      }

      // 文件夹模块加载
      if (FileUtil.isExist(`${filePath}/index.js`)) {
        list.push({
          name: file.name,
          pluginPath: `${pluginPath}`,
          importPath: `${pluginPath}/index.js`
        });

        continue;
      }

      // 文件夹分类加载
      let apps = FileUtil.getDirFilesWithFileType(pluginPath);
      for (let app of apps) {
        if (app.isFile() && app.name.endsWith('.js')) {
          list.push({
            name: app.name,
            pluginPath: `${pluginPath}`,
            importPath: `${pluginPath}/${app.name}`
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
    if (!match) {
      // 字符串为空标记为不匹配
      return false;
    }

    let list = this.EventMap[event.post_type];
    let currentEvent = `${event[list[0]]}.${event[list[1]]}.${event[list[2]]}`;

    return currentEvent.startsWith(match);
  }
}

export default new PluginLoader()