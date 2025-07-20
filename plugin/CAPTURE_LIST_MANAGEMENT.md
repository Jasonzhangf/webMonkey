# 捕获列表管理功能

## 🎯 新增功能

为捕获列表添加了完整的管理功能，用户现在可以：

1. **删除捕获的元素**
2. **调整元素顺序**（上移/下移）
3. **点击元素内容区域选择元素**（配置操作）

## 🎨 界面设计

### 捕获列表项布局
```
┌─────────────────────────────────────────────────┐
│ [元素描述]                    [↑] [↓] [删除]     │
│ [捕获时间]                                      │
└─────────────────────────────────────────────────┘
```

### 控制按钮功能
- **↑ 上移**: 将元素在列表中向上移动一位
- **↓ 下移**: 将元素在列表中向下移动一位  
- **删除**: 从捕获列表中移除该元素

### 按钮状态
- 第一个元素的"上移"按钮被禁用
- 最后一个元素的"下移"按钮被禁用
- 删除按钮始终可用

## 🛠️ 技术实现

### 1. HTML结构更新
```typescript
this.captureList.innerHTML = this.capturedElements.map((element, index) => `
  <div class="wao-list-item" data-id="${element.id}">
    <div class="wao-item-content">
      <div class="wao-item-title">${element.description}</div>
      <div class="wao-item-desc">${new Date(element.timestamp).toLocaleTimeString()}</div>
    </div>
    <div class="wao-item-controls">
      <button class="wao-item-control wao-move-up" data-action="up" data-id="${element.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button class="wao-item-control wao-move-down" data-action="down" data-id="${element.id}" ${index === this.capturedElements.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="wao-item-control wao-delete" data-action="delete" data-id="${element.id}">删除</button>
    </div>
  </div>
`).join('');
```

### 2. 事件处理分离
```typescript
// 点击内容区域 → 选择元素（配置操作）
const contentArea = item.querySelector('.wao-item-content');
contentArea?.addEventListener('click', (e) => {
  const id = (e.currentTarget as HTMLElement).closest('.wao-list-item')?.getAttribute('data-id');
  if (id) this.selectCapturedElement(id);
});

// 点击控制按钮 → 管理操作
this.captureList.querySelectorAll('.wao-item-control').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止触发元素选择
    const action = (e.target as HTMLElement).getAttribute('data-action');
    const id = (e.target as HTMLElement).getAttribute('data-id');
    if (action && id) this.handleCaptureListAction(action, id);
  });
});
```

### 3. 操作处理逻辑
```typescript
private handleCaptureListAction(action: string, id: string): void {
  const index = this.capturedElements.findIndex(el => el.id === id);
  if (index === -1) return;
  
  switch (action) {
    case 'up':
      // 交换位置：当前元素与上一个元素
      [this.capturedElements[index], this.capturedElements[index - 1]] = 
      [this.capturedElements[index - 1], this.capturedElements[index]];
      break;
    case 'down':
      // 交换位置：当前元素与下一个元素
      [this.capturedElements[index], this.capturedElements[index + 1]] = 
      [this.capturedElements[index + 1], this.capturedElements[index]];
      break;
    case 'delete':
      // 从数组中移除元素
      this.capturedElements.splice(index, 1);
      break;
  }
  
  this.updateCaptureList(); // 更新界面
  this.showNotification('操作完成', 'info');
}
```

## 🎨 CSS样式设计

### 按钮样式
```css
.wao-item-control {
  padding: 2px 6px !important;
  border: none !important;
  border-radius: 3px !important;
  cursor: pointer !important;
  font-size: 11px !important;
  min-width: 20px !important;
  height: 20px !important;
}

.wao-move-up, .wao-move-down {
  background: #17a2b8 !important; /* 蓝色 */
  color: white !important;
}

.wao-delete {
  background: #dc3545 !important; /* 红色 */
  color: white !important;
}

.wao-item-control:disabled {
  background: #e9ecef !important;
  color: #6c757d !important;
  cursor: not-allowed !important;
}
```

### 布局样式
```css
.wao-list-item {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.wao-item-content {
  flex: 1 !important;
  cursor: pointer !important;
}

.wao-item-controls {
  display: flex !important;
  gap: 4px !important;
  align-items: center !important;
}
```

## 🚀 用户操作流程

### 基本管理操作
1. **删除元素**
   ```
   捕获元素 → 在捕获列表中找到该元素 → 点击"删除"按钮 → 元素从列表中移除
   ```

2. **调整顺序**
   ```
   捕获多个元素 → 点击"↑"或"↓"按钮 → 元素位置发生变化 → 列表重新排序
   ```

3. **配置操作**
   ```
   点击元素的内容区域（标题和时间） → 右侧显示操作配置面板 → 选择操作类型
   ```

### 高级使用场景
1. **重新排序执行顺序**
   - 用户可以通过上移/下移调整捕获元素的顺序
   - 这个顺序会影响后续添加到执行列表的顺序

2. **清理不需要的元素**
   - 误捕获的元素可以直接删除
   - 不影响其他已捕获的元素

3. **批量管理**
   - 可以连续调整多个元素的位置
   - 可以删除多个不需要的元素

## 📋 功能特性

### ✅ 已实现的功能
- 元素删除（从捕获列表中移除）
- 元素上移（向列表前方移动）
- 元素下移（向列表后方移动）
- 边界检查（首尾元素的移动限制）
- 视觉反馈（操作完成通知）
- 事件隔离（管理操作不触发元素选择）

### ✅ 用户体验优化
- 直观的按钮图标（↑↓删除）
- 禁用状态的视觉提示
- 操作完成的即时反馈
- 清晰的功能区域分离

### ✅ 技术优化
- 高效的数组操作（splice、交换）
- 事件冒泡控制（stopPropagation）
- 动态按钮状态管理
- 实时界面更新

## 🧪 测试建议

### 测试场景1: 基本删除功能
1. 捕获2-3个元素
2. 点击其中一个元素的"删除"按钮
3. 确认元素从列表中消失
4. 确认计数器更新正确

### 测试场景2: 顺序调整功能
1. 捕获3个以上元素
2. 选择中间的元素，点击"↑"按钮
3. 确认元素向上移动一位
4. 点击"↓"按钮，确认元素向下移动
5. 测试首尾元素的按钮禁用状态

### 测试场景3: 功能区域分离
1. 捕获一个元素
2. 点击元素的标题区域，确认显示操作配置面板
3. 点击控制按钮，确认不会触发操作配置面板

## 🎉 改进效果

用户现在拥有完整的捕获列表管理能力：
- 可以清理误捕获的元素
- 可以调整元素的执行顺序
- 界面更加直观和易用
- 操作反馈更加及时

这些功能让用户能够更精确地控制自动化流程的构建过程！