import * as mysApi from './mysApi'
import mysConfig from './mysConfig'
import { uuidv4 } from '../../../../utils/common';

/**
 * 通过缓存到本地的米游社账号信息进行原神签到
 * @param config 本地米游社账号缓存数据
 */
async function mysGenshinSignIn(config: any): Promise<string> {
  // 获取原神签到信息
  const signInfo = await mysApi.getSignInfo(config.uid, config.region, config.deviceId, config.cookie);
  if (signInfo == null) {
    return '获取用户米游社签到福利信息失败，请尝试重新绑定cookie';
  }
  if (signInfo.first_bind) {
    return '首次签到请手动打开米游社app进行签到';
  }
  if (signInfo.is_sign) {
    return '今日已签到，请勿重复签到';
  }

  // 签到原神
  const sign = await mysApi.signReward(config.uid, config.region, config.deviceId, config.cookie);
  if (sign == null) {
    return '签到失败';
  }
  if (sign.risk_code == 375) {
    return '签到需要验证码，请手动签到';
  }

  return '签到成功';
}

/**
 * 单个用户原神签到
 * @param userId qq号
 */
export async function signIn(userId: string): Promise<string> {
  // 获取用户配置的米游社账号信息
  const config = mysConfig.getConfig(userId);
  if (config == null) {
    return '获取用户绑定米游社账号信息失败，请先绑定米游社账号';
  }

  return await mysGenshinSignIn(config);
}

/**
 * 批量原神签到
 */
export async function signInAll(): Promise<string> {
  let result = "原神批量签到: ";

  let data = mysConfig.getAll();
  if (Object.keys(data).length == 0) {
    // 没有需要签到的用户
    return '';
  }

  for (let userId in data) {
    result += `\n账号${userId}: ${await mysGenshinSignIn(data[userId])}`;
  }
  return result;
}

/**
 * 保存米游社账号缓存到本地文件
 * @param userId qq号
 * @param cookie 米游社账号缓存
 */
export async function saveConfig(userId: string, cookie: string): Promise<string> {
  // 验证cookie是否正确
  let data = await mysApi.getGameRoleByCookie(cookie);
  if (data == null) {
    return '获取米游社账号信息失败，请检查cookie是否正确';
  }

  if (!data.region.startsWith('cn')) {
    return '暂不支持国际服签到';
  }

  const config = {
    uid: data.game_uid,
    region: data.region,
    deviceId: uuidv4(), // 随机设备id
    cookie: cookie
  };
  mysConfig.setConfig(userId, config);

  return '绑定米游社账号成功';
}