import { _decorator, Component, Node, Prefab, instantiate, Vec3, SpriteFrame, Sprite, SpriteAtlas, Label, AudioClip, AudioSource } from 'cc';
import { menu } from './menu';
import { blockLayout, blockCompletedLayout } from './gameData';
import { block } from './block';
import { blockManager } from './blockManager';
import { GameSettings } from './gameData';
import { common } from './common';
import { StorageAdapter } from './storageAdapter';
const { ccclass, property } = _decorator;

@ccclass('game')
export class game extends Component {
    @property(Node)
    nodeReady: Node = null;

    @property(Node)
    nodePlaying: Node = null;

    @property(Node)
    nodeOver: Node = null;

    @property(menu)
    menuComponent: menu = null;

    @property(Node)
    blockParent: Node = null;

    @property(Prefab)
    blockPrefab: Prefab = null;

    @property([SpriteAtlas])
    blockAtlases: SpriteAtlas[] = [];

    @property([SpriteFrame])
    heroBlocks: SpriteFrame[] = []; 

    @property(SpriteFrame)
    heroClickBlock: SpriteFrame = null;

    @property(Node)
    spLevel: Node = null;

    @property(Node)
    spGameoverLevel: Node = null;

    @property(Node)
    newBestScore: Node = null;

    @property(AudioClip)
    startSoundClip: AudioClip = null;

    @property(AudioClip)
    winSoundClip: AudioClip = null;

    @property(AudioSource)
    audioSource: AudioSource = null;

    // 当前关卡
    private currentLevel: string = "1";
    
    // 英雄方块所在的行号
    private heroBlockRow: number = 3;
    
    // heroBlock数组索引
    private heroBlockIndex: number = 0;
    
    private skinIndex: number = 0;

    // 时间记录相关属性
    private gameStartTime: number = 0;
    private gameEndTime: number = 0;
    private currentGameTime: number = 0;
    private isGameActive: boolean = false; // 游戏是否正在进行中
    private elapsedTime: number = 0; // 实时经过时间（秒）

    start() {
        // 打印游戏启动信息
        console.log('=== 游戏启动 ===');
        
        
        console.log(`=== 游戏启动完成，当前关卡: ${this.currentLevel} ===`);
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

    /**
     * 播放win音效
     */
    public playWinSound(): void {
        // 检查音效开关是否为true
        if (!GameSettings.soundEffectEnabled) {
            return; // 音效关闭时直接返回
        }
        
        if (this.audioSource && this.winSoundClip) {
            this.audioSource.playOneShot(this.winSoundClip);
        }
    }


    update(deltaTime: number) {
        // 如果游戏正在进行中，实时更新elapsedTime
        if (this.isGameActive && this.gameStartTime > 0) {
            this.elapsedTime = (Date.now() - this.gameStartTime) / 1000; // 转换为秒
            this.updateElapsedTimeDisplay();
        }
    }

    /**
     * 更新背景音乐状态（根据设置开关控制）
     * 调用common组件的背景音乐更新方法
     */
    public updateBackgroundMusicState(): void {
        const commonInstance = common.getInstance();
        if (commonInstance) {
            commonInstance.updateBackgroundMusicState();
        }
    }

    // 按钮点击方法，隐藏nodeReady，显示nodePlaying
    onPlayButtonClick() {
        // 在游戏启动时加载当前应该玩的关卡
        this.loadCurrentLevel();
        console.log(`=== Play按钮被点击，当前关卡: ${this.currentLevel} ===`);
        
        // 播放start音效
        this.playStartSound();
        
        // 记录游戏开始时间
        this.gameStartTime = Date.now();
        this.gameEndTime = 0;
        this.currentGameTime = 0;
        this.elapsedTime = 0;
        this.isGameActive = true;
        
        // 调用menu脚本的reset方法
        if (this.menuComponent) {
            this.menuComponent.reset();
        }
        
        // 隐藏nodeReady节点
        if (this.nodeReady) {
            this.nodeReady.active = false;
        }
        
        // 隐藏nodeOver节点
        if (this.nodeOver) {
            this.nodeOver.active = false;
        }
        
        // 显示nodePlaying节点
        if (this.nodePlaying) {
            this.nodePlaying.active = true;
        }
        
        // 更新spLevel的levelLabel显示当前关卡
        this.updateLevelLabel();
        
        // 根据blockLayout生成方块
        this.generateBlocksFromLayout();

    }

    // Home按钮点击方法，隐藏nodePlaying，显示nodeReady
    onHomeButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        // 停止游戏时间更新
        this.isGameActive = false;
        
        // 隐藏nodePlaying节点
        if (this.nodePlaying) {
            this.nodePlaying.active = false;
        }
        
        // 隐藏nodeOver节点
        if (this.nodeOver) {
            this.nodeOver.active = false;
        }
        
        // 显示nodeReady节点
        if (this.nodeReady) {
            this.nodeReady.active = true;
        }
        

    }

