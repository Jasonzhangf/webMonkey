# 需求文档

## 介绍

动态网页操作自动化工具是一个综合性的浏览器自动化平台，核心包含动态编排器和动态执行器。该系统允许用户通过可视化界面编排复杂的网页操作任务，支持多浏览器实例、智能状态管理、Cookie自动化管理，以及灵活的任务流程控制。

## 需求

### 需求 1 - 浏览器自动化核心

**用户故事：** 作为自动化工具用户，我希望能够在执行阶段启动和管理多个浏览器实例，以便同时执行多个自动化任务。

#### 验收标准

1. WHEN 执行自动化任务时 THEN 系统 SHALL 能够使用 Camoufox 作为浏览器引擎启动多个独立的浏览器实例
2. WHEN 用户请求新的执行实例 THEN 系统 SHALL 创建独立的浏览器会话，不与其他实例冲突
3. WHEN 执行实例运行时 THEN 系统 SHALL 维护每个实例的独立状态和配置
4. WHEN 进行流程编排时 THEN 系统 SHALL 使用用户现有浏览器和浏览器插件
5. WHEN 执行已编排的任务时 THEN 系统 SHALL 使用独立的Camoufox实例

### 需求 2 - 统一操作界面

**用户故事：** 作为用户，我希望有一个统一的操作界面来管理元素捕获、操作配置和执行列表，以便高效地创建和管理自动化任务。

#### 验收标准

1. WHEN 安装浏览器插件 THEN 系统 SHALL 提供一个统一的操作面板
2. WHEN 操作面板显示 THEN 系统 SHALL 包含捕获列表、执行列表和操作配置区域
3. WHEN 用户与操作面板交互 THEN 面板元素 SHALL NOT 被元素捕获功能选中
4. WHEN 页面加载完成 THEN 插件 SHALL 自动注入统一操作面板
5. WHEN 面板最小化时 THEN 系统 SHALL 保持基本功能可访问性
6. WHEN 面板展开时 THEN 系统 SHALL 显示完整的操作管理界面

### 需求 3 - 后端服务和状态管理

**用户故事：** 作为系统管理员，我希望有一个后端Python服务来处理文件操作和状态记录，以便保持系统的持久化状态。

#### 验收标准

1. WHEN 前端发送数据 THEN 后端服务 SHALL 接收并保存用户输入数据
2. WHEN 系统运行时 THEN 后端服务 SHALL 记录和维护任务执行状态
3. WHEN 需要文件操作时 THEN 后端服务 SHALL 提供文件读写、创建、删除等功能
4. WHEN 状态变更时 THEN 后端服务 SHALL 实时更新状态记录

### 需求 4 - Cookie自动化管理

**用户故事：** 作为用户，我希望系统能够自动管理登录状态，以便无需重复登录目标网站。

#### 验收标准

1. WHEN 用户在目标网站登录成功 THEN 系统 SHALL 自动以"主域名+日期时间"格式存储Cookie
2. WHEN 访问已登录过的网站 THEN 系统 SHALL 自动检查是否存在对应的Cookie
3. IF Cookie存在 THEN 系统 SHALL 自动加载Cookie以维持登录状态
4. WHEN Cookie过期或无效 THEN 系统 SHALL 提示用户重新登录

### 需求 5 - 任务状态机

**用户故事：** 作为用户，我希望有一个清晰的任务状态管理系统，以便了解和控制任务的执行流程。

#### 验收标准

1. WHEN 创建任务时 THEN 系统 SHALL 支持设置触发条件：定时触发、显式指派、循环触发
2. WHEN 任务创建后 THEN 系统 SHALL 将任务状态设置为"等待状态"
3. WHEN 触发条件满足 THEN 系统 SHALL 将任务状态转换为"执行状态"
4. WHEN 任务执行出错 THEN 系统 SHALL 将任务状态转换为"错误状态"
5. WHEN 任务执行完成 THEN 系统 SHALL 将任务状态转换为"完成状态"
6. WHEN 任务进入执行状态 THEN 系统 SHALL 从开始节点启动，在结束节点停止

### 需求 6 - 工作流编排

**用户故事：** 作为用户，我希望能够编排复杂的任务流程，以便实现自动化的业务逻辑。

#### 验收标准

1. WHEN 编排任务时 THEN 系统 SHALL 支持顺序执行、跳转、循环等标准任务流执行机制
2. WHEN 保存工作流时 THEN 系统 SHALL 使用JSON格式表示执行编排顺序
3. WHEN 执行工作流时 THEN 系统 SHALL 按照JSON定义的顺序执行节点
4. WHEN 需要条件分支时 THEN 系统 SHALL 支持基于条件的跳转逻辑

### 需求 7 - 节点数据管理

**用户故事：** 作为用户，我希望节点有清晰的数据结构和实例管理，以便复用和维护任务配置。

#### 验收标准

1. WHEN 创建节点时 THEN 系统 SHALL 为节点提供显示数据（用户交互）和内部数据（流程执行）
2. WHEN 编辑节点时 THEN 系统 SHALL 保持节点的标准数据结构和默认值不变
3. WHEN 保存任务时 THEN 系统 SHALL 创建新的任务实例，只保存用户的实例配置数据
4. WHEN 加载任务实例时 THEN 系统 SHALL 只加载节点名、版本和用户数据实例
5. WHEN 执行任务时 THEN 系统 SHALL 支持任务的嵌套执行

