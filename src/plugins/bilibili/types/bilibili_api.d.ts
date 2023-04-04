interface BILI_UserProfile {
  uid: string,
  uname: string,
  face: string
}

interface BILI_DynamicDto {
  dynamic_id: string,
  timestamp: number,
  user_profile: {
    info: BILI_UserProfile,
    pendant: {}
  }
}

interface BILI_DynamicData {
  cards: {
    desc: BILI_DynamicDto[]
  }
}

interface BILI_Response<T> {
  code: number,
  message: string,
  data: T
}