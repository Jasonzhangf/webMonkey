/**
 * WebMonkey 模块化观察系统 - 使用示例
 * 
 * 这个文件展示了如何使用 WebMonkey 的模块化观察和操作系统
 */

// ============ 基础使用示例 ============

async function basicUsageExample() {
    console.log('🚀 基础使用示例开始...');
    
    try {
        // 1. 执行页面观察（会自动初始化）
        const results = await observePage();
        
        // 2. 检查结果
        console.log('📊 观察结果:', results);
        
        // 3. 获取动态列表
        const dynamicLists = results.dynamicList || [];
        
        if (dynamicLists.length > 0) {
            console.log(`✅ 发现 ${dynamicLists.length} 个动态列表`);
            
            // 显示第一个列表的详细信息
            const firstList = dynamicLists[0];
            console.log('📋 第一个动态列表详情:', {
                className: firstList.selector.className,
                confidence: firstList.quality.confidence,
                itemCount: firstList.listInfo.itemCount,
                containerType: firstList.listInfo.containerType,
                recommendedOps: firstList.recommendedOperations
            });
            
        } else {
            console.log('⚠️ 未发现动态列表');
        }
        
    } catch (error) {
        console.error('❌ 基础使用示例失败:', error);
    }
}

// ============ 高级配置示例 ============

async function advancedConfigExample() {
    console.log('🔬 高级配置示例开始...');
    
    try {
        // 1. 等待观察器初始化
        await webMonkeyObserver.initialize();
        
        // 2. 使用自定义配置
        const results = await webMonkeyObserver.observePage({
            types: ['dynamicList'], // 只观察动态列表
            config: {
                scrollCount: 5,           // 增加滚动次数
                minElementCount: 3,       // 最小元素数量
                scrollDistanceRatio: 1.5  // 滚动距离比例
            }
        });
        
        // 3. 获取高置信度结果
        const highConfidenceResults = webMonkeyObserver.getHighConfidenceResults(0.8);
        console.log('🎯 高置信度结果:', highConfidenceResults);
        
        // 4. 导出结果
        const exportData = webMonkeyObserver.exportResults();
        console.log('📤 导出数据长度:', exportData.length, '字符');
        
    } catch (error) {
        console.error('❌ 高级配置示例失败:', error);
    }
}

// ============ 限制范围观察示例 ============

async function scopedObservationExample() {
    console.log('🎯 限制范围观察示例开始...');
    
    try {
        // 1. 找到主内容区域
        const mainContent = document.querySelector('.main-content, #main, .content, [role="main"]');
        
        if (mainContent) {
            console.log('✅ 找到主内容区域:', mainContent.tagName, mainContent.className);
            
            // 2. 只观察主内容区域内的元素
            const results = await webMonkeyObserver.observePage({
                parentElement: mainContent,
                types: ['dynamicList']
            });
            
            console.log('📊 限制范围观察结果:', results);
            
        } else {
            console.log('⚠️ 未找到主内容区域，使用全页面观察');
            await basicUsageExample();
        }
        
    } catch (error) {
        console.error('❌ 限制范围观察示例失败:', error);
    }
}

// ============ 批量操作示例 ============

async function batchOperationExample() {
    console.log('⚡ 批量操作示例开始...');
    
    try {
        // 1. 先获取动态列表
        const dynamicLists = await observeDynamicLists();
        
        if (dynamicLists.length > 0) {
            const firstList = dynamicLists[0];
            console.log('📋 准备对动态列表执行批量操作:', firstList.selector.className);
            
            // 2. 检查推荐操作
            const recommendedOps = webMonkeyObserver.getRecommendedOperations(firstList);
            console.log('🎯 推荐操作:', recommendedOps);
            
            // 3. 模拟执行推荐操作（实际的operation模块还未实现）
            if (recommendedOps.includes('extractText')) {
                console.log('📝 模拟执行文本提取操作...');
                
                // 实际使用时的代码示例：
                // const textResults = await webMonkeyObserver.executeRecommendedOperation(
                //     firstList, 
                //     'extractText',
                //     { maxItems: 10 }
                // );
                
                console.log('✅ 文本提取操作模拟完成');
            }
            
            if (recommendedOps.includes('batchClick')) {
                console.log('🖱️ 模拟执行批量点击操作...');
                console.log('✅ 批量点击操作模拟完成');
            }
            
        } else {
            console.log('⚠️ 未发现动态列表，跳过批量操作示例');
        }
        
    } catch (error) {
        console.error('❌ 批量操作示例失败:', error);
    }
}