    /**
     * 根据blockLayout或blockCompletedLayout数据生成方块
     * 将这些方块作为blockParent的子节点
     * @param useCompletedLayout 是否使用完成布局数据，默认为false使用初始布局数据
     */
    generateBlocksFromLayout(useCompletedLayout: boolean = false) {
        console.log('---generateBlocksFromLayout');
        
        console.log('---skinIndex', this.skinIndex);  
        
        // 检查必要的属性是否存在
        if (!this.blockParent) {
            console.error("blockParent未设置");
            return;
        }

        if (!this.blockPrefab) {
            console.error("blockPrefab未设置");
            return;
        }

        if (!this.blockAtlases || this.blockAtlases.length === 0) {
            console.error("blockAtlases未设置");
            return;
        }

        // 删除blockParent下所有包含block脚本的子节点
        const childrenToRemove = [];
        for (let i = 0; i < this.blockParent.children.length; i++) {
            const child = this.blockParent.children[i];
            if (child.getComponent(block)) {
                childrenToRemove.push(child);
            }
        }
        
        // 删除找到的包含block组件的节点
        childrenToRemove.forEach(child => {
            child.removeFromParent();
        });

        // 从blockManager组件获取网格参数
        const blockManagerComponent = this.blockParent.getComponent(blockManager);
        let gridSize = 6;
        let blockSize = 110;
        let blockGap = 2;
        
        if (blockManagerComponent) {
            gridSize = blockManagerComponent.gridSize || 6;
            blockSize = blockManagerComponent.blockSize || 110;
            blockGap = blockManagerComponent.blockGap || 2;
            
            // 初始化网格占用状态
            blockManagerComponent.initializeGridOccupancy();
        }

        // 计算网格参数
        const totalSpacing = blockSize + blockGap;
        const startX = -(gridSize - 1) * totalSpacing / 2;
        const startY = -(gridSize - 1) * totalSpacing / 2;
        
        // 计算每个网格单元的左下角偏移量
        // 由于startX和startY是网格中心位置，需要偏移到左下角
        const cellBottomLeftOffsetX = -blockSize / 2;
        const cellBottomLeftOffsetY = -blockSize / 2;

        // 根据参数选择使用哪种布局数据
        const layoutData = useCompletedLayout ? blockCompletedLayout : blockLayout;
        const layoutType = useCompletedLayout ? "完成布局" : "初始布局";
        
        // 获取当前关卡的布局数据
        const currentLevelLayout = layoutData[this.currentLevel];
        if (!currentLevelLayout) {
            console.error(`关卡 ${this.currentLevel} 的${layoutType}数据不存在`);
            return;
        }
        
        console.log(`使用${layoutType}数据生成方块`);
        console.log(`获取到关卡 ${this.currentLevel} 的${layoutType}信息:`, currentLevelLayout);

        // 遍历当前关卡中的每种方块类型
        for (const blockType in currentLevelLayout) {
            const positions = currentLevelLayout[blockType];

            let getSpriteFrameFromEachPosition = false;
            let spriteFrame = null;
            let clickSpriteFrame = null;

            if (blockType === "2_1") {
                getSpriteFrameFromEachPosition = true
            } else {
                spriteFrame = this.getSpriteFrameByBlockType(blockType, false);
                clickSpriteFrame = this.getClickSpriteFrameByBlockType(blockType, false);
            }
            
            // 为每个位置创建方块
            for (const position of positions) {
                // 实例化预制体
                const newNode = instantiate(this.blockPrefab);
                
                // 获取Block组件并设置blockType属性
                const blockComponent = newNode.getComponent(block);
                if (blockComponent) {
                    blockComponent.setBlockType(blockType);
                    
                    // 如果是2_1类型的方块且在第4行（position.y === 3，因为从0开始计数），设置为英雄方块
                    if (blockType === "2_1" && position.y === this.heroBlockRow) {
                        blockComponent.setIsHero(true);
                        console.log(`设置方块 ${blockType} 在位置 (${position.x}, ${position.y}) 为英雄方块`);
                    }
                }

                // 根据blockType和位置获取对应的SpriteFrame
                if (getSpriteFrameFromEachPosition) {
                    spriteFrame = this.getSpriteFrameByBlockType(blockType, blockComponent.getIsHero());
                }

                if (!spriteFrame) {
                    console.warn(`找不到块类型 ${blockType} 在位置 (${position.x}, ${position.y}) 对应的SpriteFrame`);
                    continue;
                }
                // 获取节点的Sprite组件并设置SpriteFrame
                const spriteComponent = newNode.getComponent(Sprite);
                if (spriteComponent && spriteFrame) {
                    spriteComponent.spriteFrame = spriteFrame;
                }
                
                // 设置click子节点的SpriteFrame
                const clickNode = newNode.getChildByName('click');
                if (clickNode) {
                    const clickSpriteComponent = clickNode.getComponent(Sprite);
                    if (clickSpriteComponent) {
                        if (getSpriteFrameFromEachPosition) {
                            clickSpriteFrame = this.getClickSpriteFrameByBlockType(blockType, blockComponent.getIsHero());
                        }

                        if (clickSpriteFrame) {
                            clickSpriteComponent.spriteFrame = clickSpriteFrame;
                            console.log(`为方块 ${blockType} 在位置 (${position.x}, ${position.y}) 设置了click图片: ${clickSpriteFrame.name}`);
                        } else {
                            console.warn(`无法获取方块 ${blockType} 在位置 (${position.x}, ${position.y}) 的click SpriteFrame`);
                        }
                    } else {
                        console.warn(`方块 ${blockType} 的click子节点没有Sprite组件`);
                    }
                } else {
                    console.warn(`方块 ${blockType} 没有找到click子节点`);
                }
                
                // 根据网格坐标计算世界位置
                // 先计算网格中心位置，然后偏移到左下角
                const gridCenterX = startX + position.x * totalSpacing;
                const gridCenterY = startY + position.y * totalSpacing;
                
                // 应用左下角偏移，使方块锚点对齐到网格单元的左下角
                const worldX = gridCenterX + cellBottomLeftOffsetX;
                const worldY = gridCenterY + cellBottomLeftOffsetY;
                newNode.setPosition(new Vec3(worldX, worldY, 0));
                
                // 将节点添加到blockParent节点下
                this.blockParent.addChild(newNode);
                
                // 设置网格占用状态
                if (blockManagerComponent) {
                    const typeParts = blockType.split('_');
                    if (typeParts.length === 2) {
                        const width = parseInt(typeParts[0]);
                        const height = parseInt(typeParts[1]);
                        blockManagerComponent.setGridOccupancy(position.x, position.y, width, height, true);
                    }
                }
                
                console.log(`成功创建了 ${blockType} 方块，位置: (${position.x}, ${position.y}), 世界坐标: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`);
            }
        }

        console.log(`根据${layoutType}生成方块完成`);
    }

