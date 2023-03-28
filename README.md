# XYBot-nodejs
an oicq-base bot written in Node.js

## Development Environment
| tools | version |
| :---: | :---: |
| node | 16.15.0 |
| npm | 8.5.5 |
| oicq | ^2.3.1 |

## Feature
1. use [pm2](https://pm2.keymetrics.io/) to manage application run as background job
2. use [ts-node](https://github.com/TypeStrong/ts-node) to execute typescript & javascript
3. dynamically manage plugins with schedule tasks
4. use [art-template](https://github.com/aui/art-template) to generate web page and [puppeteer](https://pptr.dev/) to screenshot

## How to run on cloud
1. prepare puppeteer running environment ([troubleshooting](https://pptr.dev/troubleshooting))
2. pull this project from github
3. install project dependencies `npm install`
4. run project `npm run start`
5. you may modify the configure files of project in `./config` and(or) restart

## Reference & Thanks
- [oicq](https://github.com/takayama-lily/oicq) Tencent QQ Bot Library for Node.js
- [Yunzai-Bot v3](https://github.com/Le-niao/Yunzai-Bot) 云崽v3.0，原神qq群机器人，通过米游社接口，查询原神游戏信息，快速生成图片返回
- [AdachiBOT](https://github.com/SilveryStar/Adachi-BOT) A Genshin Impact chatbot in Tencent QQ / 原神Q群助手