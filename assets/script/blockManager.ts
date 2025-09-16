import { _decorator, Component, Node, Prefab, instantiate, Label, Vec3, UITransform } from 'cc';
import { block } from './block';
const { ccclass, property } = _decorator;

@ccclass('blockManager')
export class blockManager extends Component {
    @property(Prefab)
    blockPrefab: Prefab = null;

    @property({
        type: 'Integer',
        min: 1,
        max: 10,
        step: 1,
        displayName: '网格大小',
        tooltip: '网格的行数和列数（如6表示6x6网格）'
    })
    gridSize: number = 6;

    @property({
        type: 'Float',
        min: 50,
        max: 300,
        step: 1,
        displayName: '方块尺寸',
        tooltip: '单个方块的宽度和高度（像素）'
    })
    blockSize: number = 110;

    @property({
        type: 'Float',
        min: 0,
        max: 50,
        step: 1,
        displayName: '方块间隔',
        tooltip: '方块之间的间隔距离（像素）'
    })
    blockGap: number = 2;

    // 网格占用状态数组，true表示被占用，false表示空闲
    private gridOccupancy: boolean[][] = [];

    protected onEnable(): void {
        // this.generateBlockGrid();
    }

    start() {
        this.drawInnerBorder();
        this.drawOuterBorder();
    }

