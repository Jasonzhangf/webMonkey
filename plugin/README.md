# Web Automation Orchestrator - Browser Extension

网页自动化编排工具 - 浏览器插件

## 功能特性

- **元素选择**: 通过Ctrl+左键选择页面元素
- **元素高亮**: 鼠标悬停时高亮显示可选择的元素
- **操作定义**: 为选中的元素定义自动化操作（点击、输入、提取等）
- **实时通信**: 与后端编排器建立WebSocket连接
- **跨页面支持**: 支持页面导航和多标签页操作

## 安装方法

### 开发模式安装

1. 克隆项目并构建插件：
```bash
cd plugin
npm install
npm run build:dev
```

2. 在Chrome浏览器中加载插件：
   - 打开 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `plugin/dist` 目录

### 生产模式构建

```bash
npm run build
```

## 使用方法

### 1. 连接编排器

- 点击浏览器工具栏中的插件图标
- 在弹出窗口中点击"连接编排器"
- 确保后端服务正在运行（默认端口8765）

### 2. 元素选择

- 在需要自动化的网页上，按住Ctrl键并点击目标元素
- 元素会被高亮显示并发送到编排器

### 3. 操作定义

- 选择元素后，会弹出操作菜单
- 选择需要的操作类型：
  - **点击**: 模拟鼠标点击
  - **输入**: 在输入框中输入文本
  - **悬停**: 鼠标悬停操作
  - **提取**: 提取元素文本或属性
  - **滚动**: 滚动到元素位置
  - **等待**: 等待指定时间

## 技术架构

### 核心组件

1. **Background Script** (`background.js`)
   - 管理插件生命周期
   - 处理跨页面通信
   - 维护WebSocket连接

2. **Content Script** (`content.js`)
   - 注入到网页中
   - 处理元素选择和高亮
   - 生成元素定位器

3. **Popup Interface** (`popup.html`)
   - 插件控制面板
   - 显示连接状态
   - 提供设置选项

### 通信协议

插件使用WebSocket与后端编排器通信，支持以下消息类型：

- `plugin_status`: 插件状态更新
- `element_selected`: 元素选择事件
- `operation_defined`: 操作定义事件
- `node_connection_request`: 节点连接请求

### 元素定位

插件为每个选中的元素生成多种定位器：

- **CSS选择器**: 基于ID、类名和层级结构
- **XPath**: 基于DOM树路径
- **属性组合**: 基于元素属性的组合定位

## 开发指南

### 项目结构

```
plugin/
├── src/
│   ├── background.ts          # 后台脚本
│   ├── content/
│   │   ├── content.ts         # 内容脚本
│   │   └── content.css        # 样式文件
│   ├── popup/
│   │   ├── popup.html         # 弹出窗口
│   │   └── popup.js           # 弹出窗口脚本
│   ├── utils/
│   │   └── CommunicationManager.ts  # 通信管理器
│   └── icons/                 # 图标文件
├── dist/                      # 构建输出目录
├── manifest.json              # 插件清单文件
├── webpack.config.js          # 构建配置
└── tsconfig.json             # TypeScript配置
```

### 构建脚本

- `npm run build:dev`: 开发模式构建
- `npm run build`: 生产模式构建
- `npm run watch`: 监听模式构建
- `npm run lint`: 代码检查

### 调试方法

1. **Background Script调试**:
   - 在 `chrome://extensions/` 中点击"检查视图"

2. **Content Script调试**:
   - 在网页中按F12打开开发者工具
   - 查看Console标签页中的日志

3. **Popup调试**:
   - 右键点击插件图标，选择"检查弹出内容"

## 配置选项

### WebSocket连接

默认连接配置：
- 主机: `localhost`
- 端口: `8765`
- 路径: `/ws`

可以通过修改 `shared/constants.ts` 中的配置来更改连接参数。

### 权限说明

插件需要以下权限：

- `activeTab`: 访问当前活动标签页
- `scripting`: 注入内容脚本
- `storage`: 存储插件数据
- `tabs`: 管理标签页
- `webNavigation`: 监听页面导航事件
- `host_permissions`: 访问所有HTTP/HTTPS网站

## 故障排除

### 常见问题

1. **插件无法连接到编排器**
   - 检查后端服务是否正在运行
   - 确认WebSocket端口（默认8765）未被占用
   - 查看浏览器控制台是否有错误信息

2. **元素选择不工作**
   - 确认已按住Ctrl键
   - 检查页面是否完全加载
   - 查看内容脚本是否正确注入

3. **操作菜单不显示**
   - 确认插件已连接到编排器
   - 检查页面CSP策略是否阻止了脚本执行

### 日志查看

- Background Script日志: `chrome://extensions/` → 检查视图
- Content Script日志: 网页开发者工具 → Console
- 网络通信日志: 开发者工具 → Network → WS

## 贡献指南

1. Fork项目仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建Pull Request

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 支持

如有问题或建议，请在GitHub仓库中创建Issue。