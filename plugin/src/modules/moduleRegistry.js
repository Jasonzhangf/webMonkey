/**
 * WebMonkey Browser Automation - Module Registry
 * 
 * 模块注册中心 - 管理所有observe和operation节点模块
 * 
 * @author WebMonkey Team
 * @version 1.0.0
 */

class ModuleRegistry {
    constructor() {
        this.modules = {
            observe: new Map(),
            operation: new Map()
        };
        
        this.initialized = false;
    }

    /**
     * 初始化模块注册表
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        console.log('🔧 [ModuleRegistry] 初始化模块注册表...');
        
        try {
            // 注册observe模块
            await this.registerObserveModules();
            
            // 注册operation模块
            await this.registerOperationModules();
            
            this.initialized = true;
            console.log('✅ [ModuleRegistry] 模块注册表初始化完成');
            
            this.printModuleSummary();
            
        } catch (error) {
            console.error('❌ [ModuleRegistry] 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 注册observe类型模块
     */
    async registerObserveModules() {
        console.log('📋 [ModuleRegistry] 注册observe模块...');
        
        try {
            // 1. 动态列表观察模块
            if (typeof ObserveDynamicList !== 'undefined') {
                const dynamicListModule = new ObserveDynamicList();
                this.registerModule('observe', 'dynamicList', dynamicListModule);
                console.log('✅ 已注册: observeDynamicList');
            }
            
            // 2. 文本输入观察模块 (待实现)
            // const textInputModule = new ObserveTextInput();
            // this.registerModule('observe', 'textInput', textInputModule);
            
            // 3. 文本显示观察模块 (待实现)
            // const textDisplayModule = new ObserveTextDisplay();
            // this.registerModule('observe', 'textDisplay', textDisplayModule);
            
            // 4. 评论观察模块 (待实现)
            // const commentModule = new ObserveComment();
            // this.registerModule('observe', 'comment', commentModule);
            
            // 5. 展开元素观察模块 (待实现)
            // const expandableModule = new ObserveExpandable();  
            // this.registerModule('observe', 'expandable', expandableModule);
            
            // 6. 按钮观察模块 (待实现)
            // const buttonModule = new ObserveButton();
            // this.registerModule('observe', 'button', buttonModule);
            
        } catch (error) {
            console.error('❌ [ModuleRegistry] observe模块注册失败:', error);
        }
    }

    /**
     * 注册operation类型模块
     */
    async registerOperationModules() {
        console.log('⚡ [ModuleRegistry] 注册operation模块...');
        
        try {
            // Operation模块将在后续实现
            // 1. 输入操作模块
            // const inputModule = new OperationInput();
            // this.registerModule('operation', 'input', inputModule);
            
            // 2. 点击操作模块  
            // const clickModule = new OperationClick();
            // this.registerModule('operation', 'click', clickModule);
            
            // 3. 滚动操作模块
            // const scrollModule = new OperationScroll();
            // this.registerModule('operation', 'scroll', scrollModule);
            
            // 4. 提取操作模块
            // const extractModule = new OperationExtract();
            // this.registerModule('operation', 'extract', extractModule);
            
            // 5. 批量操作模块
            // const batchModule = new OperationBatch();
            // this.registerModule('operation', 'batch', batchModule);
            
        } catch (error) {
            console.error('❌ [ModuleRegistry] operation模块注册失败:', error);
        }
    }

    /**
     * 注册单个模块
     * @param {string} category - 模块类别 ('observe' | 'operation')
     * @param {string} name - 模块名称
     * @param {Object} moduleInstance - 模块实例
     */
    registerModule(category, name, moduleInstance) {
        if (!this.modules[category]) {
            throw new Error(`未知的模块类别: ${category}`);
        }
        
        // 验证模块接口
        if (!this.validateModuleInterface(category, moduleInstance)) {
            throw new Error(`模块 ${name} 不符合 ${category} 接口规范`);
        }
        
        this.modules[category].set(name, moduleInstance);
        console.log(`📦 已注册模块: ${category}/${name}`);
    }

    /**
     * 验证模块接口
     * @param {string} category - 模块类别
     * @param {Object} moduleInstance - 模块实例
     * @returns {boolean} 是否符合接口规范
     */
    validateModuleInterface(category, moduleInstance) {
        const requiredMethods = {
            observe: ['observe', 'getModuleInfo'],
            operation: ['execute', 'getModuleInfo']
        };
        
        const required = requiredMethods[category];
        if (!required) {
            return false;
        }
        
        return required.every(method => typeof moduleInstance[method] === 'function');
    }

    /**
     * 获取模块
     * @param {string} category - 模块类别
     * @param {string} name - 模块名称
     * @returns {Object|null} 模块实例
     */
    getModule(category, name) {
        const categoryModules = this.modules[category];
        if (!categoryModules) {
            return null;
        }
        
        return categoryModules.get(name) || null;
    }