// ============ 调试和监控示例 ============

async function debuggingExample() {
    console.log('🔍 调试和监控示例开始...');
    
    try {
        // 1. 启用详细日志
        webMonkeyObserver.configure({ 
            enableLogging: true 
        });
        
        // 2. 查看系统状态
        const status = webMonkeyObserver.getStatus();
        console.log('📊 系统状态:', status);
        
        // 3. 查看模块统计
        if (typeof moduleRegistry !== 'undefined') {
            const stats = moduleRegistry.getStats();
            console.log('📈 模块统计:', stats);
        }
        
        // 4. 执行观察并监控性能
        console.time('观察性能');
        const results = await webMonkeyObserver.observePage();
        console.timeEnd('观察性能');
        
        // 5. 获取结果统计
        const resultStats = webMonkeyObserver.getResultsStats();
        console.log('📋 结果统计:', resultStats);
        
        // 6. 清理状态
        webMonkeyObserver.cleanup();
        console.log('🧹 状态清理完成');
        
    } catch (error) {
        console.error('❌ 调试示例失败:', error);
    }
}

// ============ 实际应用场景示例 ============

async function practicalScenarioExample() {
    console.log('💼 实际应用场景示例开始...');
    
    try {
        // 场景：自动分析微博feed流
        if (window.location.hostname.includes('weibo.com')) {
            console.log('🐦 检测到微博页面，执行微博专用分析...');
            
            const results = await webMonkeyObserver.observePage({
                types: ['dynamicList'],
                config: {
                    scrollCount: 3,
                    waitTime: 3000  // 微博加载较慢，增加等待时间
                }
            });
            
            const weiboFeeds = results.dynamicList?.filter(list => 
                list.selector.className.includes('vue-recycle-scroller') ||
                list.selector.className.includes('Feed')
            ) || [];
            
            if (weiboFeeds.length > 0) {
                console.log(`✅ 检测到 ${weiboFeeds.length} 个微博feed流`);
                
                weiboFeeds.forEach((feed, index) => {
                    console.log(`📋 Feed ${index + 1}:`, {
                        className: feed.selector.className,
                        confidence: (feed.quality.confidence * 100).toFixed(1) + '%',
                        itemCount: feed.listInfo.itemCount,
                        isVirtualScroll: feed.listInfo.isVirtualScroll
                    });
                });
                
                return weiboFeeds;
            }
        }
        
        // 场景：通用电商列表检测
        else if (window.location.hostname.includes('taobao.com') || 
                 window.location.hostname.includes('tmall.com') ||
                 window.location.hostname.includes('jd.com')) {
            console.log('🛒 检测到电商页面，执行商品列表分析...');
            
            const results = await webMonkeyObserver.observePage({
                types: ['dynamicList']
            });
            
            const productLists = results.dynamicList?.filter(list => 
                list.quality.confidence > 0.7 && 
                list.listInfo.itemCount >= 5
            ) || [];
            
            console.log(`🛍️ 检测到 ${productLists.length} 个可能的商品列表`);
            return productLists;
        }
        
        // 默认场景：通用列表检测
        else {
            console.log('🌐 执行通用页面列表检测...');
            const results = await webMonkeyObserver.observePage();
            return results.dynamicList || [];
        }
        
    } catch (error) {
        console.error('❌ 实际应用场景示例失败:', error);
        return [];
    }
}

