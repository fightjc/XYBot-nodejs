import axios from 'axios'

axios.defaults.timeout = 30000;
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
axios.defaults.headers['Accept-Language'] = 'zh-Hans';
axios.defaults.headers['User-Agent'] = 'PostmanRuntime/7.30.1';

export function gets(url: string, params: object): Promise<any> {
  return new Promise((resolve, reject) => {
    axios
      .get(url, { params })
      .then((response) => {
        resolve(response.data);
      }, (error) => {
        reject(error);
      })
      .catch((error) => {
        reject(error);
      });
  });
}