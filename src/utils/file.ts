import fs, { Dirent } from 'node:fs'
import { resolve } from 'path';
import * as yaml from 'yaml';

export type PresetPlace = "root" | "config" | "plugin";

interface FileUtilInterface {
  /**
   * 判断文件路径是否存在
   * @param path 文件路径
   */
  isExist(path: string): boolean;
  /**
   * 获取文件路径
   * @param path 文件路径
   * @param place 预设目录
   */
  getFilePath(path: string, place?: PresetPlace): string;
  /**
   * 获取文件夹内所有文件名
   * @param dirName 文件夹名称
   * @param place 预设目录
   */
  getDirFiles(dirName: string, place?: PresetPlace): string[];
  /**
   * 获取文件夹内所有文件对象
   * @param dirName 文件夹名称
   * @param place 预设目录
   */
  getDirFilesWithFileType(dirName: string, place?: PresetPlace): Dirent[];
  /**
   * 创建文件夹
   * @param dirName 文件夹名称
   * @param place 预设目录
   * @param recursive 是否逐层递归创建文件夹
   */
  createDir(dirName: string, place?: PresetPlace, recursive?: boolean): boolean;
  /**
   * 读取yaml文件
   * @param yamlName yaml文件名
   * @param place 预设目录
   */
  loadYAML(yamlName: string, place: PresetPlace): any;
  /**
   * 覆写yaml文件
   * @param yamlName yaml文件名
   * @param data yaml内容
   * @param place 预设目录
   */
  writeYAML(yamlName: string, data: any, place?: PresetPlace): void;
}

class FileUtil implements FileUtilInterface {
  public readonly root: string;
  public readonly config: string;
  public readonly plugins: string;

  constructor(root: string) {
    this.root = root;
    this.config = resolve(root, 'config');
    this.plugins = resolve(root, 'plugins');
  }

  public isExist(path: string): boolean {
		try {
			fs.accessSync(path);
			return true;
		} catch (err) {
			return false;
		}
  }

  public getFilePath(path: string, place: PresetPlace = 'root'): string {
    const h: string = place == "root"
        ? this.root
        : (place == "config" ? this.config : this.plugins);
    return resolve(h, path);
  }

  public getDirFiles(dirName: string, place?: PresetPlace): string[] {
    const path: string = this.getFilePath(dirName, place);
    return fs.readdirSync(path);
  }

  public getDirFilesWithFileType(dirName: string, place?: PresetPlace): Dirent[] {
    const path: string = this.getFilePath(dirName, place);
    return fs.readdirSync(path, { withFileTypes: true });
  }

  public createDir(dirName: string, place?: PresetPlace, recursive: boolean = false): boolean {
    const path: string = this.getFilePath(dirName, place);
    const exist: boolean = this.isExist(path);
    console.log(path, exist);
    if (!exist) {
      fs.mkdirSync(path, { recursive });
    }
    return exist;
  }

  public loadYAML(yamlName: string, place: PresetPlace = 'config'): any {
    const path: string = `${this.getFilePath(yamlName, place)}.yml`;
    const file: string = fs.readFileSync(path, 'utf-8');
    return yaml.parse(file) || {};
  }

  public writeYAML(yamlName: string, data: any, place: PresetPlace = 'config'): void {
    const path: string = `${this.getFilePath(yamlName, place)}.yml`;
    const opened: number = fs.openSync(path, 'w');
    fs.writeSync(opened, yaml.stringify(data));
    fs.closeSync(opened);
  }
}

export default new FileUtil(__dirname.replace(/src.*/, ''))