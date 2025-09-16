import { _decorator, Component, Node, Prefab, instantiate, Vec3, Vec2, SpriteFrame, Sprite, EditBox } from 'cc';
import { block } from './block';
import { blockManager } from './blockManager';
import { game } from './game';
const { ccclass, property } = _decorator;

@ccclass('gameEdit')
export class gameEdit extends Component {
    @property(Node)
    blockParent: Node = null!

    @property(Prefab)
    blockPrefab: Prefab = null!

    @property([SpriteFrame])
    blockSpriteFrames: SpriteFrame[] = [];

    @property(game)
    gameComponent: game = null!

    @property(EditBox)
    levelEditBox: EditBox = null!

    start() {

    }

    update(deltaTime: number) {
        
    }

    /**
     * 按钮点击处理函数
     * @param event 点击事件对象
     * @param blockType 自定义事件数据，传入 "1_2", "1_3", "2_1", "3_1"
     */
    onEditButtonClick(event: any, blockType: string) {
        // 检查预制体是否存在
        if (!this.blockPrefab) {
            console.error("blockPrefab未设置");
            return;
        }

        // 根据字符串参数获取对应的SpriteFrame索引
        let spriteFrameIndex: number = -1;
        switch (blockType) {
            case "1_2":
                spriteFrameIndex = 0;
                break;
            case "1_3":
                spriteFrameIndex = 1;
                break;
            case "2_1":
                spriteFrameIndex = 2;
                break;
            case "3_1":
                spriteFrameIndex = 3;
                break;
            default:
                console.warn(`不支持的块类型: ${blockType}`);
                return;
        }

        // 实例化预制体
        const newNode = instantiate(this.blockPrefab);
        
        // 获取节点的Sprite组件并设置SpriteFrame
        const spriteComponent = newNode.getComponent(Sprite);
        spriteComponent.spriteFrame = this.blockSpriteFrames[spriteFrameIndex];
        
        // 获取Block组件并设置blockType属性
        const blockComponent = newNode.getComponent(block);
        blockComponent.setBlockType(blockType);
        
        // 设置为编辑模式，允许自由移动
        blockComponent.setIsEditMode(true);
        
        // 设置节点位置为屏幕中心 (0, 0, 0)
        newNode.setPosition(Vec3.ZERO);
        
        // 将节点添加到blockParent节点下
        this.blockParent.addChild(newNode);
        
        console.log(`成功创建了 ${blockType} 方块，使用SpriteFrame索引: ${spriteFrameIndex}`);
    }

    /**
     * logLayout按钮点击处理函数
     * 输出当前生成的所有方块的类型和在6×6矩阵中的行列坐标
     */
    onLogLayoutButtonClick() {
        console.log("=== 当前布局中所有方块类型和位置 ===");
        
        if (!this.blockParent) {
            console.warn("blockParent未设置，无法获取方块信息");
            return;
        }

        // 获取blockParent下的所有子节点
        const children = this.blockParent.children;
        
        if (children.length === 0) {
            console.log("当前没有生成任何方块");
            return;
        }

        // 从blockManager组件获取网格参数
        const blockManagerComponent = this.blockParent.getComponent(blockManager);
        let gridSize = 6;
        let blockSize = 110;
        let blockGap = 2;
        
        if (blockManagerComponent) {
            gridSize = blockManagerComponent.gridSize || 6;
            blockSize = blockManagerComponent.blockSize || 110;
            blockGap = blockManagerComponent.blockGap || 2;
        }

        // 计算网格参数
        const totalSpacing = blockSize + blockGap;
        const startX = -(gridSize - 1) * totalSpacing / 2;
        const startY = -(gridSize - 1) * totalSpacing / 2;

        console.log(`总共找到 ${children.length} 个节点：`);
        
        // 创建字典存储方块信息，key为方块类型，value为位置数组
        const blockDictionary: { [key: string]: Vec2[] } = {};
        
        // 遍历所有子节点
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            
            // 获取节点的block组件
            const blockComponent = child.getComponent(block);
            
            if (blockComponent) {
                // 如果有block组件，获取其blockType
                const blockType = blockComponent.getBlockType() || '未知类型';
                const position = child.position;
                
                // 计算在6×6矩阵中的行列坐标
                const offsetX = position.x - startX;
                const offsetY = position.y - startY;
                const col = Math.round(offsetX / totalSpacing);
                const row = Math.round(offsetY / totalSpacing);
                
                // 确保坐标在有效范围内
                const clampedCol = Math.max(0, Math.min(gridSize - 1, col));
                const clampedRow = Math.max(0, Math.min(gridSize - 1, row));
                
                // 将位置信息添加到字典中
                if (!blockDictionary[blockType]) {
                    blockDictionary[blockType] = [];
                }
                blockDictionary[blockType].push(new Vec2(clampedCol, clampedRow));
                
                console.log(`方块 ${i + 1}: 类型=${blockType}, 世界位置=(${position.x.toFixed(2)}, ${position.y.toFixed(2)}), 矩阵坐标=(${clampedCol}, ${clampedRow})`);
            } 
        }
        
        // 输出字典信息
        console.log("\n=== 方块字典信息 ===");
        for (const blockType in blockDictionary) {
            const positions = blockDictionary[blockType];
            console.log(`${blockType}: [${positions.map(pos => `(${pos.x}, ${pos.y})`).join(', ')}]`);
        }
        
        // 输出可直接复制的字典代码
        console.log("\n=== 可复制的字典代码 ===");
        let codeString = "const blockLayout: { [key: string]: Vec2[] } = {\n";
        const blockTypes = Object.keys(blockDictionary);
        
        for (let i = 0; i < blockTypes.length; i++) {
            const blockType = blockTypes[i];
            const positions = blockDictionary[blockType];
            codeString += `  "${blockType}": [`;
            
            for (let j = 0; j < positions.length; j++) {
                const pos = positions[j];
                codeString += `new Vec2(${pos.x}, ${pos.y})`;
                if (j < positions.length - 1) {
                    codeString += ", ";
                }
            }
            
            codeString += "]";
            if (i < blockTypes.length - 1) {
                codeString += ",";
            }
            codeString += "\n";
        }
        
        codeString += "};";
        console.log(codeString);
        
        console.log("=== 方块类型和位置输出完成 ===");
    }

    /**
     * 清空按钮点击处理函数
     * 清空blockParent下面所有带有block脚本的子节点
     */
    onClearAllBlocksButtonClick() {
        // 获取blockParent下的所有子节点
        const children = this.blockParent.children.slice(); // 创建副本避免在遍历时修改数组
        let removedCount = 0;
        // 遍历所有子节点
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            
            // 检查节点是否有block组件
            const blockComponent = child.getComponent(block);
            
            if (blockComponent) {
                // 如果有block组件，移除该节点
                const blockType = blockComponent.getBlockType() || '未知类型';
                console.log(`移除方块: 类型=${blockType}, 位置=(${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)})`);
                
                // 从父节点中移除
                child.removeFromParent();
                removedCount++;
            }
        }
        
        // 如果还有剩余的子节点（不带block脚本的），给出提示
        const remainingChildren = this.blockParent.children.length;
        
        console.log(`清空完成，共移除 ${removedCount} 个方块`);
    }

    /**
     * 显示关卡布局的按钮事件响应方法
     * 从 levelEditBox 组件获取关卡值
     * @param event 点击事件对象
     */
    onShowLevelLayoutButtonClick() {
        // 从 EditBox 获取关卡值
        const level = this.levelEditBox.string;
        
        if (!level || level.trim() === '') {
            console.error("请在输入框中输入关卡编号");
            return;
        }
        
        // 首先调用清空所有方块的方法
        this.onClearAllBlocksButtonClick();
        
        // 设置游戏组件的当前关卡
        this.gameComponent.setCurrentLevel(level);
        
        // 调用游戏组件的生成方块方法来显示关卡布局
        this.gameComponent.generateBlocksFromLayout();
    }

    
}