    /**
     * 根据blockType获取对应的SpriteFrame
     * @param blockType 方块类型 (如 "1_2", "1_3", "2_1", "3_1")
     * @param position 方块在网格中的位置 (可选)
     * @returns 对应的SpriteFrame，如果找不到则返回null
     */
    public getSpriteFrameByBlockType(blockType: string, isHero: boolean): SpriteFrame | null {
        if (!this.blockAtlases || this.blockAtlases.length === 0) {
            console.error("blockAtlases未设置");
            return null;
        }

        if (this.skinIndex < 0 || this.skinIndex >= this.blockAtlases.length) {
            console.error(`皮肤索引 ${this.skinIndex} 超出范围，图集数量: ${this.blockAtlases.length}`);
            return null;
        }

        const atlas = this.blockAtlases[this.skinIndex];
        if (!atlas) {
            console.error(`皮肤索引 ${this.skinIndex} 对应的图集为空`);
            return null;
        }

        // 特殊情况：如果blockType是2_1且在指定行，使用heroBlock
        if (isHero) {
            return this.heroBlocks[this.heroBlockIndex];
        }

        let spriteFrameName: string = "";
        
        switch (blockType) {
            case "1_2":
                spriteFrameName = "1x2_nor";
                break;
            case "1_3":
                spriteFrameName = "1x3_nor";
                break;
            case "2_1":
                spriteFrameName = "2x1_nor";
                break;
            case "3_1":
                spriteFrameName = "3x1_nor";
                break;
            default:
                console.warn(`不支持的块类型: ${blockType}`);
                return null;
        }

        const spriteFrame = atlas.getSpriteFrame(spriteFrameName);
        if (!spriteFrame) {
            console.warn(`在皮肤索引 ${this.skinIndex} 中找不到名称为 ${spriteFrameName} 的SpriteFrame`);
            return null;
        }

        return spriteFrame;
    }

    /**
     * 根据blockType获取对应的click SpriteFrame
     * @param blockType 方块类型 (如 "1_2", "1_3", "2_1", "3_1")
     * @param position 方块在网格中的位置 (可选)
     * @returns 对应的click SpriteFrame，如果找不到则返回null
     */
    public getClickSpriteFrameByBlockType(blockType: string, isHero: boolean): SpriteFrame | null {
        if (!this.blockAtlases || this.blockAtlases.length === 0) {
            console.error("blockAtlases未设置");
            return null;
        }

        if (this.skinIndex < 0 || this.skinIndex >= this.blockAtlases.length) {
            console.error(`皮肤索引 ${this.skinIndex} 超出范围，图集数量: ${this.blockAtlases.length}`);
            return null;
        }

        const atlas = this.blockAtlases[this.skinIndex];
        if (!atlas) {
            console.error(`皮肤索引 ${this.skinIndex} 对应的图集为空`);
            return null;
        }

        // 特殊情况：如果blockType是2_1且在指定行，使用heroClickBlock
        if (isHero) {
            if (this.heroClickBlock) {
                return this.heroClickBlock;
            } else {
                console.warn("heroClickBlock未设置，使用默认的2x1_click");
            }
        }

        let clickSpriteFrameName: string = "";
        
        switch (blockType) {
            case "1_2":
                clickSpriteFrameName = "1x2_click";
                break;
            case "1_3":
                clickSpriteFrameName = "1x3_click";
                break;
            case "2_1":
                clickSpriteFrameName = "2x1_click";
                break;
            case "3_1":
                clickSpriteFrameName = "3x1_click";
                break;
            default:
                console.warn(`不支持的块类型: ${blockType}`);
                return null;
        }

        const clickSpriteFrame = atlas.getSpriteFrame(clickSpriteFrameName);
        if (!clickSpriteFrame) {
            console.warn(`在皮肤索引 ${this.skinIndex} 中找不到名称为 ${clickSpriteFrameName} 的SpriteFrame`);
            return null;
        }

        return clickSpriteFrame;
    }

    /**
     * 设置当前关卡
     * @param level 关卡名称
     */
    setCurrentLevel(level: string) {
        if (blockLayout[level]) {
            this.currentLevel = level;
            console.log(`切换到关卡: ${level}`);
            // 保存当前关卡到存储
            this.saveCurrentLevel();
        } else {
            console.error(`关卡 ${level} 不存在`);
        }
    }

    /**
     * 获取当前关卡
     * @returns 当前关卡名称
     */
    getCurrentLevel(): string {
        return this.currentLevel;
    }

    /**
     * 获取所有可用关卡列表
     * @returns 关卡名称数组
     */
    getAvailableLevels(): string[] {
        return Object.keys(blockLayout);
    }

    /**
     * 获取下一关的关卡名称
     * @returns 下一关关卡名称，如果当前已是最后一关则返回null
     */
    getNextLevel(): string | null {
        const availableLevels = this.getAvailableLevels();
        const currentLevelIndex = availableLevels.indexOf(this.currentLevel);
        
        if (currentLevelIndex === -1) {
            console.error(`当前关卡 ${this.currentLevel} 不存在于可用关卡列表中`);
            return null;
        }
        
        if (currentLevelIndex >= availableLevels.length - 1) {
            console.log('当前已是最后一关');
            return null;
        }
        
        return availableLevels[currentLevelIndex + 1];
    }

    /**
     * 获取heroBlock数组索引
     * @returns heroBlock数组索引
     */
    getHeroBlockIndex(): number {
        return this.heroBlockIndex;
    }

    /**
     * 设置heroBlock数组索引
     * @param index 索引值
     */
    setHeroBlockIndex(index: number) {
        if (index >= 0 && index < this.heroBlocks.length) {
            this.heroBlockIndex = index;
            console.log(`设置heroBlock索引为: ${index}`);
        } else {
            console.warn(`heroBlock索引 ${index} 超出范围 [0, ${this.heroBlocks.length - 1}]`);
        }
    }

    /**
     * 获取皮肤索引
     * @returns 皮肤索引
     */
    getSkinIndex(): number {
        return this.skinIndex;
    }

    /**
     * 设置皮肤索引
     * @param index 索引值
     */
    setSkinIndex(index: number) {
        if (index >= 0 && index < this.blockAtlases.length) {
            this.skinIndex = index;
            console.log(`设置皮肤索引为: ${index}`);
        } else {
            console.warn(`皮肤索引 ${index} 超出范围 [0, ${this.blockAtlases.length - 1}]`);
        }
    }

    /**
     * Replay按钮点击事件处理函数
     * 获取当前关卡的布局信息并重新生成该关卡布局
     */
    onReplayButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        console.log('Replay按钮被点击，当前关卡:', this.currentLevel);
        
        // 记录游戏开始时间
        this.gameStartTime = Date.now();
        this.gameEndTime = 0;
        this.currentGameTime = 0;
        this.elapsedTime = 0;
        this.isGameActive = true;
        
        // 调用menu脚本的reset方法
        if (this.menuComponent) {
            this.menuComponent.reset();
        }
        
        // 获取当前关卡的布局信息
        const currentLevelLayout = blockLayout[this.currentLevel];
        if (!currentLevelLayout) {
            console.error(`关卡 ${this.currentLevel} 的布局数据不存在`);
            return;
        }
        
        console.log(`获取到关卡 ${this.currentLevel} 的布局信息:`, currentLevelLayout);
        
        // 重新生成该关卡布局
        this.generateBlocksFromLayout();
        
        console.log(`关卡 ${this.currentLevel} 重新生成完成`);
    }

    onGameOverReplayButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        this.onReplayButtonClick();
        this.nodePlaying.active = true;
        this.nodeOver.active = false;
    }

    /**
     * 停止elapsedTime时间更新
     */
    public stopElapsedTimeUpdate(): void {
        this.isGameActive = false;
        console.log('停止elapsedTime时间更新');
    }

    /**
     * 显示游戏结束界面
     */
    public showGameOver(): void {
        console.log('显示游戏结束界面');
        
        // 播放win音效
        // this.playWinSound();
        
        // 停止游戏时间更新
        this.isGameActive = false;
        
        // 记录游戏结束时间并计算用时
        this.gameEndTime = Date.now();
        this.currentGameTime = Math.floor((this.gameEndTime - this.gameStartTime) / 1000); // 转换为秒
        
        console.log(`游戏完成，用时: ${this.formatTime(this.currentGameTime)}`);
        
        // 先获取历史最佳时间（用于显示对比）
        const historicalBestTime = this.getBestTime(this.currentLevel);
        
        // 标记关卡为已完成
        this.markLevelAsCompleted(this.currentLevel);
        
        // 检查并更新最佳时间记录
        const isNewRecord = this.checkAndUpdateBestTime(this.currentLevel, this.currentGameTime);
        if (isNewRecord) {
            console.log(`恭喜！创造了关卡 ${this.currentLevel} 的新记录！`);
        }
        
        // 注意：这里不再自动更新当前关卡，保持显示刚完成的关卡
        // 只有当用户点击"下一关"按钮时才会切换到下一关
        
        // 隐藏游戏界面
        if (this.nodePlaying) {
            this.nodePlaying.active = false;
        }
        
        // 显示游戏结束界面
        if (this.nodeOver) {
            this.nodeOver.active = true;
        }
        
        // 更新游戏结束界面的关卡显示（显示刚完成的关卡）
        this.updateGameOverLevelLabel();
        
        // 更新分数显示，传入历史最佳时间用于对比显示
        this.updateGameOverScoreDisplay(isNewRecord, historicalBestTime);
    }

    /**
     * 下一关按钮点击事件处理函数
     * 获取下一关的level并生成下一关布局
     */
    onNextLevelButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        console.log('下一关按钮被点击，当前关卡:', this.currentLevel);
        
        // 获取下一关的level
        const nextLevel = this.getNextLevel();
        if (!nextLevel) {
            console.log('已经是最后一关，无法进入下一关');
            return;
        }
        
        console.log(`准备切换到下一关: ${nextLevel}`);
        
        // 记录游戏开始时间
        this.gameStartTime = Date.now();
        this.gameEndTime = 0;
        this.currentGameTime = 0;
        this.elapsedTime = 0;
        this.isGameActive = true;
        
        // 调用menu脚本的reset方法
        if (this.menuComponent) {
            this.menuComponent.reset();
        }
        
        // 设置当前关卡为下一关并保存到存储
        this.setCurrentLevel(nextLevel);
        
        // 更新关卡显示
        this.updateLevelLabel();
        
        // 生成下一关布局
        this.generateBlocksFromLayout();
        
        this.nodePlaying.active = true;
        this.nodeOver.active = false;
        
        console.log(`成功切换到关卡 ${nextLevel} 并生成布局`);
    }

    /**
     * 提示按钮点击事件处理函数
     * 从gameData中blockCompletedLayout获取当前level的完成关卡布局数据
     * 根据获取的完成关卡布局数据重绘关卡布局
     */
    onHintButtonClick() {
        // 播放start音效
        this.playStartSound();
        
        console.log('提示按钮被点击，当前关卡:', this.currentLevel);
        
        // 检查完成布局数据是否存在
        const currentLevelCompletedLayout = blockCompletedLayout[this.currentLevel];
        if (!currentLevelCompletedLayout) {
            console.error(`关卡 ${this.currentLevel} 的完成布局数据不存在`);
            return;
        }
        
        // 使用完成布局数据重绘关卡布局
        this.generateBlocksFromLayout(true);
        
        console.log(`关卡 ${this.currentLevel} 提示布局重绘完成`);
    }

    /**
     * 更新spLevel的levelLabel显示当前关卡
     */
    private updateLevelLabel() {
        if (!this.spLevel) {
            console.warn('spLevel节点未设置');
            return;
        }
        
        // 查找spLevel下名为levelLabel的子节点
        const levelLabelNode = this.spLevel.getChildByName('levelLabel');
        if (!levelLabelNode) {
            console.warn('在spLevel节点下找不到levelLabel子节点');
            return;
        }
        
        // 获取levelLabel节点的Label组件
        const labelComponent = levelLabelNode.getComponent(Label);
        if (!labelComponent) {
            console.warn('levelLabel节点没有Label组件');
            return;
        }
        
        // 更新显示文本为当前关卡
        labelComponent.string = this.currentLevel;
        console.log(`更新关卡显示为: ${this.currentLevel}`);
    }

    /**
     * 更新游戏结束界面spGameoverLevel的levelLabel显示当前关卡
     */
    private updateGameOverLevelLabel() {
        if (!this.spGameoverLevel) {
            console.warn('spGameoverLevel节点未设置');
            return;
        }
        
        // 查找spGameoverLevel下名为levelLabel的子节点
        const levelLabelNode = this.spGameoverLevel.getChildByName('levelLabel');
        if (!levelLabelNode) {
            console.warn('在spGameoverLevel节点下找不到levelLabel子节点');
            return;
        }
        
        // 获取levelLabel节点的Label组件
        const labelComponent = levelLabelNode.getComponent(Label);
        if (!labelComponent) {
            console.warn('spGameoverLevel的levelLabel节点没有Label组件');
            return;
        }
        
        // 更新显示文本为当前关卡
        labelComponent.string = this.currentLevel;
        console.log(`更新游戏结束界面关卡显示为: ${this.currentLevel}`);
    }

    /**
     * 更新游戏结束界面的分数显示
     * @param isNewRecord 是否创造了新记录
     * @param historicalBestTime 历史最佳时间（用于对比显示）
     */
    private updateGameOverScoreDisplay(isNewRecord: boolean = false, historicalBestTime: number | null = null): void {
        if (!this.nodeOver) {
            console.warn('nodeOver节点未设置');
            return;
        }

        // 更新当前分数（当前用时）
        const currentScoreNode = this.nodeOver.getChildByName('currentScore');
        if (currentScoreNode) {
            const currentScoreLabel = currentScoreNode.getComponent(Label);
            if (currentScoreLabel) {
                currentScoreLabel.string = `当前分数：${this.formatTime(this.currentGameTime)}`;
                console.log(`更新当前用时显示为: ${this.formatTime(this.currentGameTime)}`);
            } else {
                console.warn('currentScore节点没有Label组件');
            }
        } else {
            console.warn('在nodeOver节点下找不到currentScore子节点');
        }

        // 更新最佳分数（显示历史最佳用时，便于对比）
        const bestScoreNode = this.nodeOver.getChildByName('bestScore');
        if (bestScoreNode) {
            const bestScoreLabel = bestScoreNode.getComponent(Label);
            if (bestScoreLabel) {
                if (historicalBestTime !== null) {
                    // 显示历史最佳时间
                    bestScoreLabel.string = `最佳分数：${this.formatTime(historicalBestTime)}`;
                    console.log(`显示历史最佳用时: ${this.formatTime(historicalBestTime)}`);
                    
                    // 如果是新记录，输出对比信息
                    if (isNewRecord) {
                        const improvement = historicalBestTime - this.currentGameTime;
                        console.log(`新记录！比历史最佳快了 ${improvement} 秒 (${this.formatTime(improvement)})`);
                    }
                } else {
                    // 首次完成关卡，显示当前时间作为最佳时间
                    bestScoreLabel.string = `最佳分数：${this.formatTime(this.currentGameTime)}`;
                    console.log(`首次完成关卡，最佳用时显示为: ${this.formatTime(this.currentGameTime)}`);
                }
            } else {
                console.warn('bestScore节点没有Label组件');
            }
        } else {
            console.warn('在nodeOver节点下找不到bestScore子节点');
        }

        // 控制newBestScore节点的显示/隐藏
        if (this.newBestScore) {
            this.newBestScore.active = isNewRecord;
            if (isNewRecord) {
                console.log('显示新纪录提示');
            } else {
                console.log('隐藏新纪录提示');
            }
        } else {
            console.warn('newBestScore节点未设置');
        }
    }

    /**
     * 更新实时经过时间显示
     */
    private updateElapsedTimeDisplay(): void {
        if (!this.nodePlaying) {
            return;
        }
        
        // 查找nodePlaying下名为elapsedTime的子节点
        const elapsedTimeNode = this.nodePlaying.getChildByName('elapsedTime');
        if (!elapsedTimeNode) {
            return;
        }
        
        // 获取elapsedTime节点的Label组件
        const labelComponent = elapsedTimeNode.getComponent(Label);
        if (!labelComponent) {
            return;
        }
        
        // 更新显示文本为当前经过时间
        const elapsedSeconds = Math.floor(this.elapsedTime);
        labelComponent.string = this.formatTime(elapsedSeconds);
    }

    /**
     * 将秒数格式化为分:秒格式
     * @param seconds 秒数
     * @returns 格式化后的时间字符串 (如 "01:23")
     */
    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
        const secondsStr = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
        
        return `${minutesStr}:${secondsStr}`;
    }

    /**
     * 获取关卡最佳时间的存储键
     * @param level 关卡名称
     * @returns 存储键
     */
    private getBestTimeKey(level: string): string {
        return `bestTime_level_${level}`;
    }

    /**
     * 保存关卡最佳时间到本地存储
     * @param level 关卡名称
     * @param time 时间（秒）
     */
    private saveBestTime(level: string, time: number): void {
        const key = this.getBestTimeKey(level);
        StorageAdapter.setItem(key, time.toString());
        console.log(`保存关卡 ${level} 最佳时间: ${this.formatTime(time)}`);
    }

    /**
     * 从本地存储获取关卡最佳时间
     * @param level 关卡名称
     * @returns 最佳时间（秒），如果没有记录则返回null
     */
    private getBestTime(level: string): number | null {
        const key = this.getBestTimeKey(level);
        const timeStr = StorageAdapter.getItem(key);
        if (timeStr) {
            const time = parseInt(timeStr);
            console.log(`获取关卡 ${level} 最佳时间: ${this.formatTime(time)}`);
            return time;
        }
        return null;
    }

    /**
     * 获取已完成的关卡数
     * @returns 已完成的关卡数量
     */
    getCompletedLevelsCount(): number {
        const maxCompletedLevelStr = StorageAdapter.getItem('maxCompletedLevel');
        if (maxCompletedLevelStr) {
            return parseInt(maxCompletedLevelStr);
        }
        return 0;
    }

    /**
     * 标记关卡为已完成
     * @param level 关卡名称
     */
    markLevelAsCompleted(level: string): void {
        const currentLevelNum = parseInt(level);
        const maxCompletedLevel = this.getCompletedLevelsCount();
        
        // 只有当前关卡数大于已记录的最大完成关卡数时才更新
        if (currentLevelNum > maxCompletedLevel) {
            StorageAdapter.setItem('maxCompletedLevel', currentLevelNum.toString());
            console.log(`关卡 ${level} 已标记为完成，当前最大已完成关卡数: ${currentLevelNum}`);
        }
    }

    /**
     * 检查并更新最佳时间记录
     * @param level 关卡名称
     * @param currentTime 当前完成时间（秒）
     * @returns 是否创建了新记录
     */
    private checkAndUpdateBestTime(level: string, currentTime: number): boolean {
        const bestTime = this.getBestTime(level);
        if (bestTime === null || currentTime < bestTime) {
            this.saveBestTime(level, currentTime);
            return true;
        }
        return false;
    }

    /**
     * 加载当前应该玩的关卡
     * 优先使用之前保存的关卡，如果没有则根据已完成的关卡数确定
     */
    public loadCurrentLevel(): void {
        console.log('开始加载当前关卡...');
        
        // 首先尝试从存储中获取上次保存的关卡
        const savedLevel = this.getSavedCurrentLevel();
        console.log(`从存储获取的关卡: ${savedLevel || 'null'}`);
        
        if (savedLevel && blockLayout[savedLevel]) {
            // 如果有保存的关卡且该关卡存在，则使用保存的关卡
            this.currentLevel = savedLevel;
            console.log(`✓ 从存储加载当前关卡: ${this.currentLevel}`);
            return;
        }
        
        // 如果没有保存的关卡，根据已完成关卡数确定应该玩的关卡
        const completedLevelsCount = this.getCompletedLevelsCount();
        console.log(`已完成关卡数: ${completedLevelsCount}`);
        
        // 确定当前应该玩的关卡：已完成关卡数 + 1
        // 如果没有完成任何关卡，从第1关开始
        // 如果已完成所有关卡，默认回到最后一关
        const nextLevel = completedLevelsCount + 1;
        const availableLevels = this.getAvailableLevels();
        const maxLevel = Math.max(...availableLevels.map(level => parseInt(level)));
        console.log(`下一关应该是: ${nextLevel}, 最大关卡: ${maxLevel}`);
        
        let targetLevel: string;
        if (nextLevel <= maxLevel) {
            targetLevel = nextLevel.toString();
        } else {
            // 已完成所有关卡，默认回到最后一关
            targetLevel = maxLevel.toString();
        }
        
        this.currentLevel = targetLevel;
        console.log(`✓ 计算当前关卡: ${this.currentLevel}，已完成关卡数: ${completedLevelsCount}`);
        
        // 保存当前关卡到存储
        this.saveCurrentLevel();
    }

    /**
     * 保存当前关卡到本地存储
     */
    private saveCurrentLevel(): void {
        StorageAdapter.setItem('currentLevel', this.currentLevel);
        console.log(`保存当前关卡: ${this.currentLevel}`);
    }

    /**
     * 从本地存储获取当前关卡
     * @returns 当前关卡，如果没有记录则返回null
     */
    private getSavedCurrentLevel(): string | null {
        const savedLevel = StorageAdapter.getItem('currentLevel');
        if (savedLevel) {
            console.log(`从存储获取当前关卡: ${savedLevel}`);
            return savedLevel;
        }
        return "1";
    }

    /**
     * 重新加载当前关卡（公开方法）
     * 通常在清空缓存后调用，重新计算应该开始的关卡
     */
    public reloadCurrentLevel(): void {
        this.loadCurrentLevel();
        console.log(`重新加载当前关卡完成: ${this.currentLevel}`);
    }
}


