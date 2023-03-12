import { Client } from 'oicq'

type EventData = {
  /** 事件名称前缀 */
  prefix?: string,
  /** 监听事件 */
  event: string | string[],
  /** 是否只监听一次 */
  once?: boolean
};

interface BaseEventInterface {
  execute(e: any): void;
}

export default class BaseEvent implements BaseEventInterface {
  public readonly prefix: string;
  public readonly event: string | string[];
  public readonly once: boolean;

  public client?: Client;

  constructor(data: EventData) {
    this.prefix = data.prefix || '';
    this.event = data.event;
    this.once = data.once || false;
  }

  execute(event: any) {
    throw new Error('Unimplement methods');
  }
}