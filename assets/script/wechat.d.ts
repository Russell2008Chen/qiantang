/**
 * 微信小程序 API 类型定义
 * 为微信小程序的存储 API 提供类型支持
 */

declare namespace wx {
    /**
     * 同步设置本地数据缓存
     * @param key 本地缓存中指定的 key
     * @param data 需要存储的内容
     */
    function setStorageSync(key: string, data: any): void;

    /**
     * 同步获取本地数据缓存
     * @param key 本地缓存中指定的 key
     * @returns 本地缓存中指定 key 对应的内容
     */
    function getStorageSync(key: string): any;

    /**
     * 同步删除本地数据缓存
     * @param key 本地缓存中指定的 key
     */
    function removeStorageSync(key: string): void;

    /**
     * 同步清理本地数据缓存
     */
    function clearStorageSync(): void;

    /**
     * 同步获取当前storage的相关信息
     * @returns 存储信息
     */
    function getStorageInfoSync(): {
        /** 当前占用的空间大小, 单位 KB */
        currentSize: number;
        /** 限制的空间大小，单位 KB */
        limitSize: number;
        /** 当前 storage 中所有的 key */
        keys: string[];
    };
}

// 全局声明 wx 对象
declare const wx: typeof wx | undefined;
