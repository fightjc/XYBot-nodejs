import Bot from "../bot";
import { BotConfig } from "../config/botConfig";
import { Logger } from "../config/logger";
import { Redis } from "../config/redis";
import { PluginLoader } from "../plugins/pluginLoader";

declare global {
  var logger: Logger;
  var config: BotConfig;
  var bot: Bot;
  var redis: Redis;
  var pluginLoader: PluginLoader;
}

export {}