    /**
     * 生成6x6的方块网格
     * 按照从下到上，从左到右的顺序生成
     */
    private generateBlockGrid(): void {
        if (!this.blockPrefab) {
            console.error('Block prefab is not assigned!');
            return;
        }

        // 设置当前节点的尺寸
        this.setNodeSize();

        // 计算总的间距（方块尺寸 + 间隔）
        const totalSpacing = this.blockSize + this.blockGap;
        
        // 计算起始位置（左下角）
        const startX = -(this.gridSize - 1) * totalSpacing / 2;
        const startY = -(this.gridSize - 1) * totalSpacing / 2;

        console.log('---gridSize', this.gridSize);

        // 从下到上（y坐标从小到大），从左到右（x坐标从小到大）
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // 创建方块实例
                const blockNode = instantiate(this.blockPrefab);
                
                // 设置方块尺寸
                this.setBlockSize(blockNode);
                
                // 计算位置
                const x = startX + col * totalSpacing;
                const y = startY + row * totalSpacing;
                blockNode.setPosition(new Vec3(x, y, 0));
                
                // 设置方块坐标到label
                this.setBlockCoordinates(blockNode, col, row);

                
                // 添加到当前节点
                this.node.addChild(blockNode);
            }
        }
    }

    /**
     * 设置方块的坐标标签
     * @param blockNode 方块节点
     * @param x x坐标
     * @param y y坐标
     */
    private setBlockCoordinates(blockNode: Node, x: number, y: number): void {
        // 查找label子节点
        const labelNode = blockNode.getChildByName('label');
        if (labelNode) {
            const labelComponent = labelNode.getComponent(Label);
            if (labelComponent) {
                // 设置坐标文本格式为 "x,y"
                labelComponent.string = `${x},${y}`;
            }
        }
    }

    /**
     * 设置方块的尺寸
     * @param blockNode 方块节点
     */
    private setBlockSize(blockNode: Node): void {
        const uiTransform = blockNode.getComponent(UITransform);
        uiTransform.setContentSize(this.blockSize, this.blockSize);
    }

    /**
     * 设置当前节点的尺寸
     */
    private setNodeSize(): void {
        const uiTransform = this.node.getComponent(UITransform);
        // 计算总尺寸：方块尺寸 * 网格数量 + 间隔 * (网格数量 + 1)
        const totalSize = this.blockSize * this.gridSize + this.blockGap * (this.gridSize + 1);
        uiTransform.setContentSize(totalSize, totalSize);
    }

    /**
     * 初始化网格占用状态数组
     */
    public initializeGridOccupancy(): void {
        this.gridOccupancy = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.gridOccupancy[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.gridOccupancy[row][col] = false;
            }
        }
    }

    /**
     * 设置网格占用状态
     * @param col 列索引
     * @param row 行索引
     * @param width 方块宽度
     * @param height 方块高度
     * @param occupied 是否被占用
     */
    public setGridOccupancy(col: number, row: number, width: number, height: number, occupied: boolean): void {
        for (let r = row; r < row + height && r < this.gridSize; r++) {
            for (let c = col; c < col + width && c < this.gridSize; c++) {
                if (r >= 0 && c >= 0) {
                    this.gridOccupancy[r][c] = occupied;
                }
            }
        }
    }

    /**
     * 检查指定区域是否被占用
     * @param col 列索引
     * @param row 行索引
     * @param width 方块宽度
     * @param height 方块高度
     * @param excludeBlock 要排除的方块节点（用于检查方块自身移动时的碰撞）
     * @returns 如果区域被占用返回true，否则返回false
     */
    public isGridOccupied(col: number, row: number, width: number, height: number, excludeBlock?: Node): boolean {
        // 检查边界
        if (col < 0 || row < 0 || col + width > this.gridSize || row + height > this.gridSize) {
            return true; // 超出边界视为被占用
        }

        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                if (this.gridOccupancy[r][c]) {
                    // 如果有排除的方块，需要检查占用这个位置的是否是排除的方块
                    if (excludeBlock) {
                        const occupyingBlock = this.getBlockAtGridPosition(c, r);
                        if (occupyingBlock && occupyingBlock === excludeBlock) {
                            continue; // 跳过自己占用的位置
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 获取指定网格位置的方块节点
     * @param col 列索引
     * @param row 行索引
     * @returns 方块节点或null
     */
    public getBlockAtGridPosition(col: number, row: number): Node | null {
        // 遍历所有子节点，找到位于指定网格位置的方块
        for (let child of this.node.children) {
            const blockComponent = child.getComponent(block);
            if (blockComponent) {
                const blockGridPos = this.worldPositionToGrid(child.position);
                const blockType = blockComponent.getBlockType();
                
                if (blockType) {
                    const typeParts = blockType.split('_');
                    if (typeParts.length === 2) {
                        const width = parseInt(typeParts[0]);
                        const height = parseInt(typeParts[1]);
                        
                        // 检查该方块是否占用指定位置
                        if (blockGridPos.col <= col && col < blockGridPos.col + width &&
                            blockGridPos.row <= row && row < blockGridPos.row + height) {
                            return child;
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * 将世界坐标转换为网格坐标
     * @param worldPosition 世界坐标
     * @returns 网格坐标 {col, row}
     */
    public worldPositionToGrid(worldPosition: Vec3): {col: number, row: number} {
        const totalSpacing = this.blockSize + this.blockGap;
        const startX = -(this.gridSize - 1) * totalSpacing / 2;
        const startY = -(this.gridSize - 1) * totalSpacing / 2;
        
        // 计算相对于起始位置的偏移（考虑方块左下角锚点）
        const offsetX = worldPosition.x + this.blockSize / 2 - startX;
        const offsetY = worldPosition.y + this.blockSize / 2 - startY;
        
        // 计算网格坐标
        const col = Math.round(offsetX / totalSpacing);
        const row = Math.round(offsetY / totalSpacing);
        
        return {col, row};
    }

    /**
     * 将网格坐标转换为世界坐标（方块左下角位置）
     * @param col 列索引
     * @param row 行索引
     * @returns 世界坐标
     */
    public gridToWorldPosition(col: number, row: number): Vec3 {
        const totalSpacing = this.blockSize + this.blockGap;
        const startX = -(this.gridSize - 1) * totalSpacing / 2;
        const startY = -(this.gridSize - 1) * totalSpacing / 2;
        
        // 计算网格中心位置
        const gridCenterX = startX + col * totalSpacing;
        const gridCenterY = startY + row * totalSpacing;
        
        // 转换为方块左下角位置
        const worldX = gridCenterX - this.blockSize / 2;
        const worldY = gridCenterY - this.blockSize / 2;
        
        return new Vec3(worldX, worldY, 0);
    }

    /**
     * 绘制内边框UI
     * 使用现有的innerBoarder节点及其7个子节点：
     * inner_up, inner_down, inner_left, inner_right_up, inner_right_down, inner_right_up_out, inner_right_down_out
     */
    public drawInnerBorder(): void {
        // 获取当前节点的尺寸
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.error('UITransform component not found on current node!');
            return;
        }
        
        const nodeSize = uiTransform.contentSize;
        const nodeWidth = nodeSize.width;
        const nodeHeight = nodeSize.height;
        
        // 边框宽度
        const borderWidth = 3;
        
        // 获取innerBoarder节点
        const innerBoarder = this.node.getChildByName('innerBoarder');
        if (!innerBoarder) {
            console.error('innerBoarder node not found!');
            return;
        }
        
        // 设置 inner_up（上边框）
        const innerUp = innerBoarder.getChildByName('inner_up');
        if (innerUp) {
            const upTransform = innerUp.getComponent(UITransform);
            upTransform.setContentSize(nodeWidth, borderWidth);
            innerUp.setPosition(0, nodeHeight / 2 - borderWidth / 2, 0);
        }
        
        // 设置 inner_down（下边框）
        const innerDown = innerBoarder.getChildByName('inner_down');
        if (innerDown) {
            const downTransform = innerDown.getComponent(UITransform);
            downTransform.setContentSize(nodeWidth, borderWidth);
            innerDown.setPosition(0, -nodeHeight / 2 + borderWidth / 2, 0);
        }
        
        // 设置 inner_left（左边框）
        const innerLeft = innerBoarder.getChildByName('inner_left');
        if (innerLeft) {
            const leftTransform = innerLeft.getComponent(UITransform);
            leftTransform.setContentSize(borderWidth, nodeHeight);
            innerLeft.setPosition(-nodeWidth / 2 + borderWidth / 2, 0, 0);
        }
        
        // 设置 inner_right_up（右上边框，长度为右边长度的1/3）
        const rightUpHeight = nodeHeight / 3;
        const innerRightUp = innerBoarder.getChildByName('inner_right_up');
        if (innerRightUp) {
            const rightUpTransform = innerRightUp.getComponent(UITransform);
            rightUpTransform.setContentSize(borderWidth, rightUpHeight);
            innerRightUp.setPosition(nodeWidth / 2 - borderWidth / 2, nodeHeight / 2 - rightUpHeight / 2, 0);
        }
        
        // 设置 inner_right_down（右下边框，长度为右边长度的1/2）
        const rightDownHeight = nodeHeight / 2;
        const innerRightDown = innerBoarder.getChildByName('inner_right_down');
        if (innerRightDown) {
            const rightDownTransform = innerRightDown.getComponent(UITransform);
            rightDownTransform.setContentSize(borderWidth, rightDownHeight);
            innerRightDown.setPosition(nodeWidth / 2 - borderWidth / 2, -nodeHeight / 2 + rightDownHeight / 2, 0);
        }
        
        // 设置 inner_right_up_out（右上外边框，长度为20像素）
        const innerRightUpOut = innerBoarder.getChildByName('inner_right_up_out');
        if (innerRightUpOut) {
            const rightUpOutTransform = innerRightUpOut.getComponent(UITransform);
            rightUpOutTransform.setContentSize(20, borderWidth);
            // 左边在当前节点右边从上到下1/3处
            const upOutY = nodeHeight / 2 - nodeHeight / 3;
            innerRightUpOut.setPosition(nodeWidth / 2 + 20 / 2 - borderWidth, upOutY, 0);
        }
        
        // 设置 inner_right_down_out（右下外边框，长度为20像素）
        const innerRightDownOut = innerBoarder.getChildByName('inner_right_down_out');
        if (innerRightDownOut) {
            const rightDownOutTransform = innerRightDownOut.getComponent(UITransform);
            rightDownOutTransform.setContentSize(20, borderWidth);
            // 左边在当前节点右边从上到下1/2处
            const downOutY = nodeHeight / 2 - nodeHeight / 2;
            innerRightDownOut.setPosition(nodeWidth / 2 + 20 / 2 - borderWidth, downOutY, 0);
        }
    }

    /**
     * 绘制外边框UI
     * 使用现有的outerBoarder节点及其7个子节点：
     * outer_up, outer_down, outer_left, outer_right_up, outer_right_down, outer_right_up_out, outer_right_down_out
     * 外边框相对于内边框有2像素的偏移
     */
    public drawOuterBorder(): void {
        // 获取当前节点的尺寸
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.error('UITransform component not found on current node!');
            return;
        }
        
        const nodeSize = uiTransform.contentSize;
        const nodeWidth = nodeSize.width;
        const nodeHeight = nodeSize.height;
        
        // 边框宽度
        const borderWidth = 2;
        // 外边框相对于内边框的偏移
        const offset = 10;
        
        // 获取outerBoarder节点
        const outerBoarder = this.node.getChildByName('outerBoarder');
        if (!outerBoarder) {
            console.error('outerBoarder node not found!');
            return;
        }
        
        // 计算外边框的总尺寸（包含偏移）
        const outerWidth = nodeWidth + 2 * offset;
        const outerHeight = nodeHeight + 2 * offset;
        
        // 设置 outer_up（上边框）- 需要延伸到左右边框的外侧
        const outerUp = outerBoarder.getChildByName('outer_up');
        if (outerUp) {
            const upTransform = outerUp.getComponent(UITransform);
            upTransform.setContentSize(outerWidth + 2 * borderWidth, borderWidth);
            outerUp.setPosition(0, nodeHeight / 2 + offset + borderWidth / 2, 0);
        }
        
        // 设置 outer_down（下边框）- 需要延伸到左右边框的外侧
        const outerDown = outerBoarder.getChildByName('outer_down');
        if (outerDown) {
            const downTransform = outerDown.getComponent(UITransform);
            downTransform.setContentSize(outerWidth + 2 * borderWidth, borderWidth);
            outerDown.setPosition(0, -nodeHeight / 2 - offset - borderWidth / 2, 0);
        }
        
        // 设置 outer_left（左边框）
        const outerLeft = outerBoarder.getChildByName('outer_left');
        if (outerLeft) {
            const leftTransform = outerLeft.getComponent(UITransform);
            leftTransform.setContentSize(borderWidth, outerHeight);
            outerLeft.setPosition(-nodeWidth / 2 - offset - borderWidth / 2, 0, 0);
        }
        
        // 设置 outer_right_up（右上边框，长度为右边长度的1/3）
        const rightUpHeight = outerHeight / 3 - offset;
        const outerRightUp = outerBoarder.getChildByName('outer_right_up');
        if (outerRightUp) {
            const rightUpTransform = outerRightUp.getComponent(UITransform);
            rightUpTransform.setContentSize(borderWidth, rightUpHeight);
            // 从上边框底部开始
            outerRightUp.setPosition(nodeWidth / 2 + offset + borderWidth / 2, nodeHeight / 2 + offset - rightUpHeight / 2, 0);
        }
        
        // 设置 outer_right_down（右下边框，长度为右边长度的1/2）
        const rightDownHeight = outerHeight / 2 - offset;
        const outerRightDown = outerBoarder.getChildByName('outer_right_down');
        if (outerRightDown) {
            const rightDownTransform = outerRightDown.getComponent(UITransform);
            rightDownTransform.setContentSize(borderWidth, rightDownHeight);
            // 从下边框顶部开始
            outerRightDown.setPosition(nodeWidth / 2 + offset + borderWidth / 2, -nodeHeight / 2 - offset + rightDownHeight / 2, 0);
        }
        
        // 设置 outer_right_up_out（右上外边框，长度为20像素）
        const outerRightUpOut = outerBoarder.getChildByName('outer_right_up_out');
        if (outerRightUpOut) {
            const rightUpOutTransform = outerRightUpOut.getComponent(UITransform);
            rightUpOutTransform.setContentSize(20, borderWidth);
            // 左边在当前节点右边从上到下1/3处，与右上边框对接
            const upOutY = nodeHeight / 2 + offset - outerHeight / 3 + offset;
            outerRightUpOut.setPosition(nodeWidth / 2 + offset + borderWidth + 20 / 2 - borderWidth, upOutY, 0);
        }
        
        // 设置 outer_right_down_out（右下外边框，长度为20像素）
        const outerRightDownOut = outerBoarder.getChildByName('outer_right_down_out');
        if (outerRightDownOut) {
            const rightDownOutTransform = outerRightDownOut.getComponent(UITransform);
            rightDownOutTransform.setContentSize(20, borderWidth);
            // 左边在当前节点右边从上到下1/2处，与右下边框对接
            const downOutY = nodeHeight / 2 + offset - outerHeight / 2 - offset;
            outerRightDownOut.setPosition(nodeWidth / 2 + offset + borderWidth + 20 / 2 - borderWidth, downOutY, 0);
        }
    }

    update(deltaTime: number) {
        
    }
}


