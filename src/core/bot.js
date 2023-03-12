import { Client } from 'oicq'
import eventLoader from './eventLoader.js'

export default class Bot extends Client {
  constructor (uin, conf) {
    super(uin, conf);
    
    /** 注册qq监听事件 */
    eventLoader.load(this);
  }
}