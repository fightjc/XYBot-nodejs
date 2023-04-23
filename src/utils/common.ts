/**
 * 休眠函数
 * @param ms 睡眠时间毫秒
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 获取 [min, max] 范围内的一个随机数
 * @param min 最小值
 * @param max 最大值
 */
export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 创建子进程执行命令
 * @param cmd 命令
 */
export async function execSync (cmd: string): Promise<any> {
  return new Promise((resolve, reject) => {
    require('child_process').exec(cmd, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr })
    });
  });
}

/**
 * 生成一个 (v4 random) uuid
 */
export function uuidv4(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, el => {
    const r: number = Math.random() * 16 | 0;
    const v: number = el == "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}