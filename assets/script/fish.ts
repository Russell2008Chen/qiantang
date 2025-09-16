import { _decorator, Component, Node, view, Vec3, tween, Animation, easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('fish')
export class fish extends Component {
    @property(Node)
    fishNode: Node = null;
    
    // 鱼移动速度（每秒像素）
    @property({ displayName: "鱼游动速度", tooltip: "鱼的移动速度（像素/秒）" })
    fishSpeed: number = 200;
    
    // 当前显示的鱼子节点索引
    private currentFishIndex: number = 0;
    
    // 鱼是否正在移动
    private fishMoving: boolean = false;
    
    // 鱼游动间隔时间配置（秒）
    @property({ displayName: "最小等待时间", tooltip: "鱼游出后的最短等待时间（秒）" })
    fishMinWaitTime: number = 2;
    
    @property({ displayName: "最大等待时间", tooltip: "鱼游出后的最长等待时间（秒）" })
    fishMaxWaitTime: number = 5;
    
    // 路径弧线幅度配置
    @property({ displayName: "弧线幅度系数", tooltip: "控制弧线路径的弯曲程度，0.1-0.5之间，数值越大弧线越明显", range: [0.1, 0.5] })
    arcCurvature: number = 0.3;
    
    // 朝向调整响应度配置
    @property({ displayName: "朝向响应度", tooltip: "控制鱼朝向调整的响应速度，0.1-0.8之间，数值越大转向越快", range: [0.1, 2.0] })
    rotationResponsiveness: number = 0.3;
    
    // 曲线采样密度配置
    @property({ displayName: "曲线采样密度", tooltip: "控制曲线的平滑程度，10-30之间，数值越大曲线越平滑", range: [10, 30] })
    curveResolution: number = 20;
    
    // 最大角度变化限制配置
    @property({ displayName: "最大角度变化", tooltip: "关键点处的最大角度变化限制（度），30-120之间。当关键点为0时此设置无效", range: [30, 120] })
    maxAngleChange: number = 90;
    
    // 鱼游动定时器ID
    private fishTimerId: number = null;

    start() {
        // 启动鱼的移动
        this.startFishMovement();
    }

    /**
     * 将方向向量转换为Cocos Creator节点旋转角度
     * @param direction 方向向量
     * @returns Cocos Creator中的旋转角度（度）
     */
    private directionToRotation(direction: Vec3): number {
        // 标准化方向向量
        direction.normalize();
        
        // Math.atan2返回弧度，转换为度数
        const mathAngle = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
        
        // Cocos Creator中，0度表示节点朝上（+Y方向）
        // 而Math.atan2中，0度表示右方（+X方向）
        // 所以需要减去90度来对齐坐标系
        return mathAngle - 90;
    }

    // 获取屏幕随机位置
    private getRandomPosition(): Vec3 {
        const screenSize = view.getVisibleSize();
        const randomX = (Math.random() - 0.5) * screenSize.width * 0.8; // 0.8是为了避免边缘
        const randomY = (Math.random() - 0.5) * screenSize.height * 0.8;
        return new Vec3(randomX, randomY, 0);
    }

    // 启动鱼的移动
    private startFishMovement(): void {
        if (!this.fishNode) {

            return;
        }

        // 初始化鱼子节点显示
        this.initializeFishChildren();
        
        // 开始第一次游动
        this.scheduleNextFishSwim();
    }

    // 初始化鱼子节点，隐藏所有子节点
    private initializeFishChildren(): void {
        if (!this.fishNode) return;
        
        for (let i = 0; i < this.fishNode.children.length; i++) {
            this.fishNode.children[i].active = false;
        }
    }

    // 随机选择并显示一个鱼子节点
    private showRandomFishChild(): void {
        if (!this.fishNode || this.fishNode.children.length === 0) return;
        
        // 隐藏当前显示的鱼
        if (this.fishNode.children[this.currentFishIndex]) {
            this.fishNode.children[this.currentFishIndex].active = false;
        }
        
        // 随机选择新的鱼子节点
        var randomIndex = Math.floor(Math.random() * this.fishNode.children.length);
        while (randomIndex === this.currentFishIndex) {
            randomIndex = Math.floor(Math.random() * this.fishNode.children.length);
        }
        this.currentFishIndex = randomIndex;
        this.fishNode.children[this.currentFishIndex].active = true;
        

    }

    // 获取屏幕边缘的随机入口点
    private getRandomEntryPoint(): Vec3 {
        const screenSize = view.getVisibleSize();
        const margin = 100; // 边缘外的距离
        
        // 随机选择从哪一边进入：0=左，1=右，2=上，3=下
        const side = Math.floor(Math.random() * 4);
        
        switch (side) {
            case 0: // 左边进入
                return new Vec3(-screenSize.width / 2 - margin, 
                               (Math.random() - 0.5) * screenSize.height * 0.8, 0);
            case 1: // 右边进入
                return new Vec3(screenSize.width / 2 + margin, 
                               (Math.random() - 0.5) * screenSize.height * 0.8, 0);
            case 2: // 上边进入
                return new Vec3((Math.random() - 0.5) * screenSize.width * 0.8, 
                               screenSize.height / 2 + margin, 0);
            case 3: // 下边进入
                return new Vec3((Math.random() - 0.5) * screenSize.width * 0.8, 
                               -screenSize.height / 2 - margin, 0);
            default:
                return new Vec3(-screenSize.width / 2 - margin, 0, 0);
        }
    }

    // 获取出口点（从除了入口边之外的其他3边中随机选择）
    private getExitPoint(entryPoint: Vec3): Vec3 {
        const screenSize = view.getVisibleSize();
        const margin = 100;
        
        // 确定入口是哪一边：0=左，1=右，2=上，3=下
        let entrySide = -1;
        if (entryPoint.x < -screenSize.width / 2) {
            entrySide = 0; // 左边进入
        } else if (entryPoint.x > screenSize.width / 2) {
            entrySide = 1; // 右边进入
        } else if (entryPoint.y > screenSize.height / 2) {
            entrySide = 2; // 上边进入
        } else {
            entrySide = 3; // 下边进入
        }
        
        // 创建除了入口边之外的其他3个边的数组
        const availableExitSides: number[] = [];
        for (let i = 0; i < 4; i++) {
            if (i !== entrySide) {
                availableExitSides.push(i);
            }
        }
        
        // 从可用的出口边中随机选择一个
        const randomExitSideIndex = Math.floor(Math.random() * availableExitSides.length);
        const exitSide = availableExitSides[randomExitSideIndex];
        

        
        // 根据选择的出口边生成出口点
        switch (exitSide) {
            case 0: // 左边出去
                return new Vec3(-screenSize.width / 2 - margin, 
                               (Math.random() - 0.5) * screenSize.height * 0.8, 0);
            case 1: // 右边出去
                return new Vec3(screenSize.width / 2 + margin, 
                               (Math.random() - 0.5) * screenSize.height * 0.8, 0);
            case 2: // 上边出去
                return new Vec3((Math.random() - 0.5) * screenSize.width * 0.8, 
                               screenSize.height / 2 + margin, 0);
            case 3: // 下边出去
                return new Vec3((Math.random() - 0.5) * screenSize.width * 0.8, 
                               -screenSize.height / 2 - margin, 0);
            default:
                // 默认从右边出去
                return new Vec3(screenSize.width / 2 + margin, 
                               (Math.random() - 0.5) * screenSize.height * 0.8, 0);
        }
    }

    // 生成由0-2个关键点构成的平滑弧线路径
    private generateCurvedPath(start: Vec3, end: Vec3): Vec3[] {
        // 总是包含起点和终点，中间添加0-2个关键控制点
        const numKeyPoints = Math.floor(Math.random() * 3); // 0、1或2个关键点（不包括起终点）
        const path: Vec3[] = [start];
        

        
        // 计算路径的基本参数
        const totalDistance = Vec3.distance(start, end);
        const direction = new Vec3(end.x - start.x, end.y - start.y, 0);
        direction.normalize();
        
        // 创建垂直于主方向的向量，用于生成弧线偏移
        const perpendicular = new Vec3(-direction.y, direction.x, 0);
        
        // 根据距离和配置调整弧线幅度
        const maxOffset = Math.min(totalDistance * this.arcCurvature, 300); // 弧线最大偏移
        
        // 如果没有关键点，直接返回直线路径
        if (numKeyPoints === 0) {
            path.push(end);

            return path;
        }
        
        // 生成具有角度限制的平滑弧线关键点
        const maxAngleChange = this.maxAngleChange; // 使用配置的最大角度变化限制
        
        for (let i = 1; i <= numKeyPoints; i++) {
            const t = i / (numKeyPoints + 1); // 在路径上的位置比例 (0到1之间)
            
            // 基础位置：沿直线方向的插值
            const baseX = start.x + (end.x - start.x) * t;
            const baseY = start.y + (end.y - start.y) * t;
            const basePosition = new Vec3(baseX, baseY, 0);
            
            // 计算弧线偏移，但需要考虑角度限制
            let keyPoint: Vec3;
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
                attempts++;
                
                // 计算弧线偏移 - 使用正弦函数创建平滑的弧形
                const arcProgress = t; // 弧线进度 (0到1)
                const arcHeight = Math.sin(arcProgress * Math.PI); // 正弦函数在0到π之间形成弧形
                
                // 随机选择弧线的偏移方向和强度
                const offsetDirection = (Math.random() > 0.5 ? 1 : -1); // 随机选择弧线偏移方向
                const offsetStrength = 0.3 + Math.random() * 0.4; // 偏移强度 0.3-0.7，稍微减小以满足角度限制
                const currentOffset = maxOffset * arcHeight * offsetDirection * offsetStrength;
                
                // 应用垂直偏移创建弧线效果
                const offsetX = perpendicular.x * currentOffset;
                const offsetY = perpendicular.y * currentOffset;
                
                // 添加小幅度随机变化，让路径更自然
                const randomVariation = 30; // 减小随机变化范围以满足角度限制
                const randomX = (Math.random() - 0.5) * randomVariation;
                const randomY = (Math.random() - 0.5) * randomVariation;
                
                keyPoint = new Vec3(
                    baseX + offsetX + randomX,
                    baseY + offsetY + randomY,
                    0
                );
                
                // 检查角度限制
                const isValidAngle = this.checkAngleConstraint(path, keyPoint, maxAngleChange);
                
                if (isValidAngle || attempts >= maxAttempts) {
                    break;
                }
            } while (attempts < maxAttempts);
            
            // 如果多次尝试仍不满足角度限制，则使用较保守的位置
            if (attempts >= maxAttempts) {
                console.warn(`关键点${i}经过${maxAttempts}次尝试仍不满足角度限制，使用保守位置`);
                const conservativeOffset = maxOffset * 0.3; // 使用较小的偏移
                const offsetX = perpendicular.x * conservativeOffset;
                const offsetY = perpendicular.y * conservativeOffset;
                keyPoint = new Vec3(baseX + offsetX, baseY + offsetY, 0);
            }
            
            path.push(keyPoint);
            
            // 计算实际角度变化用于日志
            const actualAngleChange = this.calculateAngleChange(path, path.length - 1);

        }
        
        path.push(end);

        return path;
    }
    
    // 检查角度约束是否满足
    private checkAngleConstraint(currentPath: Vec3[], candidatePoint: Vec3, maxAngleChange: number): boolean {
        if (currentPath.length < 1) return true; // 第一个点总是有效
        
        // 创建临时路径来检查角度
        const tempPath = [...currentPath, candidatePoint];
        
        if (tempPath.length < 3) return true; // 至少需要3个点才能计算角度变化
        
        // 计算在新点处的角度变化
        const angleChange = this.calculateAngleChange(tempPath, tempPath.length - 1);
        
        return Math.abs(angleChange) <= maxAngleChange;
    }
    
    // 计算指定点处的角度变化
    private calculateAngleChange(path: Vec3[], pointIndex: number): number {
        if (pointIndex < 1 || pointIndex >= path.length - 1) {
            return 0; // 起点和终点没有角度变化
        }
        
        const prevPoint = path[pointIndex - 1];
        const currentPoint = path[pointIndex];
        const nextPoint = path[pointIndex + 1];
        
        // 计算进入该点的方向
        const incomingDirection = new Vec3(
            currentPoint.x - prevPoint.x,
            currentPoint.y - prevPoint.y,
            0
        );
        
        // 计算离开该点的方向
        const outgoingDirection = new Vec3(
            nextPoint.x - currentPoint.x,
            nextPoint.y - currentPoint.y,
            0
        );
        
        // 标准化方向向量
        incomingDirection.normalize();
        outgoingDirection.normalize();
        
        // 计算两个方向之间的角度差
        const incomingAngle = Math.atan2(incomingDirection.y, incomingDirection.x) * 180 / Math.PI;
        const outgoingAngle = Math.atan2(outgoingDirection.y, outgoingDirection.x) * 180 / Math.PI;
        
        // 计算最短角度差
        let angleDiff = outgoingAngle - incomingAngle;
        
        // 标准化角度差到 [-180, 180] 范围
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff <= -180) angleDiff += 360;
        
        return angleDiff;
    }

    // 执行鱼的游动
    private performFishSwim(): void {
        if (this.fishMoving) return;
        
        this.fishMoving = true;
        
        // 显示随机鱼子节点
        this.showRandomFishChild();
        
        // 获取入口和出口点
        const entryPoint = this.getRandomEntryPoint();
        const exitPoint = this.getExitPoint(entryPoint);
        
        // 生成弧线关键点
        const keyPoints = this.generateCurvedPath(entryPoint, exitPoint);
        
        // 基于关键点生成平滑曲线路径
        const smoothPath = this.generateSmoothCurvePath(keyPoints);
        
        // 保存路径引用
        this.currentPath = keyPoints;
        this.currentSmoothPath = smoothPath;
        

        
        // 设置鱼到入口点
        this.fishNode.setPosition(entryPoint);
        
        // 立即调整鱼的初始朝向，指向第一个移动方向
        if (smoothPath.length > 1) {
            const initialDirection = new Vec3(
                smoothPath[1].x - smoothPath[0].x,
                smoothPath[1].y - smoothPath[0].y,
                0
            );
            const initialRotationAngle = this.directionToRotation(initialDirection);
            this.fishNode.setRotationFromEuler(0, 0, initialRotationAngle);
        }
        
        // 开始沿平滑路径移动
        this.animateFishAlongPath(smoothPath);
    }

    // 统一的角度标准化函数
    private normalizeAngle(angle: number): number {
        // 将角度标准化到 [-180, 180] 范围内
        while (angle > 180) angle -= 360;
        while (angle <= -180) angle += 360;
        return angle;
    }

    // 计算最短路径的角度差值
    private calculateShortestAngleDiff(fromAngle: number, toAngle: number): number {
        fromAngle = this.normalizeAngle(fromAngle);
        toAngle = this.normalizeAngle(toAngle);
        
        let diff = toAngle - fromAngle;
        
        // 选择最短旋转路径
        if (diff > 180) {
            diff -= 360;
        } else if (diff < -180) {
            diff += 360;
        }
        
        return diff;
    }

    // 计算平滑的旋转角度差值
    private calculateSmoothRotation(currentRotation: number, targetRotation: number): number {
        // 标准化两个角度
        currentRotation = this.normalizeAngle(currentRotation);
        targetRotation = this.normalizeAngle(targetRotation);
        
        const rotationDiff = this.calculateShortestAngleDiff(currentRotation, targetRotation);
        
        return this.normalizeAngle(currentRotation + rotationDiff);
    }



    // 沿平滑曲线路径移动鱼（使用连续动画而非分段移动）
    private animateFishAlongPath(path: Vec3[]): void {
        if (path.length < 2) {
            this.fishMoving = false;
            this.scheduleNextFishSwim();
            return;
        }
        
        // 计算总路径长度
        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            totalDistance += Vec3.distance(path[i], path[i + 1]);
        }
        
        // 计算总移动时间
        const totalMoveDuration = totalDistance / this.fishSpeed;
        

        
        // 使用连续的tween动画，通过onUpdate回调来实现平滑的曲线移动
        let currentPathProgress = 0; // 当前路径进度 0-1
        
        tween({ progress: 0 })
            .to(totalMoveDuration, { progress: 1 }, {
                easing: easing.linear, // 匀速移动
                onUpdate: (target: any) => {
                    currentPathProgress = target.progress;
                    
                    // 根据进度计算当前位置
                    const currentPos = this.getPositionAtProgress(path, currentPathProgress);
                    const lookAheadPos = this.getPositionAtProgress(path, Math.min(currentPathProgress + 0.02, 1)); // 稍微提前一点获取朝向
                    
                    // 更新鱼的位置
                    this.fishNode.setPosition(currentPos);
                    
                    // 计算并更新朝向
                    const direction = new Vec3(
                        lookAheadPos.x - currentPos.x,
                        lookAheadPos.y - currentPos.y,
                        0
                    );
                    
                    if (direction.length() > 1) { // 确保有足够的方向向量
                        const targetAngle = this.directionToRotation(direction);
                        const currentRotation = this.normalizeAngle(this.fishNode.eulerAngles.z);
                        const normalizedTargetAngle = this.normalizeAngle(targetAngle);
                        
                        // 计算角度差异
                        const angleDiff = this.calculateShortestAngleDiff(currentRotation, normalizedTargetAngle);
                        
                        // 平滑调整朝向
                        if (Math.abs(angleDiff) > 1) {
                            const adjustmentFactor = Math.min(Math.abs(angleDiff) / 20, this.rotationResponsiveness);
                            const adjustmentAngle = this.normalizeAngle(currentRotation + angleDiff * adjustmentFactor);
                            this.fishNode.setRotationFromEuler(0, 0, adjustmentAngle);
                        }
                    }
                }
            })
            .call(() => {
                // 移动完成，开始下一次游动
                this.fishMoving = false;
                this.scheduleNextFishSwim();
            })
            .start();
    }
    
    // 根据路径进度(0-1)计算位置
    private getPositionAtProgress(path: Vec3[], progress: number): Vec3 {
        if (progress <= 0) return path[0];
        if (progress >= 1) return path[path.length - 1];
        
        // 计算累计距离数组
        const distances: number[] = [0];
        let totalDistance = 0;
        
        for (let i = 0; i < path.length - 1; i++) {
            const segmentDistance = Vec3.distance(path[i], path[i + 1]);
            totalDistance += segmentDistance;
            distances.push(totalDistance);
        }
        
        // 根据进度查找对应的路径段
        const targetDistance = totalDistance * progress;
        
        for (let i = 0; i < distances.length - 1; i++) {
            if (targetDistance >= distances[i] && targetDistance <= distances[i + 1]) {
                // 在第i段中
                const segmentProgress = (targetDistance - distances[i]) / (distances[i + 1] - distances[i]);
                
                // 线性插值计算位置
                const startPos = path[i];
                const endPos = path[i + 1];
                
                return new Vec3(
                    startPos.x + (endPos.x - startPos.x) * segmentProgress,
                    startPos.y + (endPos.y - startPos.y) * segmentProgress,
                    0
                );
            }
        }
        
        return path[path.length - 1];
    }
    

    
    // 保存当前路径的引用，以便在移动过程中访问
    private currentPath: Vec3[] = null;
    private currentSmoothPath: Vec3[] = null; // 保存插值后的平滑路径
    
    private getCurrentPath(): Vec3[] {
        return this.currentSmoothPath || this.currentPath;
    }
    
    // Catmull-Rom样条曲线插值
    private catmullRomInterpolation(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        
        const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );
        
        return new Vec3(x, y, 0);
    }
    
    // 生成平滑的曲线路径
    private generateSmoothCurvePath(keyPoints: Vec3[]): Vec3[] {
        if (keyPoints.length < 2) return keyPoints;
        
        // 如果只有两个点（直线路径），直接生成插值点
        if (keyPoints.length === 2) {
            return this.generateLinearPath(keyPoints[0], keyPoints[1]);
        }
        
        const smoothPath: Vec3[] = [];
        const segmentResolution = this.curveResolution; // 每段的插值点数
        
        // 扩展端点以确保曲线通过起点和终点
        const extendedPoints: Vec3[] = [];
        
        // 添加起点前的虚拟点
        const startExtension = new Vec3(
            keyPoints[0].x - (keyPoints[1].x - keyPoints[0].x),
            keyPoints[0].y - (keyPoints[1].y - keyPoints[0].y),
            0
        );
        extendedPoints.push(startExtension);
        
        // 添加所有关键点
        extendedPoints.push(...keyPoints);
        
        // 添加终点后的虚拟点
        const endIndex = keyPoints.length - 1;
        const endExtension = new Vec3(
            keyPoints[endIndex].x + (keyPoints[endIndex].x - keyPoints[endIndex - 1].x),
            keyPoints[endIndex].y + (keyPoints[endIndex].y - keyPoints[endIndex - 1].y),
            0
        );
        extendedPoints.push(endExtension);
        

        
        // 对每个相邻的4个点进行Catmull-Rom插值
        for (let i = 0; i < extendedPoints.length - 3; i++) {
            const p0 = extendedPoints[i];
            const p1 = extendedPoints[i + 1];
            const p2 = extendedPoints[i + 2];
            const p3 = extendedPoints[i + 3];
            
            // 如果是第一段，包含起点
            const startT = (i === 0) ? 0 : 1 / segmentResolution;
            // 如果是最后一段，包含终点
            const endT = (i === extendedPoints.length - 4) ? 1 : 1 - 1 / segmentResolution;
            
            for (let j = 0; j < segmentResolution; j++) {
                const t = startT + (endT - startT) * j / (segmentResolution - 1);
                if (t >= 0 && t <= 1) {
                    const interpolatedPoint = this.catmullRomInterpolation(p0, p1, p2, p3, t);
                    smoothPath.push(interpolatedPoint);
                }
            }
        }
        
        // 确保终点被包含
        if (smoothPath.length > 0) {
            const lastPoint = smoothPath[smoothPath.length - 1];
            const targetEnd = keyPoints[keyPoints.length - 1];
            if (Vec3.distance(lastPoint, targetEnd) > 10) {
                smoothPath.push(targetEnd);
            }
        }
        

        return smoothPath;
    }
    
    // 生成直线路径的插值点
    private generateLinearPath(start: Vec3, end: Vec3): Vec3[] {
        const linearPath: Vec3[] = [];
        const numPoints = Math.max(5, Math.floor(this.curveResolution / 2)); // 直线路径使用较少的点
        
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1); // 0 到 1 的插值参数
            
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;
            
            linearPath.push(new Vec3(x, y, 0));
        }
        

        return linearPath;
    }

    // 调度下一次鱼游动
    private scheduleNextFishSwim(): void {
        // 使用配置的时间范围进行随机等待
        const delayRange = this.fishMaxWaitTime - this.fishMinWaitTime;
        const delay = this.fishMinWaitTime + Math.random() * delayRange;
        

        
        this.fishTimerId = setTimeout(() => {
            this.performFishSwim();
        }, delay * 1000);
    }

    update(deltaTime: number) {
        
    }

    onDestroy() {
        // 清理定时器，避免内存泄漏
        if (this.fishTimerId) {
            clearTimeout(this.fishTimerId);
            this.fishTimerId = null;
        }
    }
}


