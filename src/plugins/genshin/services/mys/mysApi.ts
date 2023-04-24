import md5 from 'md5';

import { gets, posts } from '../../../../utils/httpHelper';
import { random } from '../../../../utils/common';

const activityId = "e202009291139501";
const genshinAppVersion = '2.37.1';
const genshinClientType = 5;
const genshinSalt = 'Qqx8cyv7kuyD8fTw11SmvXSFHp7iZD29';
const device = 'xiaomi';

const defaultHeaders = {
  'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/${genshinAppVersion}`,
  'Referer': 'https://webstatic.mihoyo.com/',
  'X-Requested-With': 'com.mihoyo.hyperion',
};

const defaultSignHeaders = {
  ...defaultHeaders,
  'Referer': `https://webstatic.mihoyo.com/bbs/event/signin-ys/index.html?bbs_auth_required=true&act_id=${activityId}&utm_source=bbs&utm_medium=mys&utm_campaign=icon`,
  'x-rpc-app_version': genshinAppVersion,
  'x-rpc-client_type': genshinClientType,
  'x-rpc-platform': 'android',
  'x-rpc-device_model': device,
  'x-rpc-device_name': device,
  'x-rpc-channel': 'miyousheluodi',
  'x-rpc-sys_version': '6.0.1'
}

interface MYS_GameRole {
  game_biz: string,
  region: string,
  game_uid: string,
  nickname: string,
  level: number,
  is_chosen: boolean,
  region_name: string,
  is_official: boolean
}

/**
 * 通过登录缓存获取原神游戏内用户信息
 * @param cookie 登录缓存
 */
export async function getGameRoleByCookie(cookie: string): Promise<MYS_GameRole | null> {
  const url = 'https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie';
  const params = {
    'game_biz': 'hk4e_cn'
  };
  const headers = {
    ...defaultHeaders,
    'Cookie': cookie
  };
  try {
    const response = await gets(url, params, headers);
    if (response.retcode == 0) {
      const list = response.data.list;
      if (list && list.length > 0) {
        return list[0] as MYS_GameRole;
      } else {
        global.logger.error(`访问米游社cookie查询角色信息接口返回数据格式错误: [${response.retcode}] ${response.message} ${response.data}`);
      }
    } else {
      global.logger.error(`访问米游社cookie查询角色信息接口返回失败: [${response.retcode}] ${response.message}`);
    }
  } catch(e) {
    global.logger.error(`访问米游社cookie查询角色信息接口失败: ${e}`);
  }
  return null;
}

interface MYS_SignInfo {
  total_sign_day: number,
  today: string,
  is_sign: boolean,
  first_bind: boolean,
  is_sub: boolean,
  month_first: boolean,
  sign_cnt_missed: number,
  month_last_day: boolean
}

/**
 * 获取原神签到信息
 * @param uid 用户游戏id
 * @param region 游戏服标识
 * @param deviceId 设备id
 * @param cookie 登录缓存
 */
export async function getSignInfo(uid: string, region: string, deviceId: string, cookie: string): Promise<MYS_SignInfo | null> {
  const url = 'https://api-takumi.mihoyo.com/event/bbs_sign_reward/info';
  const params = {
    'act_id': activityId,
    'region': region, // cn_gf01 官服 cn_qd01 B服
    'uid': uid
  };
  const headers = {
    ...defaultHeaders,
    'Cookie': cookie
  };

  try {
    const response = await gets(url, params, headers);
    if (response.retcode == 0) {
      return response['data'] as MYS_SignInfo;
    } else {
      global.logger.error(`访问米游社查询用户签到接口返回失败: [${response.retcode}] ${response.message}`);
    }
  } catch(e) {
    global.logger.error(`访问米游社查询用户签到接口失败: ${e}`);
  }

  return null;
}

interface MYS_Sign {
  code: string,
  risk_code: number,
  gt: string,
  challenge: string,
  success: number
}

/**
 * 米游社原神签到
 * @param uid 用户游戏id
 * @param deviceId 设备id
 * @param cookie 登录缓存
 */
export async function signReward(uid: string, region: string, deviceId: string, cookie: string): Promise<MYS_Sign | null> {
  const url = 'https://api-takumi.mihoyo.com/event/bbs_sign_reward/sign';
  const params = {
    'act_id': activityId,
    'region': region, // cn_gf01 官服 cn_qd01 B服
    'uid': uid
  };
  const headers = {
    ...defaultSignHeaders,
    'x-rpc-device_id': deviceId,
    'DS': getDS(),
    'Cookie': cookie
  };

  try {
    const response = await posts(url, params, headers);
    if (response.retcode == 0) {
      return response['data'] as MYS_Sign;
    } else {
      global.logger.error(`访问米游社用户签到接口返回失败: [${response.retcode}] ${response.message}`);
    }
  } catch(e) {
    global.logger.error(`访问米游社用户签到接口失败: ${e}`);
  }

  return null;
}

/**
 * 原神签到DS算法
 */
function getDS(): string {
  const t = new Date().getTime() / 1000 | 0;
  const r = randomString(6);
  const DS = md5(`salt=${genshinSalt}&t=${t}&r=${r}`);
  return `${t},${r},${DS}`;
}

/**
 * 获取一段指定长度的随机内容字符串
 * @param n 字符串长度
 */
function randomString(n: number): string {
  const sample = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let last = sample.length - 1;

  let temp: string[] = [];
  for (let index = 0; index < n; index++) {
    var rand = random(index, last);
    temp.push(sample[rand]);
  }
  return temp.join('');
}