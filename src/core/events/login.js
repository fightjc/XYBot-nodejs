import BaseEvent from './baseEvent';
import { sleep } from '../../utils/common'

export default class LoginEvent extends BaseEvent {
  constructor() {
    super({
      prefix: 'system.login.',
      event: [ "qrcode", "slider", "device", "error" ],
      once: false
    });
  }

  execute(event) {}

  /** 扫码登录 */
  qrcode(event) {
    logger.info(`
请使用登录当前QQ的手机扫码完成登录，如果显示二维码过期，可以按下任意键刷新

等待扫码中...
    `);

    // 循环获取扫码结果，2s一次
    let time = 0;
    let interval = setInterval(async () => {
      let res = await this.client.queryQrcodeResult();
      if (res.retcode === 0) {
        logger.info('扫码成功，开始登录...');
        await sleep(1000);
        this.client.qrcodeLogin();
        clearInterval(interval);
      }
      
      time++;
      if (time >= 150) {
        // 等待超过 5(= 150 * 2 / 60) 分钟
        clearInterval(interval);
        logger.error('等待扫码超时，正在退出程序');
        process.exit();
      }
    }, 2000);

    process.stdin.on("data", async () => {
      clearInterval(interval);
      logger.info('重新刷新二维码');
      await sleep(1000);
      this.client.fetchQrcode();
    });
  }

  /** 滑动验证码登录，必须使用手机拉动，PC浏览器已经无效 */
  async slider(event) {
    logger.info(`
------ ↓↓ 滑动验证链接 ↓↓ ------
${event.url}
------ ↑↑ ------ ↑↑ ------
提示打开上面链接获取ticket，可使用 [ 滑动验证app ] 获取。
  [ 滑动验证app ] 下载地址: https://wwp.lanzouy.com/i6w3J08um92h 密码: 3kuu
链接存在有限期，请尽快操作，多次操作可能会导致qq被冻结。

等待输入验证码中...
    `);

    await sleep(200);

    process.stdin.on("data", async (data) => {
      // 去除引号和首尾空格
      let ticket = data.toString().replace(/\"/g, '').replace(/(^s*)|(s*$)/g, '');
      process.stdin.pause();
      this.client.submitSlider(ticket);
    });
  }

  /** 设备锁登录 */
  async device(event) {
    logger.info(`
------ ↓↓ 设备锁验证 ↓↓ ------
请选择验证方式，输入数字 1 或者 2:
1. 网页扫码验证
2. 发送短信验证码到密保手机
    `);

    await sleep(200);

    let firstTime = true;
    let choice = 0;
    process.stdin.on("data", async (data) => {
      if (firstTime) {
        choice = data.toString().trim() === '1' ? 1 : 2;
        if (choice == 1) {
          // 网页扫码验证
          logger.info(`
选择了 [ 网页扫码验证 ]
请打开下面链接，完成验证后按回车
${event.url}

等待操作中...
          `);
        } else {
          // 短信验证
          logger.info(`选择了 [ 短信验证 ]`);
          this.client.sendSmsCode();
          await sleep(200);
          logger.info(`
验证码已发送至手机: ${event.phone}
请输入短信验证码:
          `);
        }
        firstTime = false;
      } else {
        if (choice == 1) {
          await this.client.login();
        } else {
          let code = data.toString().trim();
          this.client.submitSmsCode(code);
        }
        process.stdin.pause();
      }
    });
  }

  /** 登录错误事件 */
  error(event) {
    logger.error(`
错误代码: ${event.code}
错误信息: ${event.message}
    `);
    const code = Number(event.code);
    if (code === 1) {
      logger.error('QQ密码错误，请修改配置文件后重新运行命令');
    } else if (code === 235 || code === 237) {
      logger.error('账号存在风险，请谨慎重试');
    } else if (event.message.includes('冻结')) {
      logger.error('账号已被冻结，正在退出程序');
    } else {
      logger.error('登录失败，正在退出程序');
    }

    process.exit();
  }
}