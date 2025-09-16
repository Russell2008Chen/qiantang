import { _decorator, Component, Node, Prefab, instantiate, Vec3, AudioClip, AudioSource } from 'cc';
import { btnLevel } from './btnLevel';
import { game } from './game';
import { GameSettings } from './gameData';
const { ccclass, property } = _decorator;

@ccclass('nodeLevel')
export class nodeLevel extends Component {
    @property([Node])
    interfaceNodes: Node[] = [];
    
    @property(Node)
    homeInterface: Node = null;
    
    @property(Node)
    levelContent: Node = null;
    
    @property(Prefab)
    btnLevelPrefab: Prefab = null;
    
    @property(game)
    gameComponent: game = null;
    
    @property({type: 'Integer', tooltip: '总关卡数'})
    totalLevels: number = 40;
    
    @property({type: 'Integer', tooltip: '每行关卡数量'})
    levelsPerRow: number = 4;
    
    @property({type: 'Integer', tooltip: '每列关卡数量'})
    levelsPerCol: number = 6;
    
    @property({type: 'Float', tooltip: '关卡水平间距'})
    levelSpacingX: number = 120;
    
    @property({type: 'Float', tooltip: '关卡垂直间距'})
    levelSpacingY: number = 100;

    @property(AudioClip)
    startSoundClip: AudioClip = null;

    // 音频源组件
    private audioSource: AudioSource = null;
    
    // 每页关卡数量（根据行列数计算）
    private get levelsPerPage(): number {
        return this.levelsPerRow * this.levelsPerCol;
    }
    
    start() {
        // 初始化音频源组件
        this.audioSource = this.node.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.node.addComponent(AudioSource);
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
    
    onEnable() {
        this.createLevelInterface();
    }

    update(deltaTime: number) {
        
    }

    /**
     * 按钮点击事件 - 显示关卡选择界面
     */
    onShowLevelInterface() {
        // 播放start音效
        this.playStartSound();
        
        // 隐藏所有界面
        this.hideAllInterfaces();
        
        // 显示当前nodeLevel界面
        this.node.active = true;
        
        // 刷新所有关卡按钮的完成状态显示
        this.refreshAllLevelButtonStates();
    }

    /**
     * 按钮点击事件 - 返回主界面
     */
    onBackToHome() {
        // 播放start音效
        this.playStartSound();
        
        // 隐藏当前nodeLevel界面
        this.node.active = false;
                
        // 显示主界面
        this.homeInterface.active = true;
    }

    /**
     * 创建关卡选择界面
     */
    private createLevelInterface() {
        if (!this.btnLevelPrefab) {
            console.error('btnLevelPrefab 未设置');
            return;
        }

        if (!this.levelContent) {
            console.error('levelContent 未设置');
            return;
        }

        // 获取levelContent下的所有子节点作为关卡子节点
        const pageNodes = this.levelContent.children;

        // 计算需要的页面数
        const totalPages = Math.ceil(this.totalLevels / this.levelsPerPage);
        
        // 遍历所有关卡子节点
        for (let pageIndex = 0; pageIndex < pageNodes.length; pageIndex++) {
            const pageNode = pageNodes[pageIndex];
            if (!pageNode) continue;

            // 清除该关卡节点下的所有现有按钮
            this.clearPageLevels(pageNode);

            // 只为有关卡的页面创建按钮
            if (pageIndex < totalPages) {
                this.createLevelsForPage(pageNode, pageIndex);
            }
        }
    }

    /**
     * 清除关卡节点下的所有关卡
     */
    private clearPageLevels(pageNode: Node) {
        const children = pageNode.children.slice(); // 创建副本避免遍历时修改数组
        for (const child of children) {
            if (child.getComponent(btnLevel)) {
                child.destroy();
            }
        }
    }

    /**
     * 为指定关卡节点创建关卡
     */
    private createLevelsForPage(pageNode: Node, pageIndex: number) {
        const startLevelNum = pageIndex * this.levelsPerPage + 1;
        
        // 计算当前页面应该有多少个关卡
        const remainingLevels = this.totalLevels - (pageIndex * this.levelsPerPage);
        const levelsInThisPage = Math.min(this.levelsPerPage, remainingLevels);

        for (let i = 0; i < levelsInThisPage; i++) {
            // 实例化按钮
            const levelNode = instantiate(this.btnLevelPrefab);
            if (!levelNode) continue;

            // 设置父节点
            levelNode.parent = pageNode;

            // 计算关卡位置（方阵布局）
            const row = Math.floor(i / this.levelsPerRow);
            const col = i % this.levelsPerRow;
            
            // 计算关卡位置 (居中排列)
            const startX = -(this.levelsPerRow - 1) * this.levelSpacingX * 0.5;
            const startY = (this.levelsPerCol - 1) * this.levelSpacingY * 0.5;
            
            const posX = startX + col * this.levelSpacingX;
            const posY = startY - row * this.levelSpacingY;
            
            levelNode.setPosition(new Vec3(posX, posY, 0));

            // 获取关卡组件并初始化
            const levelComponent = levelNode.getComponent(btnLevel);
            if (levelComponent) {
                const levelNum = startLevelNum + i;
                levelComponent.init(levelNum);
                
                // 设置game组件和nodeLevel节点引用
                levelComponent.setReferences(this.gameComponent, this.node);
            }
        }
    }

    /**
     * 刷新所有关卡按钮的完成状态
     */
    private refreshAllLevelButtonStates() {
        // 遍历所有界面节点，查找关卡按钮并刷新状态
        for (let i = 0; i < this.interfaceNodes.length; i++) {
            const interfaceNode = this.interfaceNodes[i];
            if (!interfaceNode) continue;
            
            // 遍历界面节点的所有子节点
            const children = interfaceNode.children;
            for (const child of children) {
                const btnLevelComponent = child.getComponent(btnLevel);
                if (btnLevelComponent) {
                    // 刷新关卡按钮的完成状态显示
                    btnLevelComponent.refreshDoneNodeVisibility();
                }
            }
        }
    }

    /**
     * 隐藏所有界面
     */
    private hideAllInterfaces() {
        // 隐藏interfaceNodes数组中的所有界面
        for (let i = 0; i < this.interfaceNodes.length; i++) {
            if (this.interfaceNodes[i]) {
                this.interfaceNodes[i].active = false;
            }
        }
        
        // 隐藏当前节点
        this.node.active = false;
    }
}


