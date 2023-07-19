import puppeteer, { Browser, Page, KnownDevices, ScreenshotOptions } from 'puppeteer'

interface RendererInterface {
  /** 关闭浏览器 */
  closeBrowser(): Promise<void>;
  /** 开启浏览器 */
  launchBrowser(): Promise<void>;
  /** 重启浏览器 */
  restartBrowser(): Promise<void>;
  /**
   * 截图网页
   * @param url 访问地址
   * @param selector 指定元素
   */
  screenshot(url: string, selector?: string): Promise<string>;
};

export class Renderer implements RendererInterface {
  private browser?: Browser;
  private screenshotCount: number = 0;

  constructor() {
    this.launchBrowser().then(() => {});
  }

  public async closeBrowser(): Promise<void> {
    if (!this.browser) {
      return;
    }
    const pages = await this.browser.pages();
    await Promise.all(pages.map(page => page.close()));
    try {
      await this.browser.close();
    } catch (e) {
      global.logger.error(`关闭浏览器异常: ${e}`);
    }
    this.browser = undefined;
  }

  public async launchBrowser(): Promise<void> {
    if (this.browser) {
      global.logger.info('浏览器已启动');
    }
    try {
      // refs: https://peter.sh/experiments/chromium-command-line-switches/
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--disable-gpu',            // 不启用GPU硬件加速
          '--disable-dev-shm-usage',  // 不创建临时文件 /dev/shm 共享内存(可能导致浏览器失败或崩溃)
          '--disable-setuid-sandbox', // 不启用 setuid 沙盒
          '--no-first-run',           // 不设置首页，跳过首次开启任务
          '--no-sandbox',             // 不启用沙盒模式
          '--no-zygote',              // 不使用 zygote 派生子进程
          '--single-process'          // 单进程运行渲染和插件
        ]
      });
      this.browser = browser;
      global.logger.mark('启动浏览器成功!');
    } catch (e) {
      global.logger.error(`启动浏览器失败: ${e}`);
    }
  }

  public async restartBrowser(): Promise<void> {
    await this.closeBrowser();
    await this.launchBrowser();
    this.screenshotCount = 0;
  }

  public async screenshot(url: string, selector?: string, savePath?: string): Promise<string> {
    if (!this.browser) {
      throw new Error('浏览器未启动');
    }
    const page: Page = await this.browser.newPage();
    await page.emulate(KnownDevices['iPhone X']); // 模拟 iPhone X 机型
    try {
      await page.goto(url, {
        timeout: 30 * 1000,
        waitUntil: [
          // 'load',                 //等待 “load” 事件触发
          // 'domcontentloaded',     //等待 “domcontentloaded” 事件触发
          'networkidle0',         //在 500ms 内没有任何网络连接
          // 'networkidle2'          //在 500ms 内网络连接个数不超过 2 个
        ]
      });
      if (selector) {
        await page.waitForSelector(selector);
      }
      // 可额外针对 elements 进行js处理
      // await page.evaluate((selector) => {}, '');

      let base64: string | Buffer = '';
      let options: ScreenshotOptions = savePath ? {
        path: savePath,
        type: 'jpeg',
        quality: 90,
      } : {
        type: 'jpeg',
        quality: 90,
        encoding: 'base64'
      };
      if (selector) {
        const $selector = await page.$(selector);
        if ($selector) {
          base64 = await $selector.screenshot(options);
        }
      } else {
        options.fullPage = true;
        base64 = await page.screenshot(options);
      }
      
      await page.close();
  
      // 缓存清理
      this.screenshotCount++;
      if (this.screenshotCount >= 200) {
        await this.restartBrowser();
      }

      return `base64://${base64}`;
    } catch (e) {
      await page.close();
      throw e;
    }
  }
  
  // private async pageLoaded(page: Page) {
  //   await page.waitForFunction(() => {
  //     return document.readyState === "complete";
  //   }, { timeout: 10000 });
  // }
}

export default new Renderer();