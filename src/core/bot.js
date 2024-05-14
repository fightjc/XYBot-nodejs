import { Client } from 'icqq'
import eventLoader from './events/eventLoader'

export default class Bot extends Client {
  constructor (config) {
    super(config);
    
    /** 注册qq监听事件 */
    eventLoader.load(this);
  }
}