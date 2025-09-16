# 钱塘 - Cocos Creator 拼图游戏

这是一个使用 Cocos Creator 3.8.6 开发的拼图游戏项目。

## 项目特性

- 🎮 经典拼图游戏玩法
- 🎨 多种精美背景主题
- 🎵 背景音乐和音效
- 📱 支持移动端和桌面端
- ⭐ 多关卡设计
- 🎯 动画效果丰富

## 技术栈

- **游戏引擎**: Cocos Creator 3.8.6
- **编程语言**: TypeScript
- **平台支持**: Web, 微信小游戏, 移动端, 桌面端

## 项目结构

```
qiantang/
├── assets/           # 游戏资源
│   ├── anim/        # 动画文件
│   ├── img/         # 图片资源
│   ├── particle/    # 粒子效果
│   ├── plist/       # 纹理图集
│   ├── prefab/      # 预制体
│   ├── scene/       # 场景文件
│   ├── script/      # TypeScript脚本
│   └── sound/       # 音频文件
├── settings/        # 项目设置
└── package.json     # 项目配置
```

## 开发环境要求

- Cocos Creator 3.8.6 或更高版本
- Node.js (推荐 LTS 版本)

## 快速开始

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/qiantang.git
   cd qiantang
   ```

2. **使用 Cocos Creator 打开**
   - 启动 Cocos Creator
   - 选择 "打开项目"
   - 选择 `qiantang` 文件夹

3. **运行游戏**
   - 在 Cocos Creator 中点击 "运行" 按钮
   - 选择目标平台进行预览

## 构建发布

1. 在 Cocos Creator 中选择 "项目" -> "构建发布"
2. 选择目标平台：
   - Web Mobile
   - 微信小游戏
   - Android
   - iOS
   - Windows
   - Mac
3. 配置构建参数
4. 点击 "构建" 开始构建

## 游戏玩法

1. 点击拼图块移动到空白位置
2. 将所有拼图块排列成正确的图案
3. 完成当前关卡后解锁下一关
4. 享受不同主题的精美画面

## 主要脚本说明

- `game.ts` - 主游戏逻辑控制器
- `blockManager.ts` - 拼图块管理器
- `block.ts` - 单个拼图块组件
- `menu.ts` - 主菜单控制
- `gameData.ts` - 游戏数据管理
- `fish.ts` - 鱼类动画组件

## 贡献

欢迎提交 Pull Request 或创建 Issue 来改进这个项目。

## 许可证

[MIT License](LICENSE)

## 联系方式

如有问题或建议，请通过 Issues 联系我们。

---

**享受游戏的乐趣！** 🎮✨
