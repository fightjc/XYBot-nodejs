/** 配置文件 */
type GroupSubscribe = {
  groupId: number,
  subscribes: string[]
};

type Dynamic = {
  uid: string,
  mid: string
};

type SubscribeYaml = {
  groups: GroupSubscribe[],
  dynamics: Dynamic[]
};