### 需求 8 - 可视化编排器

**用户故事：** 作为用户，我希望有一个直观的可视化编排界面，以便通过拖拽和连接的方式创建任务流程。

#### 验收标准

1. WHEN 打开编排器时 THEN 系统 SHALL 提供基于Canvas的节点编排界面
2. WHEN 编排任务时 THEN 系统 SHALL 提供万能节点和基本功能节点
3. WHEN 使用万能节点时 THEN 系统 SHALL 支持动态添加selector入口和操作
4. WHEN 万能节点点击连接时 THEN 节点 SHALL 与浏览器插件建立实时连接
5. WHEN 浏览器插件捕获元素时 THEN 编排器 SHALL 接收并记录元素定位数据到对应节点
6. WHEN 保存编排配置时 THEN 系统 SHALL 将元素定位数据保存到节点配置中

### 需求 9 - 元素捕获和操作管理

**用户故事：** 作为用户，我希望能够直观地捕获页面元素并管理操作序列，以便创建完整的自动化流程。

#### 验收标准

1. WHEN 启用捕获模式时 THEN 插件 SHALL 高亮显示鼠标悬停的可见元素
2. WHEN 用户点击元素时 THEN 插件 SHALL 将元素添加到捕获列表
3. WHEN 元素被捕获时 THEN 系统 SHALL 生成多种定位方式（CSS选择器、XPath、属性组合等）
4. WHEN 用户点击捕获列表中的元素时 THEN 系统 SHALL 在右侧展开操作选项面板
5. WHEN 用户选择操作类型时 THEN 系统 SHALL 提供两个选择：立即模拟执行或添加到执行列表
6. WHEN 操作添加到执行列表时 THEN 系统 SHALL 支持操作顺序管理（上移、下移、删除）
7. WHEN 配置执行列表操作时 THEN 系统 SHALL 支持添加等待时间配置
8. WHEN 执行列表完成时 THEN 系统 SHALL 支持导出为规则表格式

### 需求 10 - 插件与编排器通信

**用户故事：** 作为系统架构师，我希望浏览器插件与编排器之间有稳定的通信机制，以便实现元素数据的准确传递和节点配置的实时更新。

#### 验收标准

1. WHEN 编排器启动时 THEN 系统 SHALL 建立与浏览器插件的WebSocket或消息传递通道
2. WHEN 万能节点请求连接时 THEN 系统 SHALL 在插件和特定节点之间建立唯一的通信会话
3. WHEN 插件捕获元素数据时 THEN 系统 SHALL 将数据实时传递给对应的编排器节点
4. WHEN 编排器节点更新时 THEN 系统 SHALL 通知插件更新相应的配置状态
5. WHEN 通信中断时 THEN 系统 SHALL 提供重连机制和错误提示
6. WHEN 多个节点同时连接时 THEN 系统 SHALL 正确路由消息到对应的节点

### 需求 11 - 变量和数据流管理

**用户故事：** 作为用户，我希望节点之间能够传递数据，以便实现复杂的数据处理流程。

#### 验收标准

1. WHEN 配置节点时 THEN 系统 SHALL 允许选择输入变量和输出变量
2. WHEN 节点执行时 THEN 系统 SHALL 将输出变量传递到下个节点
3. WHEN 设置数据流时 THEN 系统 SHALL 支持阻塞和非阻塞模式选择
4. WHEN 执行流程时 THEN 系统 SHALL 支持按照顺序执行和跳转逻辑处理数据流

### 需求 12 - 独立执行器和REST API控制

**用户故事：** 作为系统集成者，我希望执行器能够独立运行并提供REST API控制，以便与其他系统集成或作为MCP服务使用。

#### 验收标准

1. WHEN 启动执行器时 THEN 系统 SHALL 支持后台无头模式运行
2. WHEN 执行器运行时 THEN 系统 SHALL 提供完整的REST API接口用于任务控制
3. WHEN 不使用编排器时 THEN 执行器 SHALL 能够独立运行和执行预定义工作流
4. WHEN 配置为MCP服务时 THEN 执行器 SHALL 提供标准MCP协议接口
5. WHEN 接收API请求时 THEN 执行器 SHALL 支持任务创建、启动、停止、查询状态等操作
6. WHEN 执行任务时 THEN 执行器 SHALL 返回详细的执行结果和日志信息

### 需求 13 - 局域网访问支持

**用户故事：** 作为团队用户，我希望执行器和编排器都支持局域网访问，以便团队成员可以共享和协作使用自动化工具。

#### 验收标准

1. WHEN 启动编排器时 THEN 系统 SHALL 支持绑定到局域网IP地址
2. WHEN 启动执行器时 THEN 系统 SHALL 支持局域网访问和远程控制
3. WHEN 局域网用户访问时 THEN 系统 SHALL 提供身份验证和权限控制
4. WHEN 多用户同时访问时 THEN 系统 SHALL 支持会话隔离和资源管理
5. WHEN 网络配置时 THEN 系统 SHALL 提供防火墙和安全配置指导
6. WHEN 远程访问时 THEN 系统 SHALL 保持与本地访问相同的功能完整性