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

interface BILI_Dynamic_Normal {
  desc: string,
  pics: {
    width: number,
    height: number,
    src: string
  }[]
}

interface BILI_Dynmic_Video {
  dynamic: string,
  title: string,
  desc: string,
  pic: string,
  view: number,
  like: number,
  coin: number,
  collect: number
}

interface BILI_DynamicDto {
  user: {
    uid: number,
    uname: string,
    face: string,
    pendant?: string,
    ornament?: {
      card: string,
      num: string,
      color: string
    }
  },
  dynamicId: string,
  dateTime: string,
  type: number,
  content: BILI_Dynamic_Normal | BILI_Dynmic_Video | null
}

/**
 * 获取指定b站用户最新的动态
 * @param mid b站用户id
 * @param offset 动态id，如果有值则只查询此动态id往前的动态
 */
export async function getUserDynamic(mid: string, offset?: string): Promise<BILI_DynamicDto[]> {
  const url = 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history';
  const params = {
    'host_uid': mid,
    'need_top': 0,
    'platform': 'web',
    // 'offset_dynamic_id': '' // 从 offset_dynamic_id 开始往前找10条
  };
  
  let list: BILI_DynamicDto[] = [];
  try {
    const response = await gets(url, params, headers);
    if (response.code == 0) {
      const cards = response.data.cards;
      const max_result_count = 3; // 一次最多取最近3条动态
      for (let i = 0; i < cards.length && i < max_result_count; i++) {
        const card = cards[i];
        const desc = card['desc'];

        if (offset && desc.dynamic_id_str == offset) {
          break;
        }

        if (moment().valueOf() - desc.timestamp * 1000 > 5 * 60 * 1000) {
          // 大于5分钟的动态不推送
          break;
        }

        // up主信息
        const info = desc.user_profile.info;
        const userData = {
          uid: info.uid,
          uname: info.uname,
          face: info.face,
          pendant: desc.user_profile.pendant?.image,
          ornament: {
            card: desc.user_profile.decorate_card?.card_url,
            num: desc.user_profile.decorate_card?.fan.num_desc,
            color: desc.user_profile.decorate_card?.fan.color
          }
        };

        // 动态信息
        const type: number = desc.type;
        let content;
        if (type == 2) { // 发布图文
          const item = JSON.parse(card.card).item;
          let picList = item.pictures.map(pic => {
            return {
              width: pic.img_width,
              height: pic.img_height,
              src: pic.img_src
            }
          });
          content = {
            desc: item.description,
            pics: picList
          } as BILI_Dynamic_Normal;
        } else if (type == 8) { // 发布视频
          const cardInfo = JSON.parse(card.card);
          content = {
            dynamic: cardInfo.dynamic,
            title: cardInfo.title,
            desc: cardInfo.desc,
            pic: cardInfo.pic,
            view: cardInfo.stat.view,
            like: cardInfo.stat.like,
            coin: cardInfo.stat.coin,
            collect: cardInfo.stat.favorite
          } as BILI_Dynmic_Video;
        } else {
          // 其它动态类型暂不处理
          continue;
        }
        
        list.push({
          user: userData,
          dynamicId: desc.dynamic_id_str,
          dateTime: moment(desc.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss'),
          type: type,
          content: content
        });
      }
    } else {
      global.logger.error(`访问bilibili获取用户动态接口返回失败: ${response.message}`);
    }
  } catch(e) {
    global.logger.error(`访问bilibili获取用户动态接口失败: ${e}`);
  }

  return list;
}