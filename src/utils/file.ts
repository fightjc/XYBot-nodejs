import fs, { Dirent } from 'node:fs'
import { resolve } from 'path';
import * as yaml from 'yaml';

/**
 * root - 项目目录
 * config - 设置文件夹
 * plugins - 插件文件夹
 */
export type PresetPlace = "root" | "config" | "plugins";

interface FileUtilInterface {
  /**
   * 判断文件路径是否存在
   * @param path 文件路径
   */
  isExist(path: string): boolean;
  /**
   * 判断文件路径是否是文件夹
   * @param path 文件路径
   */
  isDirectory(path: string): boolean;
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
   * 删除文件
   * @param fileName 文件路径
   * @param place 预设目录
   */
  deleteFile(fileName: string, place?: PresetPlace): void;
  /**
   * 读取文件
   * @param fileName 文件路径
   * @param place 预设目录
   */
  loadFile(fileName: string, place?: PresetPlace): string;
  /**
   * 覆写文件
   * @param fileName 文件路径
   * @param data 文件内容
   * @param place 预设目录
   */
  writeFile(fileName: string, data: any, place?: PresetPlace): void;
  /**
   * 读取yaml文件
   * @param yamlName yaml文件名
   * @param place 预设目录，默认根目录config文件夹
   */
  loadYAML(yamlName: string, place: PresetPlace): any;
  /**
   * 覆写yaml文件
   * @param yamlName yaml文件名
   * @param data yaml内容
   * @param place 预设目录，默认根目录config文件夹
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
    this.plugins = resolve(root, 'src', 'plugins');
  }

  public isExist(path: string): boolean {
    try {
      fs.accessSync(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  public isDirectory(path: string): boolean {
    return fs.statSync(path).isDirectory();
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
    if (!exist) {
      fs.mkdirSync(path, { recursive });
    }
    return exist;
  }
  
  public deleteFile(fileName: string, place?: PresetPlace) {
    const path: string = this.getFilePath(fileName, place);
    fs.unlink(path, (err) => {
      if (err) {
        console.log(err);
      }
    })
  }

  public loadFile(fileName: string, place?: PresetPlace): string {
    const path: string = this.getFilePath(fileName, place);
    return fs.readFileSync(path, 'utf-8');
  }

  public writeFile(fileName: string, data: any, place?: PresetPlace): void {
    const path: string = this.getFilePath(fileName, place);
    const opened: number = fs.openSync(path, 'w');
    fs.writeSync(opened, data);
    fs.closeSync(opened);
  }

  public loadYAML(yamlName: string, place: PresetPlace = 'config'): any {
    const path: string = this.getFilePath(yamlName, place);
    const file: string = fs.readFileSync(path, 'utf-8');
    return yaml.parse(file) || {};
  }

  public writeYAML(yamlName: string, data: any, place: PresetPlace = 'config'): void {
    const path: string = this.getFilePath(yamlName, place);
    const opened: number = fs.openSync(path, 'w');
    fs.writeSync(opened, yaml.stringify(data));
    fs.closeSync(opened);
  }
}

export default new FileUtil(__dirname.replace(/src.*/, ''))