    /**
     * 获取所有observe模块
     * @returns {Map} observe模块映射
     */
    getObserveModules() {
        return this.modules.observe;
    }

    /**
     * 获取所有operation模块
     * @returns {Map} operation模块映射
     */
    getOperationModules() {
        return this.modules.operation;
    }

    /**
     * 执行页面观察 - 调用所有已注册的observe模块
     * @param {Object} options - 观察选项
     * @param {Element} options.parentElement - 父元素限制
     * @param {Array} options.includeTypes - 包含的观察类型 (可选)
     * @param {Array} options.excludeTypes - 排除的观察类型 (可选)
     * @returns {Promise<Object>} 观察结果对象
     */
    async observePage(options = {}) {
        console.log('🔍 [ModuleRegistry] 开始页面观察...');
        
        const results = {
            dynamicList: [],
            textInput: [],
            textDisplay: [],
            comment: [],
            expandable: [],
            button: [],
            general: []
        };
        
        const observeModules = this.getObserveModules();
        const promises = [];
        
        for (const [moduleName, moduleInstance] of observeModules) {
            // 检查是否需要跳过此模块
            if (options.includeTypes && !options.includeTypes.includes(moduleName)) {
                continue;
            }
            if (options.excludeTypes && options.excludeTypes.includes(moduleName)) {
                continue;
            }
            
            console.log(`🔍 执行观察模块: ${moduleName}`);
            
            const promise = moduleInstance.observe(options)
                .then(moduleResults => {
                    results[moduleName] = moduleResults || [];
                    console.log(`✅ ${moduleName} 观察完成: ${moduleResults.length} 个结果`);
                })
                .catch(error => {
                    console.error(`❌ ${moduleName} 观察失败:`, error);
                    results[moduleName] = [];
                });
            
            promises.push(promise);
        }
        
        // 等待所有观察模块完成
        await Promise.all(promises);
        
        // 统计结果
        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`✅ [ModuleRegistry] 页面观察完成，总计发现 ${totalResults} 个元素`);
        
        return results;
    }

    /**
     * 执行操作 - 调用指定的operation模块
     * @param {string} operationType - 操作类型
     * @param {Object} operationParams - 操作参数
     * @returns {Promise<Object>} 操作结果
     */
    async executeOperation(operationType, operationParams) {
        console.log(`⚡ [ModuleRegistry] 执行操作: ${operationType}`);
        
        const operationModule = this.getModule('operation', operationType);
        if (!operationModule) {
            throw new Error(`未找到操作模块: ${operationType}`);
        }
        
        try {
            const result = await operationModule.execute(operationParams);
            console.log(`✅ 操作 ${operationType} 执行完成`);
            return result;
        } catch (error) {
            console.error(`❌ 操作 ${operationType} 执行失败:`, error);
            throw error;
        }
    }

    /**
     * 打印模块摘要
     */
    printModuleSummary() {
        console.log('\n📊 [ModuleRegistry] 模块注册摘要:');
        console.log('┌─────────────────────────────────────────┐');
        console.log('│              模块注册状态               │');
        console.log('├─────────────────────────────────────────┤');
        
        // Observe模块
        console.log('│ 📋 Observe 模块:');
        const observeModules = this.getObserveModules();
        if (observeModules.size === 0) {
            console.log('│   暂无已注册模块');
        } else {
            for (const [name, module] of observeModules) {
                const info = module.getModuleInfo();
                console.log(`│   ✅ ${name} - ${info.description}`);
            }
        }
        
        // Operation模块
        console.log('│ ⚡ Operation 模块:');
        const operationModules = this.getOperationModules();
        if (operationModules.size === 0) {
            console.log('│   暂无已注册模块');
        } else {
            for (const [name, module] of operationModules) {
                const info = module.getModuleInfo();
                console.log(`│   ✅ ${name} - ${info.description}`);
            }
        }
        
        console.log('└─────────────────────────────────────────┘\n');
    }

    /**
     * 获取模块统计信息
     * @returns {Object} 统计信息对象
     */
    getStats() {
        return {
            observe: {
                count: this.modules.observe.size,
                modules: Array.from(this.modules.observe.keys())
            },
            operation: {
                count: this.modules.operation.size,
                modules: Array.from(this.modules.operation.keys())
            },
            total: this.modules.observe.size + this.modules.operation.size
        };
    }
}

// 创建全局实例
const moduleRegistry = new ModuleRegistry();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleRegistry, moduleRegistry };
} else if (typeof window !== 'undefined') {
    window.ModuleRegistry = ModuleRegistry;
    window.moduleRegistry = moduleRegistry;
}