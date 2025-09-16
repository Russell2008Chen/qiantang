import { _decorator, Component, Node, Toggle, Label, Color, Size, UITransform, Vec3, AudioClip, AudioSource } from 'cc';
import { GameSettings } from './gameData';
const { ccclass, property } = _decorator;

@ccclass('skinToggle')
export class skinToggle extends Component {
    @property(Label)
    themeSkinLabel: Label = null!;

    @property(Label)
    fishSkinLabel: Label = null!;

    @property(Node)
    contentNode: Node = null!;

    @property(Node)
    themeSkinNode: Node = null!;

    @property(Node)
    fishSkinNode: Node = null!;

    @property(AudioClip)
    startSoundClip: AudioClip = null;

    // 音频源组件
    private audioSource: AudioSource = null;

    // 存储 contentNode 的原始位置
    private originalContentPosition: Vec3 = new Vec3();

    start() {
        // 初始化音频源组件
        this.audioSource = this.node.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.node.addComponent(AudioSource);
        }
        
        // // 保存 contentNode 的原始位置
        // if (this.contentNode) {
        //     this.originalContentPosition.set(this.contentNode.position);
        // }

        // 延迟保存 contentNode 的位置，确保Widget已经完成布局调整
        this.scheduleOnce(() => {
            console.log('更新保存的 contentNode 原始位置');
            this.updateOriginalContentPosition();
        }, 0.5);
    }
    /**
     * 更新保存的 contentNode 原始位置
     */
    private updateOriginalContentPosition(): void {
        if (this.contentNode) {
            this.originalContentPosition.set(this.contentNode.position);
        }
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

    onThemeSkinToggleCheck(toggle: Toggle) {
        // 播放start音效
        this.playStartSound();
        
        // 设置 themeSkinLabel 的颜色为白色 (FFFFFF)
        if (this.themeSkinLabel) {
            this.themeSkinLabel.color = new Color(255, 255, 255, 255);
        }

        // 设置 fishSkinLabel 的颜色为灰色 (DDDDDD)
        if (this.fishSkinLabel) {
            this.fishSkinLabel.color = new Color(221, 221, 221, 255);
        }

        // 更改 content node 的 content size 为 720 * 1420
        this.contentNode.getComponent(UITransform)!.contentSize = new Size(720, 1420);

        // this.updateOriginalContentPosition();
        if (this.contentNode) {
            this.contentNode.position = this.originalContentPosition.clone();
        }

        // 显示 themeSkin node，隐藏 fishSkin node
        if (this.themeSkinNode) {
            this.themeSkinNode.active = true;
        }
        if (this.fishSkinNode) {
            this.fishSkinNode.active = false;
        }
    }

    onFishSkinToggleCheck(toggle: Toggle) {
        // 播放start音效
        this.playStartSound();
        
        // 设置 fishSkinLabel 的颜色为白色 (FFFFFF)
        if (this.fishSkinLabel) {
            this.fishSkinLabel.color = new Color(255, 255, 255, 255);
        }

        // 设置 themeSkinLabel 的颜色为灰色 (DDDDDD)
        if (this.themeSkinLabel) {
            this.themeSkinLabel.color = new Color(221, 221, 221, 255);
        }
        
        // 更改 content node 的 content size 为 720 * 1770
        this.contentNode.getComponent(UITransform)!.contentSize = new Size(720, 1770);

        // this.updateOriginalContentPosition();
        if (this.contentNode) {
            this.contentNode.position = this.originalContentPosition.clone();
        }

        // 显示 fishSkin node，隐藏 themeSkin node
        if (this.fishSkinNode) {
            this.fishSkinNode.active = true;
        }
        if (this.themeSkinNode) {
            this.themeSkinNode.active = false;
        }
    }
}


