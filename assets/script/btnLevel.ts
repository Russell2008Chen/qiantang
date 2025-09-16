import { _decorator, Component, Node, Label, AudioClip, AudioSource, UIOpacity, Color } from 'cc';
import { game } from './game';
import { GameSettings } from './gameData';
const { ccclass, property } = _decorator;

@ccclass('btnLevel')
export class btnLevel extends Component {
    @property(Label)
    label_num: Label = null;

    @property(AudioClip)
    startSoundClip: AudioClip = null;
    
    private gameComponent: game = null;
    
    // 音频源组件
    private audioSource: AudioSource = null;
    
    private nodeLevel: Node = null;

    private _level_num: number = 0;

    get i_num(): number {
        return this._level_num;
    }

    set i_num(value: number) {
        this._level_num = value;
    }

    start() {
        // 初始化音频源组件
        this.audioSource = this.node.getComponent(AudioSource);
        this.audioSource = this.node.addComponent(AudioSource);
        
        // 为按钮添加点击事件监听
        this.node.on('click', this.onButtonClick, this);
    }

    /**
     * 播放start音效
     */
    private playStartSound(): void {
        // 检查音效开关是否为true
        if (!GameSettings.soundEffectEnabled) {
            return; // 音效关闭时直接返回
        }
        
        if (this.audioSource && this.startSoundClip) {
            this.audioSource.playOneShot(this.startSoundClip);
        }
    }

    update(deltaTime: number) {
        
    }

    init(level_num: number) {
        this._level_num = level_num;
        // 显示当前关卡数字
        this.label_num.string = this.i_num.toString();
        
        // 检查是否应该显示done节点
        this.updateDoneNodeVisibility();
        
        // 更新关卡按钮的可访问状态
        this.updateLevelAccessibility();
    }
    
    /**
     * 更新done节点的显示状态
     */
    private updateDoneNodeVisibility() {
        if (!this.gameComponent) {
            return;
        }
        
        // 通过子节点获取doneNode
        const doneNode = this.node.getChildByName('done');
        if (!doneNode) {
            return;
        }
        
        const completedLevelsCount = this.gameComponent.getCompletedLevelsCount();
        const shouldShowDone = this._level_num <= completedLevelsCount;
        
        doneNode.active = shouldShowDone;
        
        if (shouldShowDone) {
            console.log(`关卡 ${this._level_num} 已完成，显示done标记`);
        }
    }

    /**
     * 更新关卡按钮的可访问状态
     */
    private updateLevelAccessibility() {
        if (!this.gameComponent) {
            return;
        }
        
        const completedLevelsCount = this.gameComponent.getCompletedLevelsCount();
        const canAccessLevel = this._level_num <= completedLevelsCount + 1;
        
        // 获取或添加UIOpacity组件来控制透明度
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.node.addComponent(UIOpacity);
        }
        
        // 设置按钮的透明度来表示是否可访问
        if (!canAccessLevel) {
            // 关卡锁定，降低透明度
            uiOpacity.opacity = 100; // 设置为较低的透明度（0-255）
            console.log(`关卡 ${this._level_num} 已锁定`);
        } else {
            // 关卡可访问，正常透明度
            uiOpacity.opacity = 255;
        }
    }

    /**
     * 公开方法：刷新done节点的显示状态
     * 供外部调用以更新关卡完成状态
     */
    public refreshDoneNodeVisibility() {
        this.updateDoneNodeVisibility();
        this.updateLevelAccessibility(); // 同时更新可访问状态
    }

    /**
     * 设置游戏组件和关卡节点引用
     */
    setReferences(gameComponent: game, nodeLevel: Node) {
        this.gameComponent = gameComponent;
        this.nodeLevel = nodeLevel;
        
        // 在设置了gameComponent后，更新done节点的显示状态和可访问状态
        this.updateDoneNodeVisibility();
        this.updateLevelAccessibility();
    }

    /**
     * 按钮点击事件处理方法
     * 跳转到nodePlaying界面，开始level_num的关卡游戏
     */
    onButtonClick() {
        console.log('当前关卡:', this._level_num);
        
        // 检查game组件是否已设置
        if (!this.gameComponent) {
            console.error('gameComponent未设置，请在编辑器中配置');
            return;
        }
        
        // 检查关卡是否可以访问
        const completedLevelsCount = this.gameComponent.getCompletedLevelsCount();
        const canAccessLevel = this._level_num <= completedLevelsCount + 1;
        
        if (!canAccessLevel) {
            console.log(`关卡 ${this._level_num} 尚未解锁，需要先完成前面的关卡。已完成关卡数: ${completedLevelsCount}`);
            return; // 不允许点击，直接返回
        }
        
        // 播放start音效
        this.playStartSound();
        
        // 设置当前关卡
        this.gameComponent.setCurrentLevel(this._level_num.toString());
        
        // 隐藏关卡选择界面
        if (this.nodeLevel) {
            this.nodeLevel.active = false;
        }
        
        // 启动游戏（类似onPlayButtonClick的逻辑）
        this.gameComponent.onPlayButtonClick();
        
        console.log(`成功启动关卡 ${this._level_num} 的游戏`);
    }
}


