import moment from 'moment'

/** 配置文件 */
type AnnounceYaml = {
  calendar: number[]
};

type AnnounceType = 'event' | 'gacha' | 'award' | 'abyss' | 'other';

interface AnnounceDto {
  type: AnnounceType,
  title: string,
  startTime: moment.Moment,
  endTime: moment.Moment,
  isForever: boolean,
  deadline?: string
};

interface AnnounceTemplateDto {
  dateTime: string,
  list: AnnounceDto[]
}