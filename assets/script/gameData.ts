import { Vec2 } from 'cc';

/**
 * 游戏设置管理类
 * 管理音效、音乐等全局设置
 */
export class GameSettings {
    private static _soundEffectEnabled: boolean = true;  // 音效开关
    private static _musicEnabled: boolean = true;        // 音乐开关

    /**
     * 获取音效开关状态
     * @returns 音效是否开启
     */
    static get soundEffectEnabled(): boolean {
        return this._soundEffectEnabled;
    }

    /**
     * 设置音效开关状态
     * @param enabled 是否开启音效
     */
    static set soundEffectEnabled(enabled: boolean) {
        this._soundEffectEnabled = enabled;
        console.log(`音效${enabled ? '开启' : '关闭'}`);
    }

    /**
     * 获取音乐开关状态
     * @returns 音乐是否开启
     */
    static get musicEnabled(): boolean {
        return this._musicEnabled;
    }

    /**
     * 设置音乐开关状态
     * @param enabled 是否开启音乐
     */
    static set musicEnabled(enabled: boolean) {
        this._musicEnabled = enabled;
        console.log(`音乐${enabled ? '开启' : '关闭'}`);
    }

    /**
     * 切换音效开关状态
     */
    static toggleSoundEffect(): void {
        this.soundEffectEnabled = !this.soundEffectEnabled;
    }

    /**
     * 切换音乐开关状态
     */
    static toggleMusic(): void {
        this.musicEnabled = !this.musicEnabled;
    }
}

// 关卡布局数据
// 每个关卡包含不同类型方块的位置信息
// 格式: { 关卡名称: { "宽_高": [位置数组] } }
export const blockLayout: { [levelName: string]: { [blockType: string]: Vec2[] } } = 
{
    "1": {
        "3_1": [new Vec2(2, 0), new Vec2(1, 5)],
        "2_1": [new Vec2(3, 4), new Vec2(0, 3)],
        "1_2": [new Vec2(1, 1)],
        "1_3": [new Vec2(3, 1), new Vec2(5, 2)]
    },
    "2": {
        "1_2": [new Vec2(4, 1), new Vec2(1, 1), new Vec2(0, 2)],
        "1_3": [new Vec2(3, 2)],
        "2_1": [new Vec2(4, 4), new Vec2(1, 3)],
        "3_1": [new Vec2(2, 5)]
    },
    "3": {
        "2_1": [new Vec2(2, 1), new Vec2(0, 3)],
        "1_3": [new Vec2(5, 1), new Vec2(2, 2)],
        "1_2": [new Vec2(3, 3), new Vec2(5, 4)]
    },
    "4": {
        "3_1": [new Vec2(0, 5)],
        "2_1": [new Vec2(1, 1), new Vec2(0, 3)],
        "1_3": [new Vec2(3, 1)],
        "1_2": [new Vec2(4, 0), new Vec2(5, 3)]
    },
    "5": {
        "2_1": [new Vec2(3, 1), new Vec2(0, 5), new Vec2(0, 3)],
        "3_1": [new Vec2(3, 0)],
        "1_2": [new Vec2(3, 4), new Vec2(1, 1)],
        "1_3": [new Vec2(5, 1)]
    },
    "6": {
        "3_1": [new Vec2(0, 4)],
        "2_1": [new Vec2(4, 1), new Vec2(0, 3)],
        "1_2": [new Vec2(2, 2)],
        "1_3": [new Vec2(4, 2)]
    },
    "7": {
        "2_1": [new Vec2(3, 5), new Vec2(0, 0), new Vec2(0, 1), new Vec2(0, 3), new Vec2(0, 5)],
        "1_2": [new Vec2(3, 3), new Vec2(5, 3)],
        "3_1": [new Vec2(3, 2)]
    },
    "8": {
        "1_2": [new Vec2(0, 3)],
        "2_1": [new Vec2(4, 2), new Vec2(0, 0), new Vec2(1, 3)],
        "1_3": [new Vec2(2, 0), new Vec2(4, 3)]
    },
    "9": {
        "2_1": [new Vec2(2, 2), new Vec2(0, 3), new Vec2(0, 4)],
        "1_2": [new Vec2(1, 0), new Vec2(2, 4)],
        "1_3": [new Vec2(5, 0), new Vec2(4, 2)],
        "3_1": [new Vec2(2, 0)]
    },
    "10": {
        "1_2": [new Vec2(4, 3)],
        "1_3": [new Vec2(2, 0), new Vec2(1, 1), new Vec2(0, 3)],
        "2_1": [new Vec2(0, 0), new Vec2(3, 0), new Vec2(2, 3), new Vec2(3, 5), new Vec2(1, 5)],
        "3_1": [new Vec2(3, 1), new Vec2(3, 2), new Vec2(1, 4)]
    },
    "11": {
        "2_1": [new Vec2(0, 5), new Vec2(0, 3), new Vec2(1, 1)],
        "1_2": [new Vec2(2, 2), new Vec2(3, 3)],
        "3_1": [new Vec2(3, 2), new Vec2(3, 5)]
    },
    "12": {
        "1_3": [new Vec2(5, 2), new Vec2(3, 0), new Vec2(0, 0)],
        "2_1": [new Vec2(4, 1), new Vec2(0, 3)],
        "3_1": [new Vec2(3, 5)],
        "1_2": [new Vec2(4, 2)]
    },
    
};


