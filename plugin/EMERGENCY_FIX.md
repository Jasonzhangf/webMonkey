# 🚨 紧急修复指南

## 立即解决菜单重叠问题

如果你看到两个重叠的菜单或菜单闪烁消失，请按以下步骤操作：

### 步骤1: 在浏览器控制台运行清理脚本

1. 按 `F12` 打开开发者工具
2. 切换到 `Console` 标签页
3. 复制并粘贴以下代码，然后按回车：

```javascript
// 紧急清理脚本
console.log('开始紧急清理...');

// 1. 清理所有插件UI
document.querySelectorAll('[class*="wao-"]').forEach(el => {
  console.log('移除元素:', el.className);
  el.remove();
});

// 2. 清理全局变量
delete window.waoSimpleContentScriptInstance;
delete window.waoSimpleContentScriptInitialized;
delete window.waoSimpleContentScriptReady;
delete window.waoContentScriptInitialized;

// 3. 清理事件监听器
document.removeEventListener('DOMContentLoaded', arguments.callee);

console.log('清理完成，3秒后重新加载页面...');

// 4. 重新加载页面
setTimeout(() => {
  location.reload();
}, 3000);
```

### 步骤2: 完全重新安装插件

1. **卸载所有相关插件**
   - 打开 `chrome://extensions/`
   - 移除所有名称包含"自动化"、"捕获"、"Web Automation"的插件

2. **清理浏览器数据**
   - 按 `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
   - 选择"缓存的图片和文件"和"Cookie及其他网站数据"
   - 点击"清除数据"

3. **重新构建和安装**
   ```bash
   cd plugin
   rm -rf dist
   npm run build
   ```
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `plugin/dist` 目录

### 步骤3: 验证修复

重新加载页面后，应该看到：
- ✅ 只有一个 "🎯 元素捕获器" 菜单
- ✅ 菜单稳定显示，不会消失
- ✅ 控制台显示 "元素捕获器初始化完成"
- ✅ 没有重复的UI元素

## 如果问题仍然存在

### 检查是否有多个插件版本

在控制台运行：
```javascript
// 检查插件状态
console.log('=== 插件状态检查 ===');
console.log('菜单数量:', document.querySelectorAll('.wao-simple-menu').length);
console.log('所有wao元素:', document.querySelectorAll('[class*="wao-"]').length);
console.log('实例状态:', window.waoSimpleContentScriptInstance ? '存在' : '不存在');
console.log('初始化状态:', window.waoSimpleContentScriptInitialized ? '已初始化' : '未初始化');

// 列出所有wao相关元素
document.querySelectorAll('[class*="wao-"]').forEach((el, index) => {
  console.log(`元素${index + 1}:`, el.className, el.tagName);
});
```

### 手动创建单一菜单

如果自动修复失败，可以手动创建菜单：
```javascript
// 手动创建单一菜单
console.log('手动创建菜单...');

// 清理所有现有菜单
document.querySelectorAll('.wao-simple-menu').forEach(el => el.remove());

// 创建新菜单
const menu = document.createElement('div');
menu.className = 'wao-simple-menu';
menu.style.cssText = `
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  width: 320px !important;
  background: white !important;
  border: 1px solid #ddd !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  font-family: Arial, sans-serif !important;
  font-size: 12px !important;
  z-index: 2147483647 !important;
  padding: 10px !important;
`;

menu.innerHTML = `
  <div style="font-weight: bold; margin-bottom: 10px;">🎯 元素捕获器</div>
  <div style="color: #666; margin-bottom: 10px;">状态: 手动创建</div>
  <button onclick="this.parentElement.remove()" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
`;

document.body.appendChild(menu);
console.log('手动菜单已创建');
```

## 预防措施

为避免再次出现问题：

1. **只保留一个插件版本**
2. **定期清理浏览器缓存**
3. **使用隐身模式测试**
4. **监控控制台错误信息**

## 联系支持

如果以上方法都无法解决问题，请提供：
1. 浏览器版本信息
2. 控制台错误截图
3. 插件版本信息
4. 问题复现步骤