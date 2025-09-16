import { _decorator, Component, Node, Vec3, tween, log, AudioClip, AudioSource } from 'cc';
import { GameSettings } from './gameData';
import { game } from './game';
import { common } from './common';
import { StorageAdapter } from './storageAdapter';
const { ccclass, property } = _decorator;

@ccclass('menu')
export class menu extends Component {
    @property([Node])
    menuButtons: Node[] = [];  // 菜单子按钮数组

    @property(Node)
    menuButton: Node = null;  // 起点节点，用于定位菜单子按钮排列的最终位置

    @property(Node)
    menuCloseButton: Node = null;  // 起点节点，用于定位菜单子按钮排列的最终位置

    @property(Node)
    hintButton: Node = null;  // 提示按钮

    @property(Node)
    replayButton: Node = null;  // 重放按钮

    @property(Node)
    musicButton: Node = null;  // 音乐按钮

    @property(Node)
    stopMusicButton: Node = null;  // 停止音乐按钮

    @property(Node)
    soundEffectButton: Node = null;  // 音效按钮

    @property(Node)
    stopSoundEffectButton: Node = null;  // 停止音效按钮

    @property(Node)
    endPoint: Node = null;  // 终点节点，用于定位菜单子按钮排列的最终位置

    @property
    animationSpeed: number = 1.0;  // 动画速度

    @property(AudioClip)
    startSoundClip: AudioClip = null;

    @property(game)
    gameComponent: game = null;

    // 音频源组件
    private audioSource: AudioSource = null;

    start() {
        // 初始化音频源组件
        this.audioSource = this.node.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.node.addComponent(AudioSource);
        }
        // 初始化菜单组件
        this.reset();
    }

    /**
     * 播放start音效
     */
    private playStartSound(): void {
        // 检查音效开关是否为true
        if (!GameSettings.soundEffectEnabled) {
            console.log('音效关闭，不播放start音效');
            return; // 音效关闭时直接返回
        }
        
        if (this.audioSource && this.startSoundClip) {
            this.audioSource.playOneShot(this.startSoundClip);
        }
    }

    update(deltaTime: number) {
        
    }

    /**
     * 点击菜单按钮，展开子按钮
     */
    onMenuButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        this.menuCloseButton.active = true;
        this.hintButton.active = false;
        this.replayButton.active = false;
        this.menuButton.active = false;
        
        const startPos = this.menuButton.position;
        const endPos = this.endPoint.position;

        // 计算从当前节点到endPoint的向量
        const direction = new Vec3();
        Vec3.subtract(direction, endPos, startPos);

        // 遍历所有菜单按钮，计算目标位置并执行动画
        const buttonCount = this.menuButtons.length;
        
        for (let i = 0; i < buttonCount; i++) {
            // 计算每个按钮在线段上的位置比例 (从1/buttonCount到buttonCount/buttonCount)
            const ratio = (i + 1) / buttonCount;
            
            // 计算按钮的目标位置
            const targetPos = new Vec3();
            Vec3.multiplyScalar(targetPos, direction, ratio);
            Vec3.add(targetPos, startPos, targetPos);

            const button = this.menuButtons[i];

            // 启用按钮
            button.active = true;

            // 重置按钮位置到起点
            button.position = startPos.clone();

            // 计算动画时间（基于距离和速度）
            const distance = Vec3.distance(startPos, targetPos);
            const duration = distance / (200 * this.animationSpeed); // 200是基础速度参数

            // 创建动画，将按钮从起点移动到目标位置（匀速）
            tween(button)
                // .to(duration, { position: targetPos }, { easing: 'linear' })
                .to(duration, { position: targetPos }, { easing: 'smooth' })
                .start();
        }
    }

    /**
     * 点击菜单关闭按钮，收起子按钮
     */
    onMenuCloseButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        this.menuCloseButton.active = false;
        this.menuButton.active = true;

        const startPos = this.menuButton.position;

        // 记录完成动画的按钮数量
        let completedCount = 0;
        const totalButtons = this.menuButtons.length;

        // 遍历所有菜单按钮，执行收起动画
        for (let i = 0; i < this.menuButtons.length; i++) {
            const button = this.menuButtons[i];
            const currentPos = button.position;

            // 计算动画时间（基于距离和速度）
            const distance = Vec3.distance(currentPos, startPos);
            const duration = distance / (200 * this.animationSpeed); // 200是基础速度参数

            // 创建动画，将按钮从当前位置移动回起点位置
            tween(button)
                .to(duration, { position: startPos }, { easing: 'smooth' })
                .call(() => {
                    // 动画完成后禁用按钮
                    button.active = false;
                    completedCount++;
                    
                    // 当所有按钮都完成动画后，显示hint和replay按钮
                    if (completedCount === totalButtons) {
                        this.hintButton.active = true;
                        this.replayButton.active = true;
                    }
                })
                .start();
        }
    }

    /**
     * 重置菜单到初始状态
     */
    reset() {
        // 停止所有按钮的动画并隐藏子菜单按钮
        for (let i = 0; i < this.menuButtons.length; i++) {
            const button = this.menuButtons[i];
            button.active = false;
        }

        // 重置按钮状态到初始状态
        if (this.menuButton) {
            this.menuButton.active = true;  // 显示主菜单按钮
        }
        
        if (this.menuCloseButton) {
            this.menuCloseButton.active = false;  // 隐藏关闭按钮
        }
        
        if (this.hintButton) {
            this.hintButton.active = true;  // 显示提示按钮
        }
        
        if (this.replayButton) {
            this.replayButton.active = true;  // 显示重放按钮
        }
        
        // 根据当前音乐设置初始化音乐按钮状态
        if (this.musicButton && this.stopMusicButton) {
            if (GameSettings.musicEnabled) {
                this.musicButton.active = true;  // 显示音乐按钮
                this.stopMusicButton.active = false;  // 隐藏停止音乐按钮
            } else {
                this.musicButton.active = false;  // 隐藏音乐按钮
                this.stopMusicButton.active = true;  // 显示停止音乐按钮
            }
        }
        
        // 根据当前音效设置初始化音效按钮状态
        if (this.soundEffectButton && this.stopSoundEffectButton) {
            if (GameSettings.soundEffectEnabled) {
                this.soundEffectButton.active = true;  // 显示音效按钮
                this.stopSoundEffectButton.active = false;  // 隐藏停止音效按钮
            } else {
                this.soundEffectButton.active = false;  // 隐藏音效按钮
                this.stopSoundEffectButton.active = true;  // 显示停止音效按钮
            }
        }
    }

    // 音效开关的访问方法（使用GameSettings）
    /**
     * 获取音效开关状态
     * @returns 音效是否开启
     */
    get soundEffectEnabled(): boolean {
        return GameSettings.soundEffectEnabled;
    }

    /**
     * 设置音效开关状态
     * @param enabled 是否开启音效
     */
    set soundEffectEnabled(enabled: boolean) {
        GameSettings.soundEffectEnabled = enabled;
    }

    // 音乐开关的访问方法（使用GameSettings）
    /**
     * 获取音乐开关状态
     * @returns 音乐是否开启
     */
    get musicEnabled(): boolean {
        return GameSettings.musicEnabled;
    }

    /**
     * 设置音乐开关状态
     * @param enabled 是否开启音乐
     */
    set musicEnabled(enabled: boolean) {
        GameSettings.musicEnabled = enabled;
    }

    // 便捷方法：切换音效开关
    /**
     * 切换音效开关状态
     */
    toggleSoundEffect(): void {
        GameSettings.toggleSoundEffect();
    }

    // 便捷方法：切换音乐开关
    /**
     * 切换音乐开关状态
     */
    toggleMusic(): void {
        GameSettings.toggleMusic();
        
        // 通知common组件更新背景音乐状态
        const commonInstance = common.getInstance();
        if (commonInstance) {
            commonInstance.updateBackgroundMusicState();
        }
    }

    /**
     * 音乐按钮点击事件
     * 隐藏音乐按钮，显示停止音乐按钮，并且停止音乐播放
     */
    onMusicButtonClick(): void {
        // 播放start音效
        this.playStartSound();
        
        // 隐藏音乐按钮
        if (this.musicButton) {
            this.musicButton.active = false;
        }
        
        // 显示停止音乐按钮
        if (this.stopMusicButton) {
            this.stopMusicButton.active = true;
        }
        
        // 停止音乐播放
        const commonInstance = common.getInstance();
        if (commonInstance) {
            commonInstance.stopBackgroundMusic();
        }
        
        // 设置音乐状态为关闭
        GameSettings.musicEnabled = false;
    }

    /**
     * 停止音乐按钮点击事件
     * 隐藏停止音乐按钮，显示音乐按钮，并且开始音乐播放
     */
    onStopMusicButtonClick(): void {
        // 播放start音效
        this.playStartSound();
        
        // 隐藏停止音乐按钮
        if (this.stopMusicButton) {
            this.stopMusicButton.active = false;
        }
        
        // 显示音乐按钮
        if (this.musicButton) {
            this.musicButton.active = true;
        }
        
        // 开始音乐播放
        const commonInstance = common.getInstance();
        if (commonInstance) {
            // 设置音乐状态为开启
            GameSettings.musicEnabled = true;
            // 更新背景音乐状态，这会根据当前设置开始播放音乐
            commonInstance.updateBackgroundMusicState();
        }
    }

    /**
     * 音效按钮点击事件
     * 隐藏音效按钮，显示停止音效按钮，并且停止音效播放
     */
    onSoundEffectButtonClick(): void {
        // 播放start音效
        this.playStartSound();
        
        // 隐藏音效按钮
        if (this.soundEffectButton) {
            this.soundEffectButton.active = false;
        }
        
        // 显示停止音效按钮
        if (this.stopSoundEffectButton) {
            this.stopSoundEffectButton.active = true;
        }
        
        // 设置音效状态为关闭
        GameSettings.soundEffectEnabled = false;
    }

    /**
     * 停止音效按钮点击事件
     * 隐藏停止音效按钮，显示音效按钮，并且开始音效播放
     */
    onStopSoundEffectButtonClick(): void {
        // 设置音效状态为开启（需要在播放音效前设置）
        GameSettings.soundEffectEnabled = true;
        
        // 播放start音效
        this.playStartSound();
        
        // 隐藏停止音效按钮
        if (this.stopSoundEffectButton) {
            this.stopSoundEffectButton.active = false;
        }
        
        // 显示音效按钮
        if (this.soundEffectButton) {
            this.soundEffectButton.active = true;
        }
    }

    /**
     * 清空缓存按钮点击事件
     * 删除所有缓存数据并给用户反馈
     */
    onClearCacheButtonClick(): void {
        // 播放start音效
        this.playStartSound();
        
        // 执行清空缓存操作
        this.clearAllCacheData();
        
        // 给用户反馈（可以通过日志或UI提示）
        console.log('缓存已清空！游戏数据已重置。');
        
        // 如果有游戏组件，重新加载当前关卡（会重置为第1关）
        if (this.gameComponent) {
            // 重新加载当前关卡，这会将游戏重置为从第1关开始
            console.log('通知游戏组件缓存已清空，重新加载关卡');
            this.gameComponent.reloadCurrentLevel();
        }
        
    }

    /**
     * 清空所有缓存数据
     * 删除存储中的所有游戏相关数据（支持localStorage和微信小程序存储）
     */
    private clearAllCacheData(): void {
        try {
            // 获取所有存储的键
            const keys = StorageAdapter.getAllKeys();
            console.log(`开始清空缓存数据，共找到 ${keys.length} 个存储项`);
            
            let removedCount = 0;
            
            // 遍历所有键，删除游戏相关的数据
            keys.forEach(key => {
                let shouldRemove = false;
                
                // 删除关卡最佳时间记录（以bestTime_level_开头的键）
                if (key.startsWith('bestTime_level_')) {
                    shouldRemove = true;
                    console.log(`删除关卡最佳时间记录: ${key}`);
                }
                // 删除最大完成关卡记录
                else if (key === 'maxCompletedLevel') {
                    shouldRemove = true;
                    console.log(`删除最大完成关卡记录: ${key}`);
                }
                // 删除当前关卡记录
                else if (key === 'currentLevel') {
                    shouldRemove = true;
                    console.log(`删除当前关卡记录: ${key}`);
                }
                
                if (shouldRemove) {
                    StorageAdapter.removeItem(key);
                    removedCount++;
                }
            });
            
            console.log(`缓存清空完成，共删除 ${removedCount} 个存储项`);
            
            // 获取清空后的存储信息
            const storageInfo = StorageAdapter.getStorageInfo();
            console.log(`清空后剩余存储项数量: ${storageInfo.keys.length}`);
            
        } catch (error) {
            console.error('清空缓存数据时发生错误:', error);
        }
    }

}