// ============ 性能测试示例 ============

async function performanceTestExample() {
    console.log('⚡ 性能测试示例开始...');
    
    const testResults = {
        observationTime: 0,
        memoryBefore: 0,
        memoryAfter: 0,
        elementCount: 0,
        accuracy: 0
    };
    
    try {
        // 1. 记录内存使用（如果支持）
        if (performance.memory) {
            testResults.memoryBefore = performance.memory.usedJSHeapSize;
        }
        
        // 2. 执行性能测试
        const startTime = performance.now();
        
        const results = await webMonkeyObserver.observePage({
            types: ['dynamicList']
        });
        
        const endTime = performance.now();
        testResults.observationTime = endTime - startTime;
        
        // 3. 记录结果
        testResults.elementCount = results.dynamicList?.length || 0;
        
        if (performance.memory) {
            testResults.memoryAfter = performance.memory.usedJSHeapSize;
        }
        
        // 4. 计算准确性（基于置信度）
        if (results.dynamicList && results.dynamicList.length > 0) {
            const avgConfidence = results.dynamicList.reduce((sum, item) => 
                sum + (item.quality?.confidence || 0), 0
            ) / results.dynamicList.length;
            testResults.accuracy = avgConfidence;
        }
        
        // 5. 输出测试结果
        console.log('📊 性能测试结果:', {
            观察耗时: testResults.observationTime.toFixed(2) + 'ms',
            检测元素数: testResults.elementCount,
            平均置信度: (testResults.accuracy * 100).toFixed(1) + '%',
            内存增长: testResults.memoryAfter - testResults.memoryBefore > 0 ? 
                     ((testResults.memoryAfter - testResults.memoryBefore) / 1024 / 1024).toFixed(2) + 'MB' : 
                     '不支持内存监控'
        });
        
        return testResults;
        
    } catch (error) {
        console.error('❌ 性能测试失败:', error);
        return testResults;
    }
}

// ============ 主要示例运行函数 ============

async function runAllExamples() {
    console.log('🎬 开始运行所有WebMonkey使用示例...\n');
    
    const examples = [
        { name: '基础使用', fn: basicUsageExample },
        { name: '高级配置', fn: advancedConfigExample },
        { name: '限制范围观察', fn: scopedObservationExample },
        { name: '批量操作', fn: batchOperationExample },
        { name: '调试监控', fn: debuggingExample },
        { name: '实际应用场景', fn: practicalScenarioExample },
        { name: '性能测试', fn: performanceTestExample }
    ];
    
    for (const example of examples) {
        console.log(`\n🔹 开始执行示例: ${example.name}`);
        console.log('='.repeat(50));
        
        try {
            await example.fn();
            console.log(`✅ 示例 "${example.name}" 执行完成`);
        } catch (error) {
            console.error(`❌ 示例 "${example.name}" 执行失败:`, error);
        }
        
        // 每个示例之间稍作停顿
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 所有示例执行完成！');
}

// 便捷的单独运行函数
window.runBasicExample = basicUsageExample;
window.runAdvancedExample = advancedConfigExample;
window.runScopedExample = scopedObservationExample;
window.runBatchExample = batchOperationExample;
window.runDebuggingExample = debuggingExample;
window.runPracticalExample = practicalScenarioExample;
window.runPerformanceTest = performanceTestExample;
window.runAllExamples = runAllExamples;

// 控制台提示
console.log(`
🎯 WebMonkey 使用示例已加载！

可用的示例函数：
- runBasicExample()         // 基础使用示例
- runAdvancedExample()      // 高级配置示例  
- runScopedExample()        // 限制范围观察示例
- runBatchExample()         // 批量操作示例
- runDebuggingExample()     // 调试监控示例
- runPracticalExample()     // 实际应用场景示例
- runPerformanceTest()      // 性能测试示例
- runAllExamples()          // 运行所有示例

快速开始：在控制台输入 runBasicExample() 即可开始！
`);