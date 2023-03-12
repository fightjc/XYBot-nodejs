import { createClient } from 'redis';
import FileUtil from '../../utils/file'
import { sleep, execSync } from '../../utils/common'

type RedisConfig = {
  host: string,
  port: number,
  username?: string,
  password?: string,
  db: number
};

interface RedisInterface {
  getString(key: string): Promise<string>;
  setString(key: string, value: any, timeout?: number): Promise<void>;
  setTimeout(key: string, time: number): Promise<void>;
  deleteKey(key: string | string[]): Promise<void>;
  close(): Promise<void>;
}

/**
 * redis工具类
 * https://www.npmjs.com/package/redis
 */
export class Redis implements RedisInterface {
  private readonly filename: string = 'redis';
  private redisUrl: string;
  private cfg: RedisConfig;
  private client: any;

  constructor() {
    // 若文件不存在则创建文件
    if (!FileUtil.isExist(FileUtil.getFilePath(`${this.filename}.yml`, 'config'))) {
      if (global.logger) {
        global.logger.info(`检测到配置文件 ${this.filename}.yml 不存在，准备创建`);
      } else {
        console.log(`检测到配置文件 ${this.filename}.yml 不存在，准备创建`);
      }
      
      let data: RedisConfig = {
        host: '127.0.0.1',
        port: 6379,
        username: '',
        password: '',
        db: 0
      };
      FileUtil.createDir('config');
      FileUtil.writeYAML(this.filename, data);
    }

    const settings: RedisConfig = FileUtil.loadYAML(this.filename);

    this.cfg = {
      host: settings.host,
      port: settings.port ?? 6379,
      db: settings.db ?? 0
    };

    if (settings.username && settings.password) {
      this.cfg.password = settings.password;
      this.redisUrl = `redis://${this.cfg.username}:${this.cfg.password}@${this.cfg.host}:${this.cfg.port}/${this.cfg.db}`;
    } else {
      this.redisUrl = `redis://${this.cfg.host}:${this.cfg.port}/${this.cfg.db}`;
    }
  }

  public async connect() {
    this.client = createClient({ url: this.redisUrl });

    try {
      await this.client.connect();
    } catch (err: any) {
      if (err.toString() != 'Error: connect ECONNREFUSED 127.0.0.1:6379') {
        global.logger.error('redis连接失败');
        global.logger.error(err);
        return;
      }

      // 尝试本地开启redis服务
      let cmd = 'redis-server --save 900 1 --save 300 10 --daemonize yes'
      let arch = await this.aarch64();
      if (arch) {
        await this.startRedis(`${cmd}${arch}`);
      }
    }

    this.client.on('connect', () => {
      global.logger.info('redis已经连接完成！');
    });

    this.client.on('ready', () => {
      global.logger.info('redis已经准备完成！');
    });

    this.client.on('error', (err) => {
      global.logger.error('redis错误', err);
    });

    global.logger.info('redis初始化完成！');
  }

  public async getString(key: string): Promise<string> {
    return await this.client.get(key) ?? '';
  }

  public async setString(key: string, value: any, timeout?: number): Promise<void> {
    if (timeout === undefined) {
      await this.client.set(key, value);
    } else {
      await this.client.setEx(key, timeout, value);
    }
  }

  public async setTimeout(key: string, time: number): Promise<void> {
    this.client.expire(key, time);
  }

  public async deleteKey(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      for (let k of key) {
        this.client.del(k);
      }
    } else {
      this.client.del(key);
    }
  }

  public async close(): Promise<void> {
    await this.client.save();
    await this.client.quit();
  }

  /** redis命令架构参数 */
  private async aarch64 () {
    let tips = ''
    /** 判断arch */
    let arch = await execSync('arch')
    if (arch.stdout && arch.stdout.includes('aarch64')) {
      /** 判断redis版本 */
      let v = await execSync('redis-server -v')
      if (v.stdout) {
        v = v.stdout.match(/v=(\d)./)
        /** 忽略arm警告 */
        if (v && v[1] >= 6) tips = ' --ignore-warnings ARM64-COW-BUG'
      }
    }
    tips = ' --ignore-warnings ARM64-COW-BUG'
    return tips
  }

  /** 尝试本地启动redis */
  private async startRedis (cmd: string): Promise<void> {
    global.logger.info('尝试本地启动redis')
    await execSync(cmd)
    await sleep(500)
    try {
      /** 重新链接 */
      this.client = createClient({ url: this.redisUrl })
      await this.client.connect()
    } catch (err) {
      global.logger.error('请先开启Redis')
      global.logger.error(`redis启动命令：${cmd}`)
      process.exit()
    }
  }
}

export default new Redis()