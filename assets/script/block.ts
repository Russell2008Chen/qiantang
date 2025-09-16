import { _decorator, Component, Node, input, Input, EventTouch, Vec3, UITransform, tween, AudioSource, AudioClip } from 'cc';
import { blockManager } from './blockManager';
import { game } from './game';
import { GameSettings } from './gameData';
const { ccclass, property } = _decorator;

@ccclass('block')
export class block extends Component {
    @property(AudioClip)
    moveSoundClip: AudioClip = null;

    private isDragging: boolean = false;
    private touchOffset: Vec3 = new Vec3();
    private initialPosition: Vec3 = new Vec3();

    private blockType: string = '';
    
    // 是否为英雄方块
    private isHero: boolean = false;
    
    // 是否为编辑模式下创建的方块（可以自由移动）
    private isEditMode: boolean = false;
    
    // 音频源组件
    private audioSource: AudioSource = null;
    
    // 新增：预计算的移动范围
    private movableRange: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } | null = null;

    start() {
        // 启用触摸事件
        this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        
        // 初始化音频源组件
        this.audioSource = this.node.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.node.addComponent(AudioSource);
        }
    }

    onDestroy() {
        // 清理事件监听器
        this.node.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    public setBlockType(blockType: string): void {
        this.blockType = blockType;
    }

    public getBlockType(): string {
        return this.blockType;
    }
    
    public setIsHero(isHero: boolean): void {
        this.isHero = isHero;
    }
    
    public getIsHero(): boolean {
        return this.isHero;
    }
    
    public setIsEditMode(isEditMode: boolean): void {
        this.isEditMode = isEditMode;
    }
    
    public getIsEditMode(): boolean {
        return this.isEditMode;
    }

    /**
     * 触摸开始事件
     * @param event 触摸事件
     */
    private onTouchStart(event: EventTouch): void {
        this.isDragging = true;
        
        // 启用click子节点
        const clickNode = this.node.getChildByName('click');
        if (clickNode) {
            clickNode.active = true;
        }
        
        // 记录初始位置
        this.initialPosition.set(this.node.position);
        
        // 获取触摸位置（世界坐标）
        const touchWorldPos = event.getUILocation();
        
        // 将触摸位置转换为父节点坐标系
        const touchParentPos = new Vec3();
        if (this.node.parent) {
            const parentTransform = this.node.parent.getComponent(UITransform);
            parentTransform.convertToNodeSpaceAR(new Vec3(touchWorldPos.x, touchWorldPos.y, 0), touchParentPos);
        }
        
        // 计算触摸点与方块中心的偏移
        this.touchOffset.set(
            this.node.position.x - touchParentPos.x,
            this.node.position.y - touchParentPos.y,
            0
        );
        
        // 预计算移动范围
        this.calculateMovableRange();
        
        console.log('开始拖拽方块');
    }

    /**
     * 触摸移动事件
     * @param event 触摸事件
     */
    private onTouchMove(event: EventTouch): void {
        if (!this.isDragging) return;
        
        // 获取触摸位置（世界坐标）
        const touchWorldPos = event.getUILocation();
        
        // 将触摸位置转换为父节点坐标系
        const touchParentPos = new Vec3();
        if (this.node.parent) {
            const parentTransform = this.node.parent.getComponent(UITransform);
            parentTransform.convertToNodeSpaceAR(new Vec3(touchWorldPos.x, touchWorldPos.y, 0), touchParentPos);
        }
        
        // 计算新的方块位置（触摸位置 + 偏移）
        let newPosition = new Vec3(
            touchParentPos.x + this.touchOffset.x,
            touchParentPos.y + this.touchOffset.y,
            0
        );
        
        // 使用预计算的移动范围进行快速边界检查
        if (this.movableRange) {
            // 限制在预计算的移动范围内
            newPosition.x = Math.max(this.movableRange.minX, Math.min(this.movableRange.maxX, newPosition.x));
            newPosition.y = Math.max(this.movableRange.minY, Math.min(this.movableRange.maxY, newPosition.y));
        }
        
        // 直接设置位置，不再进行复杂的碰撞检测
        this.node.setPosition(newPosition);
    }

    /**
     * 触摸结束事件
     * @param event 触摸事件
     */
    private onTouchEnd(event: EventTouch): void {
        if (this.isDragging) {
            this.isDragging = false;
            
            // 禁用click子节点
            const clickNode = this.node.getChildByName('click');
            if (clickNode) {
                clickNode.active = false;
            }
            
            // 清理移动范围缓存
            this.movableRange = null;
            
            // 播放移动音效
            this.playMoveSound();
            
            // 如果是英雄方块且不在编辑模式，检查右边界
            if (!this.isEditMode && this.isHero && this.isBlockRightBeyondMatrix()) {
                // 如果右边位置超过方块矩阵的右边位置，恢复到初始位置
                // this.node.setPosition(this.initialPosition);
                this.onWin();
            } else {
                // 计算当前方块位于父节点网格的哪个位置
                this.calculateGridPosition();
            }
            
            console.log('结束拖拽方块');
        }
    }

    private onWin(): void {
        console.log('英雄方块开始移动出屏幕...');
        
        // 立即播放胜利音效
        const gameComponent = this.node.scene.getComponentInChildren(game);
        if (gameComponent) {
            gameComponent.playWinSound();
            gameComponent.stopElapsedTimeUpdate();
        }
        
        // 获取屏幕宽度，计算目标位置（屏幕右边界外）
        const canvas = this.node.scene.getComponentInChildren('Canvas');
        let screenWidth = 1920; // 默认屏幕宽度
        
        if (canvas) {
            const canvasTransform = canvas.getComponent(UITransform);
            if (canvasTransform) {
                screenWidth = canvasTransform.width;
            }
        }
        
        // 计算目标位置：屏幕右边界外 + 方块宽度的一半
        const currentPos = this.node.position;
        const targetX = screenWidth / 2 + 200; // 多移动200像素确保完全出屏幕
        const targetPosition = new Vec3(targetX, currentPos.y, currentPos.z);
        
        // 使用 tween 动画让方块水平移动出屏幕
        tween(this.node)
            .to(0.5, { position: targetPosition }, {
                easing: 'sineOut' // 使用缓出动画效果
            })
            .call(() => {
                // 动画完成后的回调
                console.log('恭喜你，你赢了！！！');
                // 这里可以触发其他胜利相关的逻辑
                this.onAnimationComplete();
            })
            .start();
    }
    
    /**
     * 动画完成后的处理
     */
    private onAnimationComplete(): void {
        // 可以在这里添加胜利后的处理逻辑
        // 比如显示胜利界面、播放音效等
        console.log('英雄方块已成功移出屏幕！');
        
        // 查找游戏主控制器并显示游戏结束界面
        const gameComponent = this.node.scene.getComponentInChildren(game);
        if (gameComponent) {
            gameComponent.showGameOver();
        } else {
            console.error('找不到游戏主控制器组件');
        }
    }

    /**
     * 检查方块的右边位置是否超过方块矩阵的右边位置
     * @returns true 如果超出右边界，false 如果在边界内
     */
    private isBlockRightBeyondMatrix(): boolean {
        if (!this.node.parent) {
            return false;
        }

        const blockManagerComponent = this.node.parent.getComponent(blockManager);
        if (!blockManagerComponent) {
            return false;
        }

        // 获取网格参数
        const gridSize = blockManagerComponent.gridSize || 6;
        const blockSize = blockManagerComponent.blockSize || 110;
        const blockGap = blockManagerComponent.blockGap || 2;
        
        // 解析方块类型获取方块宽度
        let blockWidth = 1;
        if (this.blockType) {
            const typeParts = this.blockType.split('_');
            if (typeParts.length === 2) {
                blockWidth = parseInt(typeParts[0]);
            }
        }
        
        // 计算方块矩阵的右边界（世界坐标）
        const gridPixelSize = gridSize * blockSize + (gridSize - 1) * blockGap;
        const matrixRightBoundary = gridPixelSize / 2;
        
        // 计算当前方块的右边位置
        const currentBlockPixelWidth = blockWidth * blockSize + (blockWidth - 1) * blockGap;
        const blockRightPosition = this.node.position.x + currentBlockPixelWidth;
        
        // 检查是否超出右边界
        const isBeyond = blockRightPosition > matrixRightBoundary;
        
        console.log(`方块右边界检查: 方块右边位置=${blockRightPosition.toFixed(2)}, 矩阵右边界=${matrixRightBoundary.toFixed(2)}, 超出=${isBeyond}`);
        
        return isBeyond;
    }

    /**
     * 计算当前方块在父节点6x6网格中的位置
     */
    private calculateGridPosition(): void {
        if (!this.node.parent) {
            console.log('没有父节点，无法计算网格位置');
            return;
        }

        // 从父节点的blockManager组件获取网格参数
        const blockManagerComponent = this.node.parent.getComponent(blockManager);
        if (!blockManagerComponent) {
            console.log('父节点没有blockManager组件');
            return;
        }

        // 获取当前方块的位置
        const currentPos = this.node.position;
        
        // 将当前位置转换为网格坐标
        const currentGridPos = blockManagerComponent.worldPositionToGrid(currentPos);
        
        // 解析方块类型获取方块尺寸
        let blockWidth = 1;
        let blockHeight = 1;
        
        if (this.blockType) {
            const typeParts = this.blockType.split('_');
            if (typeParts.length === 2) {
                blockWidth = parseInt(typeParts[0]);
                blockHeight = parseInt(typeParts[1]);
            }
        }
        
        // 先清除当前方块在网格中的占用状态
        const oldGridPos = blockManagerComponent.worldPositionToGrid(this.initialPosition);
        blockManagerComponent.setGridOccupancy(oldGridPos.col, oldGridPos.row, blockWidth, blockHeight, false);
        
        // 确保网格坐标在有效范围内
        const gridSize = blockManagerComponent.gridSize || 6;
        const clampedCol = Math.max(0, Math.min(gridSize - blockWidth, currentGridPos.col));
        const clampedRow = Math.max(0, Math.min(gridSize - blockHeight, currentGridPos.row));
        
        // 检查目标位置是否被占用
        let finalCol = clampedCol;
        let finalRow = clampedRow;
        
        if (blockManagerComponent.isGridOccupied(clampedCol, clampedRow, blockWidth, blockHeight, this.node)) {
            // 如果目标位置被占用，尝试找到最近的可用位置
            let foundValidPosition = false;
            
            // 搜索范围：从当前位置向外扩展
            for (let searchRadius = 1; searchRadius <= Math.max(gridSize, gridSize) && !foundValidPosition; searchRadius++) {
                for (let deltaRow = -searchRadius; deltaRow <= searchRadius && !foundValidPosition; deltaRow++) {
                    for (let deltaCol = -searchRadius; deltaCol <= searchRadius && !foundValidPosition; deltaCol++) {
                        const testCol = clampedCol + deltaCol;
                        const testRow = clampedRow + deltaRow;
                        
                        // 检查边界
                        if (testCol >= 0 && testRow >= 0 && 
                            testCol + blockWidth <= gridSize && testRow + blockHeight <= gridSize) {
                            
                            if (!blockManagerComponent.isGridOccupied(testCol, testRow, blockWidth, blockHeight, this.node)) {
                                finalCol = testCol;
                                finalRow = testRow;
                                foundValidPosition = true;
                            }
                        }
                    }
                }
            }
            
            // 如果找不到可用位置，回到初始位置
            if (!foundValidPosition) {
                const initialGridPos = blockManagerComponent.worldPositionToGrid(this.initialPosition);
                finalCol = initialGridPos.col;
                finalRow = initialGridPos.row;
                console.log('找不到可用位置，回到初始位置');
            }
        }
        
        // 根据方块类型限制最终位置（编辑模式下跳过此限制）
        if (!this.isEditMode && this.blockType) {
            const typeParts = this.blockType.split('_');
            if (typeParts.length === 2) {
                const width = parseInt(typeParts[0]);
                const height = parseInt(typeParts[1]);
                
                // 1_2, 1_3 类型的方块只能上下移动，保持初始X坐标对应的列
                if (width === 1 && (height === 2 || height === 3)) {
                    const initialGridPos = blockManagerComponent.worldPositionToGrid(this.initialPosition);
                    finalCol = initialGridPos.col;
                }
                // 2_1, 3_1 类型的方块只能左右移动，保持初始Y坐标对应的行
                else if (height === 1 && (width === 2 || width === 3)) {
                    const initialGridPos = blockManagerComponent.worldPositionToGrid(this.initialPosition);
                    finalRow = initialGridPos.row;
                }
            }
        }
        
        // 计算最终世界坐标
        const finalWorldPos = blockManagerComponent.gridToWorldPosition(finalCol, finalRow);
        
        // 将方块位置设置为目标位置
        this.node.setPosition(finalWorldPos);
        
        // 更新网格占用状态
        blockManagerComponent.setGridOccupancy(finalCol, finalRow, blockWidth, blockHeight, true);
        
        // 更新初始位置为新位置
        this.initialPosition.set(finalWorldPos);
        
        console.log(`方块已移动到最终位置: 网格(${finalCol}, ${finalRow}), 世界坐标(${finalWorldPos.x.toFixed(2)}, ${finalWorldPos.y.toFixed(2)})`);
    }

    /**
     * 预计算方块可以移动的位置范围
     */
    private calculateMovableRange(): void {
        if (!this.node.parent) {
            this.movableRange = null;
            return;
        }

        const blockManagerComponent = this.node.parent.getComponent(blockManager);
        if (!blockManagerComponent) {
            this.movableRange = null;
            return;
        }

        // 获取网格参数
        const gridSize = blockManagerComponent.gridSize || 6;
        const blockSize = blockManagerComponent.blockSize || 110;
        const blockGap = blockManagerComponent.blockGap || 2;
        
        // 解析方块类型获取方块尺寸
        let blockWidth = 1;
        let blockHeight = 1;
        
        if (this.blockType) {
            const typeParts = this.blockType.split('_');
            if (typeParts.length === 2) {
                blockWidth = parseInt(typeParts[0]);
                blockHeight = parseInt(typeParts[1]);
            }
        }
        
        // 计算网格像素参数
        const totalSpacing = blockSize + blockGap;
        const gridPixelSize = gridSize * blockSize + (gridSize - 1) * blockGap;
        const halfGridPixel = gridPixelSize / 2;
        
        // 计算基础边界（整个网格的边界）
        const baseMinX = -halfGridPixel;
        const baseMaxX = halfGridPixel - (blockWidth * blockSize + (blockWidth - 1) * blockGap);
        const baseMinY = -halfGridPixel;
        const baseMaxY = halfGridPixel - (blockHeight * blockSize + (blockHeight - 1) * blockGap);
        
        // 根据方块类型限制移动方向
        let minX = baseMinX;
        let maxX = baseMaxX;
        let minY = baseMinY;
        let maxY = baseMaxY;
        
        // 如果是编辑模式下的方块，允许自由移动，不应用移动方向限制
        if (!this.isEditMode && this.blockType) {
            const typeParts = this.blockType.split('_');
            if (typeParts.length === 2) {
                const width = parseInt(typeParts[0]);
                const height = parseInt(typeParts[1]);
                const currentPos = this.node.position;
                
                // 1_2, 1_3 类型的方块只能上下移动
                if (width === 1 && (height === 2 || height === 3)) {
                    minX = maxX = currentPos.x; // X坐标固定
                }
                // 2_1, 3_1 类型的方块只能左右移动
                else if (height === 1 && (width === 2 || width === 3)) {
                    minY = maxY = currentPos.y; // Y坐标固定
                    
                    // 特殊处理：如果是2_1类型且在第三行，maxX设为画布最右边
                    if (this.isHero) {
                        maxX = halfGridPixel; 
                    }
                }
            }
        }
        
        // 计算障碍物限制的移动范围
        this.calculateObstacleConstraints(minX, maxX, minY, maxY, blockWidth, blockHeight);
    }

    /**
     * 计算障碍物对移动范围的限制
     */
    private calculateObstacleConstraints(baseMinX: number, baseMaxX: number, baseMinY: number, baseMaxY: number, blockWidth: number, blockHeight: number): void {
        if (!this.node.parent) {
            this.movableRange = { minX: baseMinX, maxX: baseMaxX, minY: baseMinY, maxY: baseMaxY };
            return;
        }

        const blockManagerComponent = this.node.parent.getComponent(blockManager);
        if (!blockManagerComponent) {
            this.movableRange = { minX: baseMinX, maxX: baseMaxX, minY: baseMinY, maxY: baseMaxY };
            return;
        }

        const blockSize = blockManagerComponent.blockSize || 110;
        const blockGap = blockManagerComponent.blockGap || 2;
        
        // 当前方块的像素尺寸
        const currentBlockPixelWidth = blockWidth * blockSize + (blockWidth - 1) * blockGap;
        const currentBlockPixelHeight = blockHeight * blockSize + (blockHeight - 1) * blockGap;
        
        // 当前方块的边界
        const currentPos = this.node.position;
        const currentLeft = currentPos.x;
        const currentRight = currentPos.x + currentBlockPixelWidth;
        const currentBottom = currentPos.y;
        const currentTop = currentPos.y + currentBlockPixelHeight;

        let minX = baseMinX;
        let maxX = baseMaxX;
        let minY = baseMinY;
        let maxY = baseMaxY;

        // 遍历所有其他方块，计算障碍物限制
        for (let child of this.node.parent.children) {
            if (child === this.node) {
                continue; // 跳过自己
            }
            
            const otherBlockComponent = child.getComponent(block);
            if (!otherBlockComponent) {
                continue; // 跳过非方块节点
            }

            // 获取其他方块的类型和尺寸
            const otherBlockType = otherBlockComponent.getBlockType();
            if (!otherBlockType) {
                continue;
            }

            const otherTypeParts = otherBlockType.split('_');
            if (otherTypeParts.length !== 2) {
                continue;
            }

            const otherWidth = parseInt(otherTypeParts[0]);
            const otherHeight = parseInt(otherTypeParts[1]);
            const otherBlockPixelWidth = otherWidth * blockSize + (otherWidth - 1) * blockGap;
            const otherBlockPixelHeight = otherHeight * blockSize + (otherHeight - 1) * blockGap;

            // 其他方块的边界
            const otherPos = child.position;
            const otherLeft = otherPos.x;
            const otherRight = otherPos.x + otherBlockPixelWidth;
            const otherBottom = otherPos.y;
            const otherTop = otherPos.y + otherBlockPixelHeight;

            // 检查是否在同一行或同一列，如果是则计算限制
            // 水平方向的限制（左右移动）
            if (!(otherTop <= currentBottom || otherBottom >= currentTop)) {
                // Y轴有重叠，检查X轴限制
                if (otherRight <= currentLeft) {
                    // 障碍物在左边
                    minX = Math.max(minX, otherRight);
                } else if (otherLeft >= currentRight) {
                    // 障碍物在右边
                    maxX = Math.min(maxX, otherLeft - currentBlockPixelWidth);
                }
            }

            // 垂直方向的限制（上下移动）
            if (!(otherRight <= currentLeft || otherLeft >= currentRight)) {
                // X轴有重叠，检查Y轴限制
                if (otherTop <= currentBottom) {
                    // 障碍物在下边
                    minY = Math.max(minY, otherTop);
                } else if (otherBottom >= currentTop) {
                    // 障碍物在上边
                    maxY = Math.min(maxY, otherBottom - currentBlockPixelHeight);
                }
            }
        }

        if (this.blockType === '1_2' || this.blockType === '1_3') {
            minY -= 6;
            maxY += 6;
        }
        if (this.blockType === '2_1' || this.blockType === '3_1') {
            minX -= 6;
            maxX += 6;
        }

        this.movableRange = { minX, maxX, minY, maxY };
        
        console.log(`方块移动范围: X[${minX.toFixed(2)}, ${maxX.toFixed(2)}], Y[${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
    }

    /**
     * 测试方法：验证移动范围计算是否正确
     * 可以在控制台调用此方法进行测试
     */
    public testMovableRange(): void {
        console.log('=== 测试方块移动范围计算 ===');
        console.log(`方块类型: ${this.blockType}`);
        console.log(`当前位置: (${this.node.position.x.toFixed(2)}, ${this.node.position.y.toFixed(2)})`);
        
        // 触发计算移动范围
        this.calculateMovableRange();
        
        if (this.movableRange) {
            console.log(`计算出的移动范围:`);
            console.log(`  X轴: [${this.movableRange.minX.toFixed(2)}, ${this.movableRange.maxX.toFixed(2)}]`);
            console.log(`  Y轴: [${this.movableRange.minY.toFixed(2)}, ${this.movableRange.maxY.toFixed(2)}]`);
            
            // 验证移动范围是否合理
            const rangeWidth = this.movableRange.maxX - this.movableRange.minX;
            const rangeHeight = this.movableRange.maxY - this.movableRange.minY;
            console.log(`  移动范围大小: 宽度=${rangeWidth.toFixed(2)}, 高度=${rangeHeight.toFixed(2)}`);
            
            if (rangeWidth < 0 || rangeHeight < 0) {
                console.warn('⚠️  移动范围计算异常：范围大小为负数');
            } else {
                console.log('✅ 移动范围计算正常');
            }
        } else {
            console.warn('⚠️  移动范围计算失败：返回null');
        }
        
        // 清理测试用的移动范围
        this.movableRange = null;
        console.log('=== 测试完成 ===\n');
    }

    /**
     * 播放移动音效
     */
    private playMoveSound(): void {
        // 检查音效开关是否为true
        if (!GameSettings.soundEffectEnabled) {
            return; // 音效关闭时直接返回
        }
        
        if (this.audioSource && this.moveSoundClip) {
            this.audioSource.playOneShot(this.moveSoundClip);
        }
    }

    update(deltaTime: number) {
        
    }
}


