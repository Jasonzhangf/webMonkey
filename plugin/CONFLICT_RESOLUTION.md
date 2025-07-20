# 🔧 插件冲突解决指南

## 问题描述

如果你看到多个浮动菜单或者界面重叠，这通常是因为：
1. 浏览器中同时运行了多个版本的插件
2. 旧版本的插件没有完全卸载
3. 页面缓存了旧的内容脚本

## 🚀 解决方案

### 方法1: 完全重新安装插件

1. **卸载旧插件**
   - 打开 `chrome://extensions/`
   - 找到所有相关的插件（"Web Automation Orchestrator"、"网页自动化助手"等）
   - 点击"移除"完全卸载

2. **清理浏览器缓存**
   - 按 `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

3. **重新构建和安装**
   ```bash
   cd plugin
   npm run build
   ```
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `plugin/dist` 目录

### 方法2: 刷新页面

1. **硬刷新页面**
   - 按 `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)
   - 或者按 `F12` 打开开发者工具 → 右键刷新按钮 → "清空缓存并硬性重新加载"

2. **检查控制台**
   - 按 `F12` 打开开发者工具
   - 查看 Console 标签页
   - 应该看到 "初始化元素捕获器内容脚本..." 的日志

### 方法3: 手动清理冲突

如果问题仍然存在，可以在浏览器控制台中运行以下代码：

```javascript
// 清理所有插件UI
document.querySelectorAll('[class*="wao-"]').forEach(el => el.remove());

// 清理全局变量
delete window.waoSimpleContentScriptInstance;
delete window.waoSimpleContentScriptInitialized;
delete window.waoSimpleContentScriptReady;

// 重新加载页面
location.reload();
```

## 🎯 验证解决方案

### 正确状态应该显示：
- ✅ 只有一个浮动菜单
- ✅ 菜单标题显示 "🎯 元素捕获器"
- ✅ 插件名称显示 "元素捕获器"
- ✅ 控制台显示 "元素捕获器初始化完成"

### 错误状态的表现：
- ❌ 多个浮动菜单重叠
- ❌ 菜单标题显示其他名称
- ❌ 界面元素冲突或显示异常

## 🔍 调试信息

### 检查插件状态
在浏览器控制台中运行：
```javascript
console.log('插件实例:', window.waoSimpleContentScriptInstance);
console.log('初始化状态:', window.waoSimpleContentScriptInitialized);
console.log('就绪状态:', window.waoSimpleContentScriptReady);
console.log('菜单数量:', document.querySelectorAll('.wao-simple-menu').length);
```

### 查看插件信息
1. 打开 `chrome://extensions/`
2. 找到 "元素捕获器" 插件
3. 点击 "详细信息"
4. 检查版本号和权限

## 🛡️ 预防措施

### 避免冲突的最佳实践：
1. **只安装一个版本** - 确保只有最新版本的插件在运行
2. **定期清理** - 定期清理浏览器缓存和无用的扩展
3. **使用开发者模式** - 开发时使用开发者模式加载插件
4. **监控控制台** - 注意控制台的错误和警告信息

### 插件内置的冲突处理：
- ✅ 自动检测重复初始化
- ✅ 定期清理冲突UI（每5秒）
- ✅ 启动时清理其他插件UI
- ✅ 防止多个菜单实例

## 📞 获取帮助

如果问题仍然无法解决：

1. **检查浏览器版本** - 确保使用最新版本的Chrome
2. **查看错误日志** - 在开发者工具的Console中查看错误信息
3. **重启浏览器** - 完全关闭并重新启动浏览器
4. **检查权限** - 确保插件有必要的权限

## 🎉 成功标志

当看到以下情况时，说明冲突已解决：
- 页面右上角只有一个 "🎯 元素捕获器" 菜单
- 点击插件图标显示 "元素捕获器" 弹出窗口
- 元素选择功能正常工作
- 没有重复的UI元素或错误信息