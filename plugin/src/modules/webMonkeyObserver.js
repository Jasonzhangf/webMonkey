/**
 * WebMonkey Browser Automation - Main Observer Interface
 * 
 * 主观察接口 - 整合所有observe和operation节点的统一入口
 * 
 * @author WebMonkey Team
 * @version 1.0.0
 */

class WebMonkeyObserver {
    constructor() {
        this.moduleRegistry = null;
        this.initialized = false;
        this.currentObserveResults = null;
        
        this.config = {
            autoInitialize: true,
            enableLogging: true,
            defaultObserveTypes: ['dynamicList'], // 默认启用的观察类型
        };
    }

    /**
     * 初始化WebMonkey观察器
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        console.log('🚀 [WebMonkeyObserver] 初始化WebMonkey观察器...');
        
        try {
            // 初始化模块注册表
            if (typeof moduleRegistry !== 'undefined') {
                this.moduleRegistry = moduleRegistry;
                await this.moduleRegistry.initialize();
            } else {
                throw new Error('ModuleRegistry未找到，请确保先加载moduleRegistry.js');
            }
            
            this.initialized = true;
            console.log('✅ [WebMonkeyObserver] 初始化完成');
            
        } catch (error) {
            console.error('❌ [WebMonkeyObserver] 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 执行页面观察 - 主要入口方法
     * @param {Object} options - 观察选项
     * @param {Element} options.parentElement - 父元素限制（可选）
     * @param {Array} options.types - 指定观察类型（可选）
     * @param {boolean} options.autoStart - 是否自动开始观察（默认true）
     * @returns {Promise<Object>} 观察结果
     */
    async observePage(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        console.log('🔍 [WebMonkeyObserver] 开始页面观察...');
        console.time('观察耗时');

        try {
            // 准备观察选项
            const observeOptions = {
                parentElement: options.parentElement || null,
                includeTypes: options.types || this.config.defaultObserveTypes,
                ...options
            };

            // 执行观察
            const results = await this.moduleRegistry.observePage(observeOptions);
            
            // 缓存结果
            this.currentObserveResults = results;
            
            // 打印结果摘要
            this.printObserveResults(results);
            
            console.timeEnd('观察耗时');
            console.log('✅ [WebMonkeyObserver] 页面观察完成');
            
            return results;
            
        } catch (error) {
            console.error('❌ [WebMonkeyObserver] 页面观察失败:', error);
            throw error;
        }
    }

    /**
     * 快速动态列表观察 - 便捷方法
     * @param {Element} parentElement - 父元素限制（可选）
     * @returns {Promise<Array>} 动态列表观察结果
     */
    async observeDynamicLists(parentElement = null) {
        const results = await this.observePage({
            parentElement,
            types: ['dynamicList']
        });
        
        return results.dynamicList || [];
    }

    /**
     * 执行操作
     * @param {string} operationType - 操作类型
     * @param {Object} operationParams - 操作参数
     * @returns {Promise<Object>} 操作结果
     */
    async executeOperation(operationType, operationParams) {
        if (!this.initialized) {
            await this.initialize();
        }

        return await this.moduleRegistry.executeOperation(operationType, operationParams);
    }

    /**
     * 获取当前观察结果
     * @returns {Object|null} 当前观察结果
     */
    getCurrentResults() {
        return this.currentObserveResults;
    }

    /**
     * 根据类型筛选观察结果
     * @param {string} type - 结果类型
     * @returns {Array} 筛选后的结果
     */
    getResultsByType(type) {
        if (!this.currentObserveResults) {
            return [];
        }
        
        return this.currentObserveResults[type] || [];
    }

    /**
     * 根据置信度筛选结果
     * @param {number} minConfidence - 最小置信度（0-1）
     * @returns {Object} 筛选后的结果对象
     */
    getHighConfidenceResults(minConfidence = 0.7) {
        if (!this.currentObserveResults) {
            return {};
        }

        const filtered = {};
        
        Object.keys(this.currentObserveResults).forEach(type => {
            filtered[type] = this.currentObserveResults[type].filter(result => 
                result.quality && result.quality.confidence >= minConfidence
            );
        });
        
        return filtered;
    }

    /**
     * 获取推荐操作
     * @param {Object} observeResult - 观察结果对象
     * @returns {Array} 推荐操作列表
     */
    getRecommendedOperations(observeResult) {
        if (!observeResult || !observeResult.recommendedOperations) {
            return [];
        }
        
        return observeResult.recommendedOperations;
    }

    /**
     * 批量执行推荐操作
     * @param {Object} observeResult - 观察结果对象
     * @param {string} operationType - 操作类型
     * @param {Object} operationParams - 操作参数
     * @returns {Promise<Object>} 操作结果
     */
    async executeRecommendedOperation(observeResult, operationType, operationParams = {}) {
        const recommendedOps = this.getRecommendedOperations(observeResult);
        
        if (!recommendedOps.includes(operationType)) {
            console.warn(`⚠️ 操作 ${operationType} 不在推荐列表中:`, recommendedOps);
        }
        
        // 合并观察结果数据到操作参数中
        const params = {
            ...operationParams,
            observeResult: observeResult,
            targetElements: observeResult.rawData?.elements || []
        };
        
        return await this.executeOperation(operationType, params);
    }

    /**
     * 清理观察状态
     */
    cleanup() {
        this.currentObserveResults = null;
        
        // 清理所有observe模块状态
        if (this.moduleRegistry) {
            const observeModules = this.moduleRegistry.getObserveModules();
            for (const [name, module] of observeModules) {
                if (typeof module.cleanup === 'function') {
                    module.cleanup();
                }
            }
        }
        
        console.log('🧹 [WebMonkeyObserver] 观察状态已清理');
    }

    /**
     * 打印观察结果摘要
     * @param {Object} results - 观察结果对象
     */
    printObserveResults(results) {
        if (!this.config.enableLogging) {
            return;
        }

        console.log('\n📊 [WebMonkeyObserver] 观察结果摘要:');
        console.log('┌─────────────────────────────────────────┐');
        console.log('│              观察结果统计               │');
        console.log('├─────────────────────────────────────────┤');
        
        let totalElements = 0;
        let highConfidenceCount = 0;
        
        Object.keys(results).forEach(type => {
            const items = results[type];
            if (items && items.length > 0) {
                const highConf = items.filter(item => 
                    item.quality && item.quality.confidence >= 0.7
                ).length;
                
                console.log(`│ 📋 ${type}: ${items.length} 个 (高置信度: ${highConf})`);
                totalElements += items.length;
                highConfidenceCount += highConf;
                
                // 显示前3个结果的详细信息
                items.slice(0, 3).forEach((item, index) => {
                    const confidence = item.quality?.confidence || 0;
                    const confStr = (confidence * 100).toFixed(1) + '%';
                    console.log(`│   ${index + 1}. ${item.selector?.className || 'Unknown'} (置信度: ${confStr})`);
                });
            }
        });
        
        console.log('├─────────────────────────────────────────┤');
        console.log(`│ 总计: ${totalElements} 个元素 | 高置信度: ${highConfidenceCount} 个`);
        console.log('└─────────────────────────────────────────┘\n');
    }

    /**
     * 创建观察器配置
     * @param {Object} config - 配置对象
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        console.log('⚙️ [WebMonkeyObserver] 配置已更新:', this.config);
    }

    /**
     * 获取观察器状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            initialized: this.initialized,
            hasResults: !!this.currentObserveResults,
            moduleStats: this.moduleRegistry ? this.moduleRegistry.getStats() : null,
            config: this.config
        };
    }

    /**
     * 导出观察结果为JSON
     * @returns {string} JSON字符串
     */
    exportResults() {
        if (!this.currentObserveResults) {
            return JSON.stringify({ error: '无观察结果' });
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            results: this.currentObserveResults,
            stats: this.getResultsStats()
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 获取结果统计
     * @returns {Object} 统计信息
     */
    getResultsStats() {
        if (!this.currentObserveResults) {
            return {};
        }
        
        const stats = {};
        let total = 0;
        
        Object.keys(this.currentObserveResults).forEach(type => {
            const items = this.currentObserveResults[type];
            stats[type] = {
                count: items.length,
                highConfidence: items.filter(item => 
                    item.quality && item.quality.confidence >= 0.7
                ).length,
                avgConfidence: items.length > 0 ? 
                    items.reduce((sum, item) => sum + (item.quality?.confidence || 0), 0) / items.length : 0
            };
            total += items.length;
        });
        
        stats.total = total;
        return stats;
    }
}

// 创建全局实例
const webMonkeyObserver = new WebMonkeyObserver();

// 自动初始化（如果配置允许）
if (typeof window !== 'undefined' && webMonkeyObserver.config.autoInitialize) {
    // 等待DOM加载完成后自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            webMonkeyObserver.initialize().catch(console.error);
        });
    } else {
        // DOM已经加载完成
        setTimeout(() => {
            webMonkeyObserver.initialize().catch(console.error);
        }, 100);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebMonkeyObserver, webMonkeyObserver };
} else if (typeof window !== 'undefined') {
    window.WebMonkeyObserver = WebMonkeyObserver;
    window.webMonkeyObserver = webMonkeyObserver;
    
    // 添加便捷的全局方法
    window.observePage = (options) => webMonkeyObserver.observePage(options);
    window.observeDynamicLists = (parentElement) => webMonkeyObserver.observeDynamicLists(parentElement);
    window.getObserveResults = () => webMonkeyObserver.getCurrentResults();
    window.exportObserveResults = () => webMonkeyObserver.exportResults();
}