import moment from 'moment';
import { gets } from '../../../utils/httpHelper';

//TODO: 第一次打开首页后通过cookie获取
const headers = {
  'Cookie': 'buvid3=7671DA50-FF36-CB22-9E3F-FA0A4E0B254E67274infoc'
};

interface BILI_SearchUserDto {
  mid: number,
  uname: string,
  fans: number,
  usign: string
}

/**
 * 通过关键词搜索b站用户(只显示10个)
 * @param keyword 搜索用户名称关键词
 */
export async function searchUser(keyword: string): Promise<BILI_SearchUserDto[]> {
  const url = 'https://api.bilibili.com/x/web-interface/search/type';
  const params = {
    'page_size': 10,
    'search_type': 'bili_user',
    'keyword': keyword
  };
  
  let list: BILI_SearchUserDto[] = [];
  try {
    const response = await gets(url, params, headers);
    if (response.code == 0) {
      const data = response['data'];
      const result = data['result'];
      for (let user of result) {
        list.push({
          mid: user.mid,
          uname: user.uname,
          fans: user.fans,
          usign: user.usign.trim()
        });
      }
    } else {
      global.logger.error(`访问bilibili查询用户接口返回失败: ${response.message}`);
    }
  } catch(e) {
    global.logger.error(`访问bilibili查询用户接口失败: ${e}`);
  }

  return list;
}

interface BILI_UserData {
  mid: number,
  name: string,
  sex: string,
  sign: string
}

/**
 * 通过id搜索b站用户
 * @param mid b站用户id
 */
export async function getUserInfo(mid: number): Promise<BILI_UserData | null> {
  const url = 'https://api.bilibili.com/x/space/acc/info';
  const params = {
    'mid': mid
  };
  
  try {
    const response = await gets(url, params, headers);
    if (response.code == 0) {
      const data = response['data'];
      return {
        mid: data.mid,
        name: data.name,
        sex: data.sex,
        sign: data.sign.trim()
      }
    } else {
      global.logger.error(`访问bilibili获取用户信息接口返回失败: ${response.message}`);
    }
  } catch(e) {
    global.logger.error(`访问bilibili获取用户信息接口失败: ${e}`);
  }

  return null;
}

export async function getUserDynamic(mid: string, offset?: string) {
  const url = 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history';
  const params = {
    'host_uid': mid,
    'need_top': 0,
    'platform': 'web'
  };
  if (offset) {
    params['offset_dynamic_id'] = offset;
  }
  
  let list = [];
  try {
    const response = await gets(url, params, headers);
    console.log(response);
    if (response.code == 0) {
      const data = response['data'];
      const cards = data['cards'];
      const max_result_count = 1; // 一次最多取最近3条动态
      for (let i = 0; i < cards.length && i < max_result_count; i++) {
        const card = cards[i];
        const desc = card['desc'];
        if (offset && desc['dynamic_id'] == offset) {
          break;
        }
        if (moment().milliseconds() - desc['timestamp'] * 1000 > 5 * 60 * 1000) {
          // 大于5分钟的动态不推送
          break;
        }
      }
    } else {
      global.logger.error(`访问bilibili获取用户动态接口返回失败: ${response.message}`);
    }
  } catch(e) {
    global.logger.error(`访问bilibili获取用户动态接口失败: ${e}`);
  }
}