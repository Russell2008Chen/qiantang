import { _decorator, Component, Node, Sprite, SpriteFrame, Animation, view, Vec3, tween, math, ParticleSystem2D, AudioClip, AudioSource } from 'cc';
import { fish } from './fish';
import { game } from './game';
import { block } from './block';
import { GameSettings } from './gameData';
const { ccclass, property } = _decorator;

@ccclass('common')
export class common extends Component {
    @property(Sprite)
    bg: Sprite = null;

    @property(SpriteFrame)
    spriteFrames: SpriteFrame[] = [];

    @property(Node)
    nodes: Node[] = [];

    @property(Node)
    waterRippleNode: Node = null;

    @property(fish)
    fishComponent: fish = null;

    @property(Node)
    nodeParticle: Node = null;

    @property(game)
    gameComponent: game = null;

    @property(Node)
    nodeSkin: Node = null;

    @property(Node)
    nodeSetting: Node = null;

    @property([Node])
    interfaceNodes: Node[] = [];

    @property(AudioClip)
    rippleSoundClip: AudioClip = null;

    @property(AudioClip)
    startSoundClip: AudioClip = null;

    @property([AudioClip])
    backgroundMusicList: AudioClip[] = [];

    @property(AudioSource)
    backgroundMusicSource: AudioSource = null;

    // 当前播放的背景音乐索引
    private currentMusicIndex: number = 0;

    // 当前激活的节点索引
    private currentActiveNodeIndex: number = 0;
    
    // 记录进入皮肤界面前显示的界面
    private previousActiveInterface: Node = null;
    
    // 当前激活的粒子系统
    private currentActiveParticleSystem: ParticleSystem2D = null;
    
    // 水波纹动画组件
    private waterRippleAnimation: Animation = null;
    
    // 水波纹播放定时器ID
    private rippleTimerId: number = null;
    
    // 音频源组件
    private audioSource: AudioSource = null;

    // 静态实例，用于全局访问
    private static instance: common = null;


    onLoad() {
        // 设置静态实例
        common.instance = this;
        
        // 激活水波纹节点并获取水波纹动画组件
        if (this.waterRippleNode) {
            this.waterRippleNode.active = true;
            this.waterRippleAnimation = this.waterRippleNode.getComponent(Animation);
        }

        this.fishComponent.node.active = true;
        
        // 初始化音频源组件
        this.audioSource = this.node.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.node.addComponent(AudioSource);
        }
    }

    start() {
        // 启动水波纹随机播放
        this.startRandomRipple();
        
        // 初始化并播放默认背景音乐
        if (this.gameComponent) {
            // 根据当前皮肤索引播放对应的背景音乐
            const currentSkinIndex = this.gameComponent.getSkinIndex();
            
            // 根据skinIndex映射背景音乐索引
            let musicIndex = 0; // 默认使用第0个背景音乐
            if (currentSkinIndex === 7) {
                musicIndex = 1;
            } else if (currentSkinIndex === 5) {
                musicIndex = 2;
            } else if (currentSkinIndex === 6) {
                musicIndex = 3;
            } else if (currentSkinIndex === 4) {
                musicIndex = 4;
            }
            
            this.playBackgroundMusicByIndex(musicIndex);
            
            console.log(`游戏启动，播放背景音乐，皮肤索引: ${currentSkinIndex}，音乐索引: ${musicIndex}`);
        }
    }

    // 获取屏幕随机位置
    private getRandomPosition(): Vec3 {
        const screenSize = view.getVisibleSize();
        const randomX = (Math.random() - 0.5) * screenSize.width * 0.8; // 0.8是为了避免边缘
        const randomY = (Math.random() - 0.5) * screenSize.height * 0.8;
        return new Vec3(randomX, randomY, 0);
    }

    // 播放水波纹动画
    private playRippleAtRandomPosition(): void {
        if (!this.waterRippleNode || !this.waterRippleAnimation) {

            return;
        }

        // 设置随机位置
        const randomPos = this.getRandomPosition();
        this.waterRippleNode.setPosition(randomPos);

        // 播放动画
        this.waterRippleAnimation.play('shuiBoWen');
        
        // 播放水波纹音效
        this.playRippleSound();
    }

    // 播放水波纹音效
    private playRippleSound(): void {
        // 检查音效开关是否为true
        if (!GameSettings.soundEffectEnabled) {
            return; // 音效关闭时直接返回
        }
        
        if (this.audioSource && this.rippleSoundClip) {
            this.audioSource.playOneShot(this.rippleSoundClip);
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

    // 启动随机播放定时器
    private startRandomRipple(): void {
        this.scheduleRandomRipple();
    }

    // 调度下一次水波纹播放
    private scheduleRandomRipple(): void {
        // 生成2-4秒之间的随机时间间隔
        const randomDelay = 5 + Math.random() * 5; // 2到4秒之间

        this.rippleTimerId = setTimeout(() => {
            this.playRippleAtRandomPosition();
            // 递归调度下一次播放
            this.scheduleRandomRipple();
        }, randomDelay * 1000); // 转换为毫秒
    }


    update(deltaTime: number) {
        
    }

    onDestroy() {
        // 清理定时器，避免内存泄漏
        if (this.rippleTimerId) {
            clearTimeout(this.rippleTimerId);
            this.rippleTimerId = null;
        }
    }

    // 皮肤按钮点击方法
    onSkinButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        // 查找并记录当前显示的界面
        this.previousActiveInterface = this.getCurrentActiveInterface();
        
        // 隐藏当前显示的界面
        if (this.previousActiveInterface) {
            this.previousActiveInterface.active = false;
            console.log('隐藏当前界面:', this.previousActiveInterface.name);
        }
        
        // 显示皮肤选择界面
        if (this.nodeSkin) {
            this.nodeSkin.active = true;
            console.log('打开皮肤选择界面');
        } else {
            console.warn('nodeSkin节点未设置');
        }
    }

    // 关闭皮肤界面方法
    onCloseSkinButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        // 隐藏皮肤选择界面
        if (this.nodeSkin) {
            this.nodeSkin.active = false;
            console.log('关闭皮肤选择界面');
        }
        
        // 恢复之前显示的界面
        if (this.previousActiveInterface) {
            this.previousActiveInterface.active = true;
            console.log('恢复之前的界面:', this.previousActiveInterface.name);
            this.previousActiveInterface = null; // 清空记录
        }
    }

    // 设置按钮点击方法
    onSettingButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        // 显示设置界面（作为覆盖层显示在当前界面上方）
        if (this.nodeSetting) {
            this.nodeSetting.active = true;
            console.log('打开设置界面');
        } else {
            console.warn('nodeSetting节点未设置');
        }
    }

    // 关闭设置界面方法
    onCloseSettingButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        // 隐藏设置界面
        if (this.nodeSetting) {
            this.nodeSetting.active = false;
            console.log('关闭设置界面');
        }
    }

    // 皮肤选择按钮点击事件处理函数
    onThemeSkinSelectionButtonClick(event: any) {
        // 播放start音效
        this.playStartSound();
        
        // 获取点击的按钮节点
        const buttonNode = event.target;
        
        // 识别被点击按钮的node名称
        const buttonName = buttonNode.name;
        console.log('点击的按钮名称:', buttonName);
        
        // 检查按钮名称格式是否为btn_{index}
        const namePattern = /^btn_(\d+)$/;
        const match = buttonName.match(namePattern);
        
        if (!match) {
            console.warn(`按钮名称格式不正确，应为btn_{index}格式，当前为: ${buttonName}`);
            return;
        }
        
        // 从按钮节点名称中提取index
        const buttonIndex = parseInt(match[1]);
        console.log('提取的按钮索引:', buttonIndex);
        
        // 获取当前皮肤按钮名称（通过gameComponent的skinIndex+1）
        if (this.gameComponent) {
            const currentSkinIndex = this.gameComponent.getSkinIndex();
            const currentSkinButtonName = `btn_${currentSkinIndex + 1}`;
            console.log('当前皮肤按钮名称:', currentSkinButtonName);
            
            // 查找当前皮肤按钮节点（作为被点击按钮的兄弟节点）
            const parentNode = buttonNode.parent;
            if (parentNode) {
                const currentSkinButton = parentNode.getChildByName(currentSkinButtonName);
                if (currentSkinButton) {
                    // 隐藏当前皮肤按钮的sp_2子节点
                    const currentSp2Node = currentSkinButton.getChildByName('sp_2');
                    if (currentSp2Node) {
                        currentSp2Node.active = false;
                        console.log('隐藏当前皮肤按钮的sp_2子节点:', currentSkinButtonName);
                    } else {
                        console.warn('当前皮肤按钮没有找到sp_2子节点:', currentSkinButtonName);
                    }
                } else {
                    console.warn('没有找到当前皮肤按钮:', currentSkinButtonName);
                }
            } else {
                console.warn('被点击按钮没有父节点');
            }
        }
        
        // 显示被点击皮肤按钮的sp_2子节点
        const clickedSp2Node = buttonNode.getChildByName('sp_2');
        if (clickedSp2Node) {
            clickedSp2Node.active = true;
            console.log('显示被点击皮肤按钮的sp_2子节点:', buttonName);
        } else {
            console.warn('被点击的皮肤按钮没有找到sp_2子节点:', buttonName);
        }
        
        // 调用switchToSkin(index - 1)
        const skinIndex = buttonIndex - 1;
        console.log('切换到皮肤索引:', skinIndex);
        this.switchToThemeSkin(skinIndex);
    }

    // fishSkin按钮点击事件处理函数
    onFishSkinButtonClick(event: any) {
        // 播放start音效
        this.playStartSound();
        
        // 获取点击的按钮节点
        const buttonNode = event.target;
        const buttonName = buttonNode.name;
        
        console.log('fishSkin按钮被点击，节点名称:', buttonName);
        
        // 检查按钮名称格式是否为btn_{index}
        const namePattern = /^btn_(\d+)$/;
        const match = buttonName.match(namePattern);
        
        if (!match) {
            console.warn(`fishSkin按钮名称格式不正确，应为btn_{index}格式，当前为: ${buttonName}`);
            return;
        }
        
        // 从按钮节点名称中提取index
        const buttonIndex = parseInt(match[1]);
        console.log('提取的fishSkin按钮索引:', buttonIndex);
        
        // 获取当前fishSkin按钮名称（通过gameComponent的heroBlockIndex+1）
        if (this.gameComponent) {
            const currentHeroBlockIndex = this.gameComponent.getHeroBlockIndex();
            const currentFishSkinButtonName = `btn_${currentHeroBlockIndex + 1}`;
            console.log('当前fishSkin按钮名称:', currentFishSkinButtonName);
            
            // 查找当前fishSkin按钮节点（作为被点击按钮的兄弟节点）
            const parentNode = buttonNode.parent;
            if (parentNode) {
                const currentFishSkinButton = parentNode.getChildByName(currentFishSkinButtonName);
                if (currentFishSkinButton) {
                    // 隐藏当前fishSkin按钮的sp_2子节点
                    const currentSp2Node = currentFishSkinButton.getChildByName('sp_2');
                    if (currentSp2Node) {
                        currentSp2Node.active = false;
                        console.log('隐藏当前fishSkin按钮的sp_2子节点:', currentFishSkinButtonName);
                    } else {
                        console.warn('当前fishSkin按钮没有找到sp_2子节点:', currentFishSkinButtonName);
                    }
                } else {
                    console.warn('没有找到当前fishSkin按钮:', currentFishSkinButtonName);
                }
            } else {
                console.warn('被点击的fishSkin按钮没有父节点');
            }
        }
        
        // 显示被点击fishSkin按钮的sp_2子节点
        const clickedSp2Node = buttonNode.getChildByName('sp_2');
        if (clickedSp2Node) {
            clickedSp2Node.active = true;
            console.log('显示被点击fishSkin按钮的sp_2子节点:', buttonName);
        } else {
            console.warn('被点击的fishSkin按钮没有找到sp_2子节点:', buttonName);
        }
        
        // 设置heroBlockIndex为提取的索引-1
        const heroBlockIndex = buttonIndex - 1;
        console.log('设置heroBlockIndex为:', heroBlockIndex);
        this.gameComponent.setHeroBlockIndex(heroBlockIndex);
        
        // 只更新heroBlock的皮肤，保留当前布局
        console.log('更新heroBlock皮肤，保留当前布局');
        this.updateHeroBlockSkin();
    }

    /**
     * 只更新heroBlock的皮肤，保留当前布局
     */
    private updateHeroBlockSkin(): void {
        if (!this.gameComponent) {
            console.warn('gameComponent未设置，无法更新heroBlock皮肤');
            return;
        }

        const blockParent = this.gameComponent.blockParent;
        if (!blockParent) {
            console.warn('blockParent未设置，无法更新heroBlock皮肤');
            return;
        }

        console.log('开始更新heroBlock皮肤');
        let updatedHeroBlocksCount = 0;

        // 遍历blockParent下的所有子节点，查找heroBlock
        for (let i = 0; i < blockParent.children.length; i++) {
            const child = blockParent.children[i];
            const blockComponent = child.getComponent(block);
            
            // 如果子节点包含block组件且是heroBlock，则更新其皮肤
            if (blockComponent && blockComponent.getIsHero()) {
                const blockType = blockComponent.getBlockType();
                
                if (blockType) {
                    // 获取新heroBlock皮肤的SpriteFrame
                    const newSpriteFrame = this.gameComponent.getSpriteFrameByBlockType(blockType, true);
                    const newClickSpriteFrame = this.gameComponent.getClickSpriteFrameByBlockType(blockType, true);
                    
                    // 更新主sprite
                    const spriteComponent = child.getComponent(Sprite);
                    if (spriteComponent && newSpriteFrame) {
                        spriteComponent.spriteFrame = newSpriteFrame;
                        console.log(`更新heroBlock ${blockType} 的主sprite`);
                    }
                    
                    // 更新click子节点的sprite
                    const clickNode = child.getChildByName('click');
                    if (clickNode && newClickSpriteFrame) {
                        const clickSpriteComponent = clickNode.getComponent(Sprite);
                        if (clickSpriteComponent) {
                            clickSpriteComponent.spriteFrame = newClickSpriteFrame;
                            console.log(`更新heroBlock ${blockType} 的click sprite`);
                        }
                    }
                    
                    updatedHeroBlocksCount++;
                }
            }
        }

        console.log(`heroBlock皮肤更新完成，共更新了 ${updatedHeroBlocksCount} 个heroBlock`);
    }

    // 切换到指定索引的皮肤
    switchToThemeSkin(skinIndex: number) {
        if (this.bg && this.spriteFrames.length > 0 && skinIndex >= 0 && skinIndex < this.spriteFrames.length) {
            // 设置背景图片
            this.bg.spriteFrame = this.spriteFrames[skinIndex];
            
            // 设置game的atlasIndex
            if (this.gameComponent) {
                this.gameComponent.setSkinIndex(skinIndex);
                
                // 更新已存在的方块皮肤
                this.updateExistingBlocksSkin(skinIndex);
                
                // 根据skinIndex映射背景音乐索引
                let musicIndex = 0; // 默认使用第0个背景音乐
                if (skinIndex === 7) {
                    musicIndex = 1;
                } else if (skinIndex === 5) {
                    musicIndex = 2;
                } else if (skinIndex === 6) {
                    musicIndex = 3;
                } else if (skinIndex === 4) {
                    musicIndex = 4;
                }
                
                // 切换到对应索引的背景音乐
                this.playBackgroundMusicByIndex(musicIndex);
            }
            
            // 先deactivate当前激活的节点
            if (this.currentActiveNodeIndex >= 0 && this.nodes[this.currentActiveNodeIndex]) {
                this.nodes[this.currentActiveNodeIndex].active = false;
            }
            
            // 激活对应索引的节点（如果存在）
            if (this.nodes[skinIndex]) {
                this.nodes[skinIndex].active = true;
                this.currentActiveNodeIndex = skinIndex;
            }
            
            // 播放对应索引的粒子动画
            this.playParticleAnimation(skinIndex);
        } else {
            console.warn(`无效的皮肤索引: ${skinIndex}`);
        }
    }

    // 获取当前显示的主界面
    private getCurrentActiveInterface(): Node | null {
        for (const interfaceNode of this.interfaceNodes) {
            if (interfaceNode && interfaceNode.active) {
                return interfaceNode;
            }
        }
        
        return null;
    }

    // 隐藏所有主界面
    private hideAllInterfaces(): void {
        for (const interfaceNode of this.interfaceNodes) {
            if (interfaceNode) {
                interfaceNode.active = false;
            }
        }
        console.log('隐藏所有主界面');
    }

    // 显示指定的界面（通过节点引用）
    private showInterface(targetInterface: Node): void {
        if (targetInterface) {
            // 先隐藏所有界面
            this.hideAllInterfaces();
            // 显示目标界面
            targetInterface.active = true;
            console.log('显示界面:', targetInterface.name);
        }
    }

    // 显示指定的界面（通过索引）
    private showInterfaceByIndex(index: number): void {
        if (index >= 0 && index < this.interfaceNodes.length && this.interfaceNodes[index]) {
            this.showInterface(this.interfaceNodes[index]);
        } else {
            console.warn(`无效的界面索引: ${index}`);
        }
    }

    // 播放对应索引的粒子动画
    private playParticleAnimation(index: number): void {
        if (!this.nodeParticle) {

            return;
        }
        
        // 先停止当前活跃的粒子系统
        if (this.currentActiveParticleSystem) {

            this.currentActiveParticleSystem.stopSystem();
            this.currentActiveParticleSystem.enabled = false;
            this.currentActiveParticleSystem.node.active = false;
            this.currentActiveParticleSystem = null;
        }
        
        // 根据命名规则查找对应的粒子节点: particle_${index}
        const particleNodeName = `particle_${index}`;
        const targetParticleNode = this.nodeParticle.getChildByName(particleNodeName);
        
        if (!targetParticleNode) {

            return;
        }
        
        // 获取粒子系统组件
        const particleSystem = targetParticleNode.getComponent(ParticleSystem2D);
        if (!particleSystem) {

            return;
        }
        

        
        // 重置并播放粒子系统
        particleSystem.resetSystem();
        particleSystem.enabled = true;
        particleSystem.node.active = true;
        
        // 更新当前活跃的粒子系统引用
        this.currentActiveParticleSystem = particleSystem;
    }

    /**
     * 更新已存在方块的皮肤
     * @param skinIndex 皮肤索引
     */
    private updateExistingBlocksSkin(skinIndex: number): void {
        if (!this.gameComponent) {
            console.warn('gameComponent未设置，无法更新方块皮肤');
            return;
        }

        // 获取游戏组件的blockParent节点
        const blockParent = this.gameComponent.blockParent;
        if (!blockParent) {
            console.warn('blockParent节点未设置，无法更新方块皮肤');
            return;
        }

        console.log('开始更新已存在方块的皮肤，皮肤索引:', skinIndex);
        let updatedBlocksCount = 0;

        // 遍历blockParent下的所有子节点
        for (let i = 0; i < blockParent.children.length; i++) {
            const child = blockParent.children[i];
            const blockComponent = child.getComponent(block);
            
            // 如果子节点包含block组件，则更新其皮肤
            if (blockComponent) {
                const blockType = blockComponent.getBlockType();
                const isHero = blockComponent.getIsHero();
                
                if (blockType) {
                    // 获取新皮肤的SpriteFrame
                    const newSpriteFrame = this.gameComponent.getSpriteFrameByBlockType(blockType, isHero);
                    const newClickSpriteFrame = this.gameComponent.getClickSpriteFrameByBlockType(blockType, isHero);
                    
                    // 更新主sprite
                    const spriteComponent = child.getComponent(Sprite);
                    if (spriteComponent && newSpriteFrame) {
                        spriteComponent.spriteFrame = newSpriteFrame;
                        console.log(`更新方块 ${blockType} 的主sprite，isHero: ${isHero}`);
                    }
                    
                    // 更新click子节点的sprite
                    const clickNode = child.getChildByName('click');
                    if (clickNode && newClickSpriteFrame) {
                        const clickSpriteComponent = clickNode.getComponent(Sprite);
                        if (clickSpriteComponent) {
                            clickSpriteComponent.spriteFrame = newClickSpriteFrame;
                            console.log(`更新方块 ${blockType} 的click sprite，isHero: ${isHero}`);
                        }
                    }
                    
                    updatedBlocksCount++;
                }
            }
        }

        console.log(`完成方块皮肤更新，共更新了 ${updatedBlocksCount} 个方块`);
    }

    /**
     * 根据索引播放背景音乐
     * @param index 背景音乐索引
     */
    public playBackgroundMusicByIndex(index: number): void {
        // 检查音乐开关是否为true
        if (!GameSettings.musicEnabled) {
            console.log('背景音乐关闭');
            this.currentMusicIndex = index;
            return; // 音乐关闭时直接返回
        }

        // 检查索引是否有效
        if (index < 0 || index >= this.backgroundMusicList.length) {
            console.warn(`无效的背景音乐索引: ${index}，音乐列表长度: ${this.backgroundMusicList.length}`);
            return;
        }

        const musicClip = this.backgroundMusicList[index];
        if (!musicClip) {
            console.warn(`背景音乐索引 ${index} 对应的音频剪辑为空`);
            return;
        }

        if (this.backgroundMusicSource) {
            // 如果当前正在播放音乐且索引相同，则不重复播放
            if (this.currentMusicIndex === index && this.backgroundMusicSource.playing) {
                console.log(`背景音乐索引 ${index} 已在播放中`);
                return;
            }

            // 停止当前音乐
            if (this.backgroundMusicSource.playing) {
                console.log('停止当前音乐');
                this.backgroundMusicSource.stop();
            }

            // 播放新音乐
            this.backgroundMusicSource.clip = musicClip;
            this.backgroundMusicSource.loop = true; // 设置循环播放
            this.backgroundMusicSource.volume = 0.5; // 设置音量为80%
            this.backgroundMusicSource.play();
            
            this.currentMusicIndex = index;
            console.log(`开始播放背景音乐索引 ${index}: ${musicClip.name}`);
        } else {
            console.warn('背景音乐音频源未初始化');
        }
    }

    /**
     * 停止背景音乐
     */
    public stopBackgroundMusic(): void {
        if (this.backgroundMusicSource && this.backgroundMusicSource.playing) {
            this.backgroundMusicSource.stop();
            console.log('停止背景音乐');
        }
    }

    /**
     * 更新背景音乐状态（根据设置开关控制）
     */
    public updateBackgroundMusicState(): void {
        if (GameSettings.musicEnabled) {
            // 如果音乐开启且当前没有播放，则播放当前索引的音乐
            if (!this.backgroundMusicSource || !this.backgroundMusicSource.playing) {
                this.playBackgroundMusicByIndex(this.currentMusicIndex);
            }
        } else {
            // 如果音乐关闭，则停止播放
            this.stopBackgroundMusic();
        }
    }

    /**
     * 获取当前播放的背景音乐索引
     */
    public getCurrentMusicIndex(): number {
        return this.currentMusicIndex;
    }

    /**
     * 获取common组件的静态实例
     */
    public static getInstance(): common {
        return common.instance;
    }
}


