import { _decorator } from 'cc';
import './wechat.d';

/**
 * 跨平台存储适配器
 * 自动检测运行环境，在微信小程序中使用 wx.setStorageSync/wx.getStorageSync
 * 在其他平台使用 localStorage
 */
export class StorageAdapter {
    /**
     * 检查是否在微信小程序环境中
     */
    private static isWechatMiniProgram(): boolean {
        return typeof wx !== 'undefined' && 
               typeof wx.setStorageSync === 'function' && 
               typeof wx.getStorageSync === 'function';
    }

    /**
     * 设置存储项
     * @param key 键名
     * @param value 值
     */
    static setItem(key: string, value: string): void {
        try {
            if (this.isWechatMiniProgram()) {
                wx.setStorageSync(key, value);
                console.log(`[微信小程序存储] 保存: ${key} = ${value}`);
            } else {
                localStorage.setItem(key, value);
                console.log(`[localStorage存储] 保存: ${key} = ${value}`);
            }
        } catch (error) {
            console.error(`存储失败 ${key}:`, error);
        }
    }

    /**
     * 获取存储项
     * @param key 键名
     * @returns 存储的值，如果不存在则返回 null
     */
    static getItem(key: string): string | null {
        try {
            if (this.isWechatMiniProgram()) {
                const value = wx.getStorageSync(key);
                console.log(`[微信小程序存储] 读取: ${key} = ${value || 'null'}`);
                return value || null;
            } else {
                const value = localStorage.getItem(key);
                console.log(`[localStorage存储] 读取: ${key} = ${value || 'null'}`);
                return value;
            }
        } catch (error) {
            console.error(`读取失败 ${key}:`, error);
            return null;
        }
    }

    /**
     * 删除存储项
     * @param key 键名
     */
    static removeItem(key: string): void {
        try {
            if (this.isWechatMiniProgram()) {
                wx.removeStorageSync(key);
                console.log(`[微信小程序存储] 删除: ${key}`);
            } else {
                localStorage.removeItem(key);
                console.log(`[localStorage存储] 删除: ${key}`);
            }
        } catch (error) {
            console.error(`删除失败 ${key}:`, error);
        }
    }

    /**
     * 获取所有存储的键名
     * @returns 所有键名的数组
     */
    static getAllKeys(): string[] {
        try {
            if (this.isWechatMiniProgram()) {
                // 微信小程序获取所有键名
                const info = wx.getStorageInfoSync();
                console.log(`[微信小程序存储] 获取所有键名:`, info.keys);
                return info.keys || [];
            } else {
                // localStorage 获取所有键名
                const keys = Object.keys(localStorage);
                console.log(`[localStorage存储] 获取所有键名:`, keys);
                return keys;
            }
        } catch (error) {
            console.error('获取所有键名失败:', error);
            return [];
        }
    }

    /**
     * 清除所有存储数据
     */
    static clear(): void {
        try {
            if (this.isWechatMiniProgram()) {
                wx.clearStorageSync();
                console.log(`[微信小程序存储] 清除所有数据`);
            } else {
                localStorage.clear();
                console.log(`[localStorage存储] 清除所有数据`);
            }
        } catch (error) {
            console.error('清除所有数据失败:', error);
        }
    }

    /**
     * 获取存储信息
     * @returns 存储信息对象，包含键名数组和存储大小等
     */
    static getStorageInfo(): { keys: string[], currentSize?: number, limitSize?: number } {
        try {
            if (this.isWechatMiniProgram()) {
                const info = wx.getStorageInfoSync();
                console.log(`[微信小程序存储] 存储信息:`, info);
                return {
                    keys: info.keys || [],
                    currentSize: info.currentSize,
                    limitSize: info.limitSize
                };
            } else {
                const keys = Object.keys(localStorage);
                console.log(`[localStorage存储] 存储信息: 键数量=${keys.length}`);
                return {
                    keys: keys
                };
            }
        } catch (error) {
            console.error('获取存储信息失败:', error);
            return { keys: [] };
        }
    }
}