// 完成关卡布局数据
// 每个关卡包含不同类型方块的位置信息
// 格式: { 关卡名称: { "宽_高": [位置数组] } }
export const blockCompletedLayout: { [levelName: string]: { [blockType: string]: Vec2[] } } = 
{
    "1": {
        "3_1": [new Vec2(0, 0), new Vec2(1, 5)],
        "2_1": [new Vec2(3, 4), new Vec2(0, 3)],
        "1_2": [new Vec2(1, 1)],
        "1_3": [new Vec2(3, 0), new Vec2(5, 0)]
    },
    "2": {
        "1_2": [new Vec2(4, 1), new Vec2(1, 1), new Vec2(0, 2)],
        "1_3": [new Vec2(3, 0)],
        "2_1": [new Vec2(4, 4), new Vec2(1, 3)],
        "3_1": [new Vec2(2, 5)]
    },
    "3": {
        "2_1": [new Vec2(0, 1), new Vec2(0, 3)],
        "1_3": [new Vec2(5, 0), new Vec2(2, 0)],
        "1_2": [new Vec2(3, 4), new Vec2(5, 4)]
    },
    "4": {
        "3_1": [new Vec2(0, 5)],
        "2_1": [new Vec2(1, 1), new Vec2(0, 3)],
        "1_3": [new Vec2(3, 0)],
        "1_2": [new Vec2(4, 0), new Vec2(5, 4)]
    },
    "5": {
        "2_1": [new Vec2(3, 1), new Vec2(0, 5), new Vec2(0, 3)],
        "3_1": [new Vec2(0, 0)],
        "1_2": [new Vec2(3, 4), new Vec2(1, 1)],
        "1_3": [new Vec2(5, 0)]
    },
    "6": {
        "3_1": [new Vec2(0, 4)],
        "2_1": [new Vec2(0, 1), new Vec2(0, 3)],
        "1_2": [new Vec2(2, 0)],
        "1_3": [new Vec2(4, 0)]
    },
    "7": {
        "2_1": [new Vec2(3, 5), new Vec2(0, 0), new Vec2(0, 1), new Vec2(0, 3), new Vec2(0, 5)],
        "1_2": [new Vec2(3, 0), new Vec2(5, 0)],
        "3_1": [new Vec2(0, 2)]
    },
    "8": {
        "1_2": [new Vec2(0, 4)],
        "2_1": [new Vec2(0, 2), new Vec2(0, 0), new Vec2(0, 3)],
        "1_3": [new Vec2(2, 0), new Vec2(4, 0)]
    },
    "9": {
        "2_1": [new Vec2(2, 2), new Vec2(0, 3), new Vec2(0, 4)],
        "1_2": [new Vec2(1, 1), new Vec2(2, 4)],
        "1_3": [new Vec2(5, 0), new Vec2(4, 0)],
        "3_1": [new Vec2(0, 0)]
    },
    "10": {
        "1_2": [new Vec2(4, 4)],
        "1_3": [new Vec2(2, 0), new Vec2(1, 1), new Vec2(0, 1)],
        "2_1": [new Vec2(0, 0), new Vec2(3, 0), new Vec2(2, 3), new Vec2(2, 5), new Vec2(0, 5)],
        "3_1": [new Vec2(3, 1), new Vec2(3, 2), new Vec2(1, 4)]
    },
    "11": {
        "2_1": [new Vec2(0, 5), new Vec2(0, 3), new Vec2(4, 1)],
        "1_2": [new Vec2(2, 0), new Vec2(3, 0)],
        "3_1": [new Vec2(0, 2), new Vec2(3, 5)]
    },
    "12": {
        "1_3": [new Vec2(5, 0), new Vec2(3, 0), new Vec2(0, 0)],
        "2_1": [new Vec2(1, 1), new Vec2(0, 3)],
        "3_1": [new Vec2(3, 5)],
        "1_2": [new Vec2(4, 0)]
    },
};