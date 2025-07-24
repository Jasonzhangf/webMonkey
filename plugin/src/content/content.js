/**
 * 包含观察功能的简化内容脚本
 */

console.log('🔧 WebMonkey Content Script Loading...');

class SimpleContentScript {
    constructor() {
        console.log('🚀 SimpleContentScript initializing...');
        this.observeMode = false;
        this.observedElements = [];
        this.setupMessageListener();
        this.injectObserveButton();
        console.log('✅ SimpleContentScript initialized successfully');
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggleUIPanel') {
                console.log('Toggle UI Panel');
                // 简单的响应
                sendResponse({status: 'done'});
            }
            return true;
        });
    }

    injectObserveButton() {
        console.log('📝 Creating observe button...');
        
        // 创建观察按钮
        const observeBtn = document.createElement('button');
        observeBtn.textContent = '观察页面';
        observeBtn.id = 'webmonkey-observe-btn';
        observeBtn.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 450px !important;
            z-index: 99999999 !important;
            background: #6f42c1 !important;
            color: white !important;
            border: none !important;
            padding: 12px 18px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            font-weight: bold !important;
            font-family: Arial, sans-serif !important;
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.4) !important;
            transition: all 0.3s ease !important;
        `;

        observeBtn.addEventListener('click', () => {
            console.log('🖱️ Observe button clicked!');
            this.toggleObserveMode();
        });

        document.body.appendChild(observeBtn);
        this.observeBtn = observeBtn;
        
        console.log('✅ Observe button created and added to page');
    }

    toggleObserveMode() {
        this.observeMode = !this.observeMode;
        
        if (this.observeMode) {
            this.observeBtn.textContent = '停止观察';
            this.observeBtn.style.background = '#dc3545';
            this.startObservation();
        } else {
            this.observeBtn.textContent = '观察页面';
            this.observeBtn.style.background = '#6f42c1';
            this.stopObservation();
        }
    }

    // 新增：模块化观察方法
    async startModularObservation() {
        console.log('🚀 尝试启动模块化观察...');
        
        try {
            // 动态加载并初始化模块
            await this.loadObserveModules();
            
            // 使用模块化观察器
            if (typeof webMonkeyObserver !== 'undefined') {
                console.log('✅ 使用WebMonkey模块化观察器');
                
                const results = await webMonkeyObserver.observePage({
                    types: ['dynamicList']
                });
                
                console.log('🎯 模块化观察结果:', results);
                this.displayModularResults(results);
                
            } else {
                throw new Error('WebMonkey模块未加载');
            }
            
        } catch (error) {
            console.warn('⚠️ 模块化观察失败，回退到传统方法:', error);
            this.performIntelligentObservation();
        }
    }

    // 动态加载观察模块
    async loadObserveModules() {
        const moduleFiles = [
            'modules/observe/observeDynamicList.js',
            'modules/moduleRegistry.js', 
            'modules/webMonkeyObserver.js'
        ];
        
        for (const file of moduleFiles) {
            if (!document.querySelector(`script[src*="${file}"]`)) {
                await this.loadScript(chrome.runtime.getURL(file));
                console.log(`✅ 已加载: ${file}`);
            }
        }
        
        // 等待一下让模块完全初始化
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 加载脚本的工具方法
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 显示模块化观察结果
    displayModularResults(results) {
        const dynamicLists = results.dynamicList || [];
        
        if (dynamicLists.length > 0) {
            let message = `🎯 模块化检测发现 ${dynamicLists.length} 个动态列表:\n\n`;
            
            dynamicLists.forEach((list, index) => {
                const confidence = (list.quality.confidence * 100).toFixed(1);
                const itemCount = list.listInfo.itemCount;
                const containerType = list.listInfo.containerType;
                
                message += `${index + 1}. 类名: ${list.selector.className}\n`;
                message += `   📊 置信度: ${confidence}% | 元素数: ${itemCount}\n`;
                message += `   🏷️ 类型: ${containerType} | 评分: ${list.quality.dynamicScore}\n`;
                message += `   🎯 推荐操作: ${list.recommendedOperations.join(', ')}\n`;
                if (list.listInfo.isVirtualScroll) {
                    message += `   ⚡ 虚拟滚动支持\n`;
                }
                message += `\n`;
            });
            
            this.showNotification(message, 'success');
            
            // 高亮显示结果
            this.highlightModularResults(dynamicLists);
            
        } else {
            this.showNotification('模块化检测未发现动态列表元素 🤔', 'warning');
        }
    }

    // 高亮模块化结果
    highlightModularResults(dynamicLists) {
        // 清理现有高亮
        this.clearObservedElements();
        
        const colorSchemes = [
            { border: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)', name: '绿色', emoji: '🟢' },
            { border: '#2196F3', bg: 'rgba(33, 150, 243, 0.15)', name: '蓝色', emoji: '🔵' },
            { border: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)', name: '橙色', emoji: '🟠' }
        ];
        
        dynamicLists.forEach((list, listIndex) => {
            const colorScheme = colorSchemes[listIndex % colorSchemes.length];
            const elements = list.rawData.elements || [];
            
            elements.slice(0, 3).forEach((element, elemIndex) => {
                // 高亮元素
                element.style.outline = `3px solid ${colorScheme.border}`;
                element.style.backgroundColor = colorScheme.bg;
                element.style.position = 'relative';
                element.style.boxShadow = `0 4px 12px ${colorScheme.border}60`;
                
                // 添加信息标签
                const label = document.createElement('div');
                const confidence = (list.quality.confidence * 100).toFixed(1);
                
                label.innerHTML = `
                    <div style="font-weight: bold; font-size: 12px;">${colorScheme.emoji} 模块化检测 ${listIndex + 1}</div>
                    <div style="font-size: 10px; margin: 2px 0;">${list.selector.className.substring(0, 25)}...</div>
                    <div style="font-size: 9px;">置信度: ${confidence}% | 类型: ${list.listInfo.containerType}</div>
                    <div style="font-size: 9px;">元素 ${elemIndex + 1}/${Math.min(elements.length, 3)} | 评分: ${list.quality.dynamicScore}</div>
                    ${list.listInfo.isVirtualScroll ? '<div style="font-size: 8px; color: #ffeb3b;">⚡ 虚拟滚动</div>' : ''}
                `;
                
                label.style.cssText = `
                    position: absolute !important;
                    top: -85px !important;
                    left: 0 !important;
                    background: linear-gradient(135deg, ${colorScheme.border}, ${colorScheme.border}dd) !important;
                    color: white !important;
                    padding: 8px 10px !important;
                    border-radius: 8px !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    font-size: 10px !important;
                    font-weight: bold !important;
                    z-index: 9999 !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                    min-width: 140px !important;
                    text-align: left !important;
                    border: 2px solid ${colorScheme.border} !important;
                    line-height: 1.2 !important;
                `;
                
                element.appendChild(label);
                this.observedElements.push({element, label});
            });
        });
        
        console.log(`✅ 已高亮 ${this.observedElements.length} 个模块化检测元素`);
    }

    startObservation() {
        console.log('开始页面观察...');
        
        // 优先尝试模块化观察，失败则回退到传统方法
        this.startModularObservation();
    }

    stopObservation() {
        console.log('停止页面观察...');
        this.clearObservedElements();
    }

    async performIntelligentObservation() {
        console.log('🔍 开始智能观察 - 基于XPath的正确检测逻辑...');
        
        // 1. 捕获第一屏所有元素的XPath
        const firstScreenElements = this.captureFirstScreenElements();
        console.log('📊 第一屏捕获:', firstScreenElements.length, '个元素');
        
        // 2. 执行三次滚动检测 - 正确的留存过滤逻辑
        let retainedClassGroups = {}; // 每次滚动后留存的类名组
        this.scrollHistory = []; // 存储每次滚动的详细数据
        
        for (let scrollIndex = 0; scrollIndex < 3; scrollIndex++) {
            console.log(`📱 执行第 ${scrollIndex + 1} 次滚动...`);
            
            // 滚动更多距离，确保上次的元素完全离开视口
            let scrollDistance = window.innerHeight * 1.2; // 120%屏幕高度，确保充分滚动
            
            // 如果是后续滚动，检查是否需要额外滚动来清除视口
            if (scrollIndex > 0) {
                // 增加额外滚动距离，确保彻底清除上次的元素
                scrollDistance = window.innerHeight * 1.5; // 150%屏幕高度
                console.log(`📜 第${scrollIndex + 1}次滚动使用加强滚动距离: ${scrollDistance}px (${(scrollDistance/window.innerHeight).toFixed(1)}倍屏幕高度)`);
            }
            
            window.scrollBy(0, scrollDistance);
            
            // 等待内容加载和页面稳定
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 找出当前视口内完整显示的所有元素（不在第一屏记录中的）
            const currentViewportElements = this.findCompletelyVisibleNewElements(firstScreenElements);
            console.log(`👁️ 第${scrollIndex + 1}次滚动发现完整可见的新元素: ${currentViewportElements.length} 个`);
            
            // 按类名分组当前视口内的元素
            const currentClassGroups = this.groupElementsByClass(currentViewportElements);
            
            // 记录当前滚动数据
            this.scrollHistory.push({
                scrollIndex: scrollIndex + 1,
                elements: currentViewportElements,
                classGroups: currentClassGroups,
                scrollY: window.scrollY
            });
            
            if (scrollIndex === 0) {
                // 第一次滚动：记录所有类名组作为初始留存
                retainedClassGroups = { ...currentClassGroups };
                console.log(`🆕 第1次滚动留存类名: ${Object.keys(retainedClassGroups).length} 个类`);
                Object.keys(retainedClassGroups).forEach(className => {
                    console.log(`   类名 ${className}: ${retainedClassGroups[className].elements.length} 个去重元素 (${retainedClassGroups[className].xpaths.size} 个xpath)`);
                });
            } else {
                // 第2/3次滚动：进行留存过滤
                const newRetainedClassGroups = {};
                
                Object.keys(retainedClassGroups).forEach(className => {
                    const previousElementXPaths = retainedClassGroups[className].xpaths;
                    const currentClassGroup = currentClassGroups[className];
                    
                    if (currentClassGroup) {
                        // 检查上次留存的xpath元素是否还在当前视口中
                        const stillVisiblePreviousElements = this.countStillVisibleElements(previousElementXPaths);
                        
                        // 详细调试信息
                        console.log(`🔍 检查类名 ${className}:`, {
                            上次元素数: previousElementXPaths.size,
                            当前元素数: currentClassGroup.elements.length,
                            仍可见数: stillVisiblePreviousElements,
                            当前滚动位置: window.scrollY,
                            视口高度: window.innerHeight
                        });
                        
                        if (stillVisiblePreviousElements === 0) {
                            // 上次的元素都不在了，这个类名可以留存（符合动态列表特征）
                            newRetainedClassGroups[className] = currentClassGroup;
                            console.log(`✅ 类名 ${className} 留存: 上次${previousElementXPaths.size}个元素已完全消失, 新增${currentClassGroup.elements.length}个`);
                        } else {
                            // 上次的元素还有在视口中的，过滤掉这个类名（静态元素特征）
                            console.log(`❌ 类名 ${className} 过滤: 上次${previousElementXPaths.size}个元素中还有${stillVisiblePreviousElements}个仍可见 - 静态元素特征`);
                        }
                    } else {
                        // 当前视口中没有这个类名，过滤掉
                        console.log(`❌ 类名 ${className} 过滤: 当前视口中不存在`);
                    }
                });
                
                retainedClassGroups = newRetainedClassGroups;
                console.log(`📊 第${scrollIndex + 1}次滚动后留存类名: ${Object.keys(retainedClassGroups).length} 个类`);
            }
        }
        
        // 最终留存的类名就是真正的动态列表元素类名
        const finalRetainedElements = [];
        Object.values(retainedClassGroups).forEach(classGroup => {
            finalRetainedElements.push(...classGroup.elements);
        });
        
        console.log(`🎯 最终分析结果:`, {
            三次滚动后留存的类名数: Object.keys(retainedClassGroups).length,
            留存的动态元素总数: finalRetainedElements.length,
            留存类名详情: Object.keys(retainedClassGroups).map(className => ({
                className,
                elementCount: retainedClassGroups[className].elements.length
            })),
            三次滚动历史: this.scrollHistory.map(h => ({
                scrollIndex: h.scrollIndex,
                elementCount: h.elements.length,
                classCount: Object.keys(h.classGroups).length,
                scrollY: h.scrollY
            }))
        });
        
        // 3. 直接分析真正的动态列表元素（基于留存过滤的结果）
        const dynamicListElements = this.analyzeFinalRetainedElements(retainedClassGroups);
        
        if (dynamicListElements.length > 0) {
            this.highlightDynamicListElements(dynamicListElements);
            this.showDynamicListResults(dynamicListElements, {
                留存类名数: Object.keys(retainedClassGroups).length,
                留存元素总数: finalRetainedElements.length,
                动态列表元素: dynamicListElements.length,
                滚动次数: this.scrollHistory.length
            });
        } else {
            if (finalRetainedElements.length === 0) {
                this.showNotification('未发现留存的动态元素 🤔\n所有元素都在滚动过程中被过滤', 'warning');
            } else {
                this.showNotification('未发现符合动态列表模式的元素 🤔\n留存元素不具备列表特征', 'warning');
            }
        }
        
        console.log('✅ 动态列表元素检测完成');
        return dynamicListElements;
    }

    // 分析类名分布
    analyzeClassDistribution(elements) {
        const classDistribution = {};
        
        elements.forEach(elementInfo => {
            const className = this.getElementClassName(elementInfo.element);
            if (className && className.trim()) {
                const classes = className.trim().split(/\s+/);
                const primaryClass = this.selectPrimaryClassName(classes);
                
                if (!classDistribution[primaryClass]) {
                    classDistribution[primaryClass] = {
                        count: 0,
                        xpaths: new Set()
                    };
                }
                
                classDistribution[primaryClass].count++;
                classDistribution[primaryClass].xpaths.add(elementInfo.xpath);
            }
        });
        
        return classDistribution;
    }

    // 扫描页面所有有类名的元素
    scanPage() {
        const elementsWithClass = new Set();
        const allElements = document.querySelectorAll('*[class]');
        
        allElements.forEach(element => {
            const className = element.className;
            if (className && typeof className === 'string' && className.trim()) {
                elementsWithClass.add(element);
            } else if (className && className.baseVal) {
                // 处理SVG元素的className (SVGAnimatedString)
                if (className.baseVal.trim()) {
                    elementsWithClass.add(element);
                }
            }
        });
        
        return elementsWithClass;
    }
    
    // 统计各个类选择器的元素数量
    countElementsByClass(elements) {
        const classCounts = new Map();
        
        elements.forEach(element => {
            let classString = '';
            
            // 安全获取className字符串
            if (typeof element.className === 'string') {
                classString = element.className;
            } else if (element.className && element.className.baseVal) {
                // SVG元素处理
                classString = element.className.baseVal;
            } else {
                return; // 跳过无效的className
            }
            
            const classes = classString.trim().split(/\s+/);
            classes.forEach(className => {
                if (className && !className.startsWith('wao-') && !className.startsWith('webmonkey-')) {
                    const selector = `.${className}`;
                    try {
                        const count = document.querySelectorAll(selector).length;
                        if (count >= 3) { // 只关注出现3次以上的类
                            classCounts.set(selector, count);
                        }
                    } catch (error) {
                        // 忽略无效的选择器
                        console.warn('无效选择器:', selector, error);
                    }
                }
            });
        });
        
        return classCounts;
    }
    
    // 触发滚动加载 - 滚动三屏测试持续增长
    async triggerScrollLoad() {
        console.log('📜 开始三屏滚动测试...');
        
        const viewportHeight = window.innerHeight;
        const initialScrollY = window.scrollY;
        
        // 滚动第一屏
        console.log('📜 滚动第一屏...');
        window.scrollBy({
            top: viewportHeight,
            behavior: 'smooth'
        });
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 滚动第二屏
        console.log('📜 滚动第二屏...');
        window.scrollBy({
            top: viewportHeight,
            behavior: 'smooth'
        });
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 滚动第三屏
        console.log('📜 滚动第三屏...');
        window.scrollBy({
            top: viewportHeight,
            behavior: 'smooth'
        });
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        console.log('📜 三屏滚动测试完成');
    }
    
    // 记录多次增长情况
    async triggerMultipleScrollTests() {
        console.log('🔄 开始多轮滚动增长测试...');
        
        const growthHistory = [];
        const viewportHeight = window.innerHeight;
        
        // 记录初始状态
        let currentCount = this.countElementsByClass(this.scanPage());
        growthHistory.push({
            phase: 'initial',
            counts: new Map(currentCount),
            timestamp: Date.now()
        });
        
        // 进行三次滚动测试，每次滚动一屏
        for (let i = 1; i <= 3; i++) {
            console.log(`📜 执行第${i}次滚动...`);
            
            window.scrollBy({
                top: viewportHeight,
                behavior: 'smooth'
            });
            
            // 等待内容加载
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 记录当前状态
            currentCount = this.countElementsByClass(this.scanPage());
            growthHistory.push({
                phase: `scroll_${i}`,
                counts: new Map(currentCount),
                timestamp: Date.now()
            });
            
            console.log(`📊 第${i}次滚动后元素统计:`, currentCount.size);
        }
        
        console.log('🔄 多轮滚动测试完成');
        return growthHistory;
    }
    
    // 分析持续增长的类选择器（基于多轮滚动历史）
    analyzeContinuousGrowth(growthHistory) {
        const dynamicClasses = [];
        
        if (growthHistory.length < 2) return dynamicClasses;
        
        // 获取所有出现过的选择器
        const allSelectors = new Set();
        growthHistory.forEach(phase => {
            phase.counts.forEach((count, selector) => {
                allSelectors.add(selector);
            });
        });
        
        // 分析每个选择器的增长模式
        allSelectors.forEach(selector => {
            const growthPattern = [];
            let totalGrowth = 0;
            let continuousGrowthCount = 0;
            
            for (let i = 1; i < growthHistory.length; i++) {
                const prevCount = growthHistory[i-1].counts.get(selector) || 0;
                const currentCount = growthHistory[i].counts.get(selector) || 0;
                const growth = currentCount - prevCount;
                
                growthPattern.push({
                    phase: growthHistory[i].phase,
                    growth,
                    totalCount: currentCount
                });
                
                if (growth > 0) {
                    totalGrowth += growth;
                    continuousGrowthCount++;
                }
            }
            
            // 进一步放宽增长条件：总增长>=2个元素，或者单次增长>=5个
            const isValidGrowthPattern = totalGrowth >= 2 || (continuousGrowthCount >= 1 && totalGrowth >= 1);
            
            if (isValidGrowthPattern) {
                const initialCount = growthHistory[0].counts.get(selector) || 0;
                const finalCount = growthHistory[growthHistory.length - 1].counts.get(selector) || 0;
                
                dynamicClasses.push({
                    selector,
                    initialCount,
                    finalCount,
                    totalGrowth,
                    continuousGrowthCount,
                    growthPattern,
                    avgGrowthPerPhase: totalGrowth / (growthHistory.length - 1),
                    growthRate: totalGrowth / Math.max(initialCount, 1)
                });
            }
        });
        
        // 按总增长量排序
        return dynamicClasses.sort((a, b) => b.totalGrowth - a.totalGrowth);
    }
    
    // 验证动态元素是否包含丰富内容并位于页面中心
    validateDynamicElements(dynamicClasses) {
        const validatedClasses = [];
        
        dynamicClasses.forEach(classInfo => {
            const elements = document.querySelectorAll(classInfo.selector);
            if (elements.length === 0) return;
            
            // 检查是否在可滚动容器内
            const scrollableInfo = this.checkScrollableContainer(elements);
            
            let validCount = 0;
            let centerCount = 0;
            const contentStats = {
                hasText: 0,
                hasLinks: 0, 
                hasImages: 0,
                hasVideos: 0
            };
            
            elements.forEach(element => {
                const stats = this.analyzeElementContent(element);
                const isInCenter = this.isElementInCenterArea(element);
                
                // 放宽内容验证：有文本即可，链接不强制要求，但如果有链接会加分
                const hasBasicContent = stats.hasText && !stats.isLikelyNavigation;
                const hasRichContent = hasBasicContent && (stats.hasMeaningfulLinks || stats.hasImages || stats.hasVideos);
                
                // 优先考虑丰富内容，但也接受基础内容
                if (hasRichContent || hasBasicContent) {
                    validCount++;
                    if (stats.hasText) contentStats.hasText++;
                    if (stats.hasLinks) contentStats.hasLinks++;
                    if (stats.hasImages) contentStats.hasImages++;
                    if (stats.hasVideos) contentStats.hasVideos++;
                }
                
                // 单独统计中心区域的有效元素（基础内容即可）
                if (isInCenter && (hasRichContent || hasBasicContent)) {
                    centerCount++;
                }
            });
            
            // 更新验证条件：加入滚动容器检测，放宽其他要求
            const hasEnoughContent = validCount >= Math.max(2, elements.length * 0.2); // 降低到20%
            const hasCenterElements = centerCount >= 1;
            const hasScrollableContainer = scrollableInfo.hasScrollableContainer;
            
            // 详细调试信息
            console.log(`🔍 验证类选择器 ${classInfo.selector}:`, {
                totalElements: elements.length,
                validCount,
                centerCount,
                totalGrowth: classInfo.totalGrowth,
                // 验证条件详情
                conditions: {
                    hasEnoughContent: {
                        result: hasEnoughContent,
                        required: Math.max(2, elements.length * 0.2),
                        actual: validCount
                    },
                    hasCenterElements: {
                        result: hasCenterElements,
                        required: 1,
                        actual: centerCount
                    },
                    hasScrollableContainer: {
                        result: hasScrollableContainer,
                        scrollableRatio: scrollableInfo.scrollableRatio,
                        uniqueContainers: scrollableInfo.uniqueContainers
                    }
                },
                scrollableInfo: scrollableInfo,
                contentStats: {
                    hasText: contentStats.hasText,
                    hasLinks: contentStats.hasLinks,
                    avgLinksPerElement: contentStats.hasLinks > 0 ? (contentStats.hasLinks / validCount).toFixed(1) : 0
                },
                sampleElement: elements.length > 0 ? {
                    text: elements[0].textContent?.trim().substring(0, 50) + '...',
                    linkCount: this.analyzeElementContent(elements[0]).linkCount,
                    meaningfulLinkCount: this.analyzeElementContent(elements[0]).meaningfulLinkCount,
                    hasBasicContent: this.analyzeElementContent(elements[0]).hasText && !this.analyzeElementContent(elements[0]).isLikelyNavigation,
                    isLikelyNavigation: this.analyzeElementContent(elements[0]).isLikelyNavigation
                } : null
            });
            
            // 特殊调试：针对Feed类元素
            if (classInfo.selector.includes('Feed') || classInfo.selector.includes('feed')) {
                console.log(`🐛 Feed类元素特殊调试 ${classInfo.selector}:`, {
                    elements: Array.from(elements).slice(0, 3).map(el => ({
                        text: el.textContent?.trim().substring(0, 30),
                        className: el.className,
                        rect: el.getBoundingClientRect(),
                        stats: this.analyzeElementContent(el),
                        centerCheck: this.isElementInCenterArea(el)
                    })),
                    'failedConditions': {
                        hasEnoughContent: !hasEnoughContent,
                        hasCenterElements: !hasCenterElements,
                        hasScrollableContainer: !hasScrollableContainer
                    }
                });
            }
            
            // 新的验证条件：必须在可滚动容器内
            if (hasEnoughContent && hasCenterElements && hasScrollableContainer) {
                const validatedClass = {
                    ...classInfo,
                    elements: Array.from(elements),
                    validCount,
                    centerCount,
                    contentStats,
                    centerRatio: centerCount / elements.length,
                    score: this.calculateElementScore(classInfo, contentStats, validCount, centerCount)
                };
                validatedClasses.push(validatedClass);
                console.log(`✅ 通过验证的类选择器 ${classInfo.selector}:`, validatedClass);
            } else {
                console.log(`❌ 未通过验证的类选择器 ${classInfo.selector}: hasEnoughContent=${hasEnoughContent}, hasCenterElements=${hasCenterElements}, hasScrollableContainer=${hasScrollableContainer}`);
            }
        });
        
        // 过滤包含关系，只保留最外层父元素
        const filteredClasses = this.filterNestedElements(validatedClasses);
        
        // 添加大小分析，只选择面积最大的单个元素
        const sizeAnalyzedClasses = this.analyzeSizeAndPrioritize(filteredClasses);
        
        // 只返回面积最大的一个元素类型
        if (sizeAnalyzedClasses.length > 0) {
            const largestElement = sizeAnalyzedClasses.reduce((largest, current) => {
                return current.averageArea > largest.averageArea ? current : largest;
            });
            console.log(`🎯 最终选择最大元素: ${largestElement.selector} (面积: ${Math.round(largestElement.averageArea)}px²)`);
            return [largestElement];
        }
        
        return [];
    }
    
    // 过滤嵌套元素，只保留最外层的父元素
    filterNestedElements(validatedClasses) {
        if (validatedClasses.length <= 1) return validatedClasses;
        
        const filtered = [];
        
        for (let i = 0; i < validatedClasses.length; i++) {
            const currentClass = validatedClasses[i];
            const currentElements = currentClass.elements;
            let isNested = false;
            
            // 检查当前类是否被其他类包含
            for (let j = 0; j < validatedClasses.length; j++) {
                if (i === j) continue;
                
                const otherClass = validatedClasses[j];
                const otherElements = otherClass.elements;
                
                // 检查当前类的元素是否都被另一个类的元素包含
                const isContainedByOther = this.checkElementContainment(currentElements, otherElements);
                
                if (isContainedByOther) {
                    console.log(`🔗 检测到包含关系: ${currentClass.selector} 被 ${otherClass.selector} 包含`);
                    isNested = true;
                    break;
                }
            }
            
            // 如果不是嵌套的，保留这个类
            if (!isNested) {
                filtered.push(currentClass);
                console.log(`✅ 保留父级元素: ${currentClass.selector}`);
            } else {
                console.log(`❌ 过滤嵌套元素: ${currentClass.selector}`);
            }
        }
        
        return filtered;
    }
    
    // 检查 childElements 是否都被 parentElements 包含
    checkElementContainment(childElements, parentElements) {
        if (childElements.length === 0 || parentElements.length === 0) return false;
        
        let containedCount = 0;
        
        childElements.forEach(childElement => {
            parentElements.forEach(parentElement => {
                // 检查 childElement 是否是 parentElement 的后代
                if (parentElement.contains(childElement)) {
                    containedCount++;
                    return;
                }
            });
        });
        
        // 如果至少80%的子元素被包含，认为存在包含关系
        const containmentRatio = containedCount / childElements.length;
        return containmentRatio >= 0.8;
    }
    
    // 分析元素大小并调整优先级
    analyzeSizeAndPrioritize(validatedClasses) {
        if (validatedClasses.length <= 1) return validatedClasses;
        
        // 计算每个类的平均元素大小
        const classesWithSize = validatedClasses.map(classInfo => {
            let totalArea = 0;
            let validElementCount = 0;
            
            classInfo.elements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const area = rect.width * rect.height;
                
                // 只计算可见且有意义大小的元素
                if (area > 100) { // 至少10x10像素
                    totalArea += area;
                    validElementCount++;
                }
            });
            
            const averageArea = validElementCount > 0 ? totalArea / validElementCount : 0;
            const totalDisplayArea = totalArea;
            
            return {
                ...classInfo,
                averageArea,
                totalDisplayArea,
                validElementCount
            };
        });
        
        // 找出最大的平均面积和总面积
        const maxAverageArea = Math.max(...classesWithSize.map(c => c.averageArea));
        const maxTotalArea = Math.max(...classesWithSize.map(c => c.totalDisplayArea));
        
        // 根据大小调整评分
        const prioritizedClasses = classesWithSize.map(classInfo => {
            let sizeBonus = 0;
            
            // 平均面积奖励（单个元素大小）
            if (classInfo.averageArea > 0) {
                const areaRatio = classInfo.averageArea / maxAverageArea;
                sizeBonus += areaRatio * 50; // 最多50分奖励
            }
            
            // 总面积奖励（整体占用空间）
            if (classInfo.totalDisplayArea > 0) {
                const totalAreaRatio = classInfo.totalDisplayArea / maxTotalArea;
                sizeBonus += totalAreaRatio * 30; // 最多30分奖励
            }
            
            // 如果是最大的元素，额外奖励
            if (classInfo.averageArea === maxAverageArea) {
                sizeBonus += 20; // 最大元素额外奖励
                console.log(`🏆 最大元素奖励: ${classInfo.selector} (平均面积: ${Math.round(classInfo.averageArea)}px²)`);
            }
            
            const newScore = classInfo.score + sizeBonus;
            
            console.log(`📏 大小分析 ${classInfo.selector}:`, {
                averageArea: Math.round(classInfo.averageArea),
                totalArea: Math.round(classInfo.totalDisplayArea),
                elementCount: classInfo.validElementCount,
                sizeBonus: Math.round(sizeBonus),
                oldScore: Math.round(classInfo.score),
                newScore: Math.round(newScore)
            });
            
            return {
                ...classInfo,
                score: newScore,
                sizeBonus
            };
        });
        
        return prioritizedClasses;
    }
    
    // 新方法：直接检测滚动时的视觉变化
    async detectScrollChanges() {
        console.log('📱 开始检测滚动变化...');
        
        const scrollChanges = [];
        
        // 记录初始状态：所有有class的元素及其位置
        const initialElements = this.captureElementPositions();
        console.log(`📊 初始状态：${Object.keys(initialElements).length} 个类选择器`);
        
        // 进行3次滚动测试
        for (let i = 1; i <= 3; i++) {
            console.log(`📜 第${i}次滚动测试...`);
            
            // 滚动一屏
            const viewportHeight = window.innerHeight;
            window.scrollBy({
                top: viewportHeight,
                behavior: 'smooth'
            });
            
            // 等待内容加载和动画完成
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 记录滚动后状态
            const afterScrollElements = this.captureElementPositions();
            
            // 比较变化
            const changes = this.compareElementPositions(initialElements, afterScrollElements, i);
            scrollChanges.push(...changes);
            
            console.log(`📊 第${i}次滚动后：检测到 ${changes.length} 种变化`);
        }
        
        console.log('📱 滚动检测完成，总变化:', scrollChanges.length);
        return scrollChanges;
    }
    
    // 🧪 专门监控 Feed_body_3R0rO 元素的实验
    monitorFeedBodyExperiment() {
        const targetClass = 'Feed_body_3R0rO';
        const elements = document.querySelectorAll(`.${targetClass}`);
        
        console.log(`🧪 Feed_body_3R0rO 监控实验:`, {
            当前时间: new Date().toLocaleTimeString(),
            找到元素数量: elements.length,
            页面滚动位置: window.pageYOffset.toFixed(1) + 'px'
        });
        
        if (elements.length > 0) {
            elements.forEach((element, index) => {
                const rect = element.getBoundingClientRect();
                const absoluteTop = rect.top + window.pageYOffset;
                const content = element.textContent?.trim().substring(0, 80) || '';
                const links = element.querySelectorAll('a[href]');
                const images = element.querySelectorAll('img');
                
                console.log(`📋 Feed_body_${index + 1}:`, {
                    绝对位置Y: absoluteTop.toFixed(1) + 'px',
                    视口位置Y: rect.top.toFixed(1) + 'px',
                    元素大小: `${rect.width.toFixed(1)} x ${rect.height.toFixed(1)}`,
                    在视口内: rect.top >= 0 && rect.bottom <= window.innerHeight,
                    链接数量: links.length,
                    图片数量: images.length,
                    内容摘要: content.replace(/\n/g, ' ')
                });
            });
        } else {
            console.log(`❌ 未找到 ${targetClass} 元素`);
        }
        
        // 检查是否有其他可能的 Feed 相关类名
        const allFeedClasses = [...document.querySelectorAll('[class*="Feed"]')];
        if (allFeedClasses.length > 0) {
            const feedClassNames = new Set();
            allFeedClasses.forEach(el => {
                const className = this.getElementClassName(el);
                if (className) {
                    className.split(' ').forEach(cls => {
                        if (cls.includes('Feed')) {
                            feedClassNames.add(cls);
                        }
                    });
                }
            });
            console.log(`🔍 发现的其他Feed类名:`, Array.from(feedClassNames));
        }
        
        return elements.length;
    }

    // 捕获所有元素的位置和数量信息
    captureElementPositions() {
        // 🧪 专门监控 Feed_body_3R0rO 元素的实验
        this.monitorFeedBodyExperiment();
        
        const elementData = {};
        const allElements = document.querySelectorAll('*[class]');
        
        allElements.forEach(element => {
            let classString = '';
            if (typeof element.className === 'string') {
                classString = element.className;
            } else if (element.className && element.className.baseVal) {
                classString = element.className.baseVal;
            } else {
                return;
            }
            
            const classes = classString.trim().split(/\s+/);
            classes.forEach(className => {
                if (className && !className.startsWith('wao-') && !className.startsWith('webmonkey-')) {
                    const selector = `.${className}`;
                    
                    if (!elementData[selector]) {
                        elementData[selector] = {
                            elements: [],
                            count: 0,
                            totalArea: 0,
                            visibleElements: []
                        };
                    }
                    
                    const rect = element.getBoundingClientRect();
                    const area = rect.width * rect.height;
                    const isVisible = rect.top >= 0 && rect.top <= window.innerHeight && area > 10;
                    
                    // 计算相对于文档的绝对位置，避免滚动影响
                    const absoluteTop = rect.top + window.pageYOffset;
                    const absoluteLeft = rect.left + window.pageXOffset;
                    
                    elementData[selector].elements.push(element);
                    elementData[selector].count++;
                    elementData[selector].totalArea += area;
                    
                    // 为每个元素创建唯一指纹，用于真实的内容比较
                    const elementSignature = {
                        tagName: element.tagName,
                        className: this.getElementClassName(element),
                        textContent: element.textContent?.trim().substring(0, 100),
                        absoluteTop: Math.round(absoluteTop),
                        absoluteLeft: Math.round(absoluteLeft),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        area: Math.round(area)
                    };
                    
                    if (isVisible) {
                        elementData[selector].visibleElements.push({
                            element,
                            signature: elementSignature,
                            rect: {
                                top: rect.top,
                                left: rect.left,
                                width: rect.width,
                                height: rect.height,
                                area: area,
                                absoluteTop: absoluteTop,
                                absoluteLeft: absoluteLeft
                            }
                        });
                    }
                }
            });
        });
        
        return elementData;
    }
    
    // 比较两次扫描的差异 - 重点检测元素重合度
    compareElementPositions(before, after, scrollIndex) {
        const changes = [];
        
        Object.keys(after).forEach(selector => {
            const beforeData = before[selector];
            const afterData = after[selector];
            
            if (!beforeData) return; // 新出现的类，暂时忽略
            
            // 🧪 专门监控 Feed_body_3R0rO 的变化
            if (selector === '.Feed_body_3R0rO') {
                console.log(`🧪 Feed_body_3R0rO 滚动变化分析:`, {
                    滚动索引: scrollIndex,
                    滚动前数量: beforeData.count,
                    滚动后数量: afterData.count,
                    数量变化: afterData.count - beforeData.count,
                    滚动前元素: beforeData.elements.map((el, i) => ({
                        索引: i,
                        绝对位置: Math.round(el.getBoundingClientRect().top + window.pageYOffset),
                        内容: el.textContent?.trim().substring(0, 30)
                    })),
                    滚动后元素: afterData.elements.map((el, i) => ({
                        索引: i,
                        绝对位置: Math.round(el.getBoundingClientRect().top + window.pageYOffset),
                        内容: el.textContent?.trim().substring(0, 30)
                    }))
                });
            }
            
            // 检查元素重合度 - 核心改进
            const overlapAnalysis = this.analyzeElementOverlap(beforeData.elements, afterData.elements);
            
            // 重新定义真实变化检测：真正的动态内容应该有大量新内容
            const hasSignificantNewContent = overlapAnalysis.newElementCount >= 2; // 至少要有2个新元素
            const hasElementIncrease = afterData.count > beforeData.count; // 元素数量必须增加
            const hasLowOverlap = overlapAnalysis.overlapRatio < 0.8; // 重合度低于80%
            const isNotStaticElement = this.checkIfNotStaticElement(selector, beforeData.elements, afterData.elements);
            
            console.log(`🔍 变化分析 ${selector}:`, {
                newElements: overlapAnalysis.newElementCount,
                totalBefore: beforeData.count,
                totalAfter: afterData.count,
                overlapRatio: (overlapAnalysis.overlapRatio * 100).toFixed(1) + '%',
                passNewContent: hasSignificantNewContent,
                passIncrease: hasElementIncrease,
                passLowOverlap: hasLowOverlap,
                passStaticCheck: isNotStaticElement
            });
            
            if (hasSignificantNewContent && hasElementIncrease && hasLowOverlap && isNotStaticElement) {
                changes.push({
                    selector,
                    scrollIndex,
                    countChange: afterData.count - beforeData.count,
                    newElementCount: overlapAnalysis.newElementCount,
                    overlapRatio: overlapAnalysis.overlapRatio,
                    contentSimilarity: overlapAnalysis.contentSimilarity,
                    beforeCount: beforeData.count,
                    afterCount: afterData.count,
                    elements: afterData.elements,
                    newElements: overlapAnalysis.newElements,
                    averageArea: afterData.totalArea / afterData.count,
                    totalArea: afterData.totalArea,
                    // 调试信息
                    debug: {
                        overlapAnalysis: overlapAnalysis
                    }
                });
                
                console.log(`🔄 真实变化检测 ${selector}:`, {
                    newElements: overlapAnalysis.newElementCount,
                    overlapRatio: (overlapAnalysis.overlapRatio * 100).toFixed(1) + '%',
                    contentSimilarity: (overlapAnalysis.contentSimilarity * 100).toFixed(1) + '%'
                });
            } else {
                // 调试：显示为什么没有通过
                if (!hasSignificantNewContent) {
                    console.log(`❌ 新元素数量不足 ${selector}: 需要≥2个，实际${overlapAnalysis.newElementCount}个`);
                }
                if (!hasElementIncrease) {
                    console.log(`❌ 元素数量未增加 ${selector}: ${beforeData.count} -> ${afterData.count}`);
                }
                if (!hasLowOverlap) {
                    console.log(`❌ 重合度过高 ${selector}: ${(overlapAnalysis.overlapRatio * 100).toFixed(1)}%`);
                }
                if (!isNotStaticElement) {
                    console.log(`❌ 静态元素被过滤 ${selector}`);
                }
            }
        });
        
        return changes.sort((a, b) => b.newElementCount - a.newElementCount); // 按新元素数量排序
    }
    
    // 分析元素重合度 - 核心新功能
    analyzeElementOverlap(beforeElements, afterElements) {
        const beforeSignatures = beforeElements.map(el => this.generateElementSignature(el));
        const afterSignatures = afterElements.map(el => this.generateElementSignature(el));
        
        // 找出重合的元素
        let overlapCount = 0;
        const newElements = [];
        const newSignatures = [];
        
        afterSignatures.forEach((afterSig, index) => {
            let isOverlapping = false;
            
            beforeSignatures.forEach(beforeSig => {
                // 重新定义"相同元素"的标准：位置+内容双重匹配
                const positionMatch = this.isPositionMatch(beforeSig, afterSig);
                const contentMatch = this.isContentMatch(beforeSig, afterSig);
                
                // 只有位置相近且内容高度相似才认为是同一个元素
                if (positionMatch && contentMatch) {
                    isOverlapping = true;
                }
            });
            
            if (!isOverlapping) {
                newElements.push(afterElements[index]);
                newSignatures.push(afterSig);
            } else {
                overlapCount++;
            }
        });
        
        const overlapRatio = afterElements.length > 0 ? overlapCount / afterElements.length : 0;
        const newElementCount = newElements.length;
        
        // 计算内容相似度
        const contentSimilarity = this.calculateContentSimilarity(beforeSignatures, newSignatures);
        
        return {
            overlapCount,
            overlapRatio,
            newElementCount,
            newElements,
            contentSimilarity,
            totalBefore: beforeElements.length,
            totalAfter: afterElements.length
        };
    }
    
    // 生成元素指纹 - 用于识别相同元素（使用绝对位置）
    generateElementSignature(element) {
        const text = element.textContent?.trim() || '';
        const rect = element.getBoundingClientRect();
        
        // 使用绝对位置，避免滚动影响
        const absoluteTop = Math.round(rect.top + window.pageYOffset);
        const absoluteLeft = Math.round(rect.left + window.pageXOffset);
        
        // 获取关键属性
        const tagName = element.tagName.toLowerCase();
        const classString = this.getElementClassName(element);
        
        // 截取文本前50个字符作为内容指纹
        const contentFingerprint = text.substring(0, 50);
        
        // 获取链接信息
        const links = element.querySelectorAll('a[href]');
        const linkHrefs = Array.from(links).slice(0, 3).map(a => a.href).join('|');
        
        // 获取图片信息
        const images = element.querySelectorAll('img[src]');
        const imageSrcs = Array.from(images).slice(0, 2).map(img => img.src).join('|');
        
        return {
            tagName,
            classString,
            contentFingerprint,
            linkHrefs,
            imageSrcs,
            textLength: text.length,
            area: rect.width * rect.height,
            elementCount: element.querySelectorAll('*').length,
            // 使用绝对位置进行更准确的位置比较
            absoluteTop: absoluteTop,
            absoluteLeft: absoluteLeft,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };
    }
    
    // 检查位置是否匹配（位置相近认为是同一个元素位置）
    isPositionMatch(sig1, sig2) {
        const positionTolerance = 20; // 20像素容差
        const topDiff = Math.abs(sig1.absoluteTop - sig2.absoluteTop);
        const leftDiff = Math.abs(sig1.absoluteLeft - sig2.absoluteLeft);
        
        return topDiff < positionTolerance && leftDiff < positionTolerance;
    }
    
    // 检查内容是否匹配（内容高度相似认为是同一个元素）
    isContentMatch(sig1, sig2) {
        // 1. 类名必须相同
        if (sig1.classString !== sig2.classString) {
            return false;
        }
        
        // 2. 内容相似度要很高（>85%）
        const contentSimilarity = this.calculateTextSimilarity(sig1.contentFingerprint, sig2.contentFingerprint);
        if (contentSimilarity < 0.85) {
            return false;
        }
        
        // 3. 链接相似度（如果有链接的话）
        if (sig1.linkHrefs && sig2.linkHrefs) {
            if (sig1.linkHrefs !== sig2.linkHrefs) {
                return false;
            }
        }
        
        return true;
    }
    
    // 计算签名相似度
    calculateSignatureSimilarity(sig1, sig2) {
        let similarity = 0;
        let factors = 0;
        
        // 类名相似度
        if (sig1.classString === sig2.classString) {
            similarity += 0.3;
        }
        factors += 0.3;
        
        // 内容相似度
        if (sig1.contentFingerprint && sig2.contentFingerprint) {
            const contentSim = this.calculateTextSimilarity(sig1.contentFingerprint, sig2.contentFingerprint);
            similarity += contentSim * 0.4;
        }
        factors += 0.4;
        
        // 位置相似度 - 使用绝对位置比较
        const positionTolerance = 10; // 10像素容差
        const topDiff = Math.abs(sig1.absoluteTop - sig2.absoluteTop);
        const leftDiff = Math.abs(sig1.absoluteLeft - sig2.absoluteLeft);
        const positionSim = (topDiff < positionTolerance && leftDiff < positionTolerance) ? 1 : 0;
        similarity += positionSim * 0.2;
        factors += 0.2;
        
        // 链接相似度
        if (sig1.linkHrefs && sig2.linkHrefs) {
            const linkSim = sig1.linkHrefs === sig2.linkHrefs ? 1 : 0;
            similarity += linkSim * 0.2;
        }
        factors += 0.2;
        
        // 面积相似度
        if (sig1.area > 0 && sig2.area > 0) {
            const areaSim = 1 - Math.abs(sig1.area - sig2.area) / Math.max(sig1.area, sig2.area);
            similarity += areaSim * 0.1;
        }
        factors += 0.1;
        
        return factors > 0 ? similarity / factors : 0;
    }
    
    // 计算文本相似度
    calculateTextSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;
        if (text1 === text2) return 1;
        
        // 简单的字符重合度计算
        const set1 = new Set(text1.toLowerCase().split(''));
        const set2 = new Set(text2.toLowerCase().split(''));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    // 计算内容相似度
    calculateContentSimilarity(beforeSignatures, newSignatures) {
        if (beforeSignatures.length === 0 || newSignatures.length === 0) return 0;
        
        let totalSimilarity = 0;
        let comparisons = 0;
        
        newSignatures.forEach(newSig => {
            beforeSignatures.forEach(beforeSig => {
                totalSimilarity += this.calculateSignatureSimilarity(beforeSig, newSig);
                comparisons++;
            });
        });
        
        return comparisons > 0 ? totalSimilarity / comparisons : 0;
    }
    
    // 检查元素位置是否发生变化
    checkPositionChanges(beforeVisible, afterVisible) {
        if (beforeVisible.length === 0 || afterVisible.length === 0) return false;
        
        // 简单检查：比较第一个可见元素的位置
        const beforeFirst = beforeVisible[0];
        const afterFirst = afterVisible[0];
        
        if (beforeFirst && afterFirst) {
            const topDiff = Math.abs(beforeFirst.rect.top - afterFirst.rect.top);
            return topDiff > 50; // 如果位置变化超过50px，认为有变化
        }
        
        return false;
    }
    
    // 按面积和DOM层级选择最佳滚动元素
    selectBestScrollElement(scrollChanges) {
        if (scrollChanges.length === 0) return null;
        
        console.log('🎯 开始选择最佳滚动元素...');
        
        // 按选择器分组，合并多次滚动的变化
        const groupedChanges = {};
        scrollChanges.forEach(change => {
            if (!groupedChanges[change.selector]) {
                groupedChanges[change.selector] = {
                    selector: change.selector,
                    elements: change.elements,
                    totalNewElements: 0,
                    totalCountChange: 0,
                    scrollCount: 0,
                    averageArea: change.averageArea,
                    totalArea: change.totalArea,
                    overlapRatios: [],
                    contentSimilarities: [],
                    allNewElements: []
                };
            }
            
            const group = groupedChanges[change.selector];
            group.totalNewElements += change.newElementCount;
            group.totalCountChange += change.countChange;
            group.scrollCount++;
            group.overlapRatios.push(change.overlapRatio);
            group.contentSimilarities.push(change.contentSimilarity);
            group.allNewElements.push(...change.newElements);
        });
        
        // 转换为数组并计算评分
        const candidates = Object.values(groupedChanges).map(group => {
            let score = 0;
            
            // 过滤明显的控制元素和静态元素
            const isControlElement = /\b(control|button|btn|play|video|audio|menu|nav|toolbar)\b/i.test(group.selector);
            const isStaticElement = /\b(banner|header|nav|navigation|sidebar|footer|fixed|sticky|ad)\b/i.test(group.selector);
            
            // 面积分数（最重要）
            score += Math.min(group.averageArea / 10000, 100); // 面积越大分数越高
            
            // 变化分数 - 基于新的重合度分析
            score += group.totalNewElements * 20; // 新元素数量最重要
            score += group.totalCountChange * 5; // 总体元素增加
            
            // 重合度分析分数
            const avgOverlapRatio = group.overlapRatios.length > 0 ? 
                group.overlapRatios.reduce((a, b) => a + b, 0) / group.overlapRatios.length : 1;
            score += (1 - avgOverlapRatio) * 30; // 重合度越低分数越高
            
            // 内容变化分数
            const avgContentSimilarity = group.contentSimilarities.length > 0 ?
                group.contentSimilarities.reduce((a, b) => a + b, 0) / group.contentSimilarities.length : 0;
            score += (1 - avgContentSimilarity) * 25; // 内容差异越大分数越高
            
            // DOM层级分数（计算到根元素的距离）
            const domDepth = this.calculateDOMDepth(group.elements[0]);
            score += Math.max(0, 20 - domDepth); // 越靠近根元素分数越高
            
            // 如果是控制元素，大幅降低分数
            if (isControlElement) {
                score *= 0.1; // 减少90%分数
                console.log(`⚠️ 控制元素降分: ${group.selector}`);
            }
            
            // 如果是静态元素，严重降低分数
            if (isStaticElement) {
                score *= 0.05; // 减少95%分数
                console.log(`🚫 静态元素严重降分: ${group.selector}`);
            }
            
            // 优先Feed、List、Item等内容元素
            const isContentElement = /\b(feed|list|item|post|content|article|card)\b/i.test(group.selector);
            if (isContentElement) {
                score *= 1.5; // 增加50%分数
                console.log(`🎯 内容元素加分: ${group.selector}`);
            }
            
            // 新增：子元素内容评分系统（内联版本）
            let contentScore = 0;
            const contentDebug = {
                linkScore: 0,
                videoScore: 0,
                imageVideoScore: 0,
                noImagePenalty: 0
            };
            
            // 分析前几个元素的内容
            const sampleElements = group.elements.slice(0, Math.min(5, group.elements.length));
            sampleElements.forEach(element => {
                const stats = this.analyzeElementContent(element);
                
                // 1. 如果子元素里面有链接超过两个，加分
                if (stats.linkCount > 2) {
                    const linkBonus = Math.min(stats.linkCount * 5, 25);
                    contentScore += linkBonus;
                    contentDebug.linkScore += linkBonus;
                }
                
                // 2. 如果子元素里面有视频，加高权重分
                if (stats.hasVideos) {
                    const videoBonus = 40;
                    contentScore += videoBonus;
                    contentDebug.videoScore += videoBonus;
                }
                
                // 3. 如果子元素有图片和视频，加高权重分
                if (stats.hasImages && stats.hasVideos) {
                    const imageVideoBonus = 30;
                    contentScore += imageVideoBonus;
                    contentDebug.imageVideoScore += imageVideoBonus;
                }
                
                // 4. 如果子元素里面没有图片，减分
                if (!stats.hasImages) {
                    const noImagePenalty = -15;
                    contentScore += noImagePenalty;
                    contentDebug.noImagePenalty += noImagePenalty;
                }
            });
            
            // 按总元素数量放大
            if (sampleElements.length > 0) {
                contentScore = contentScore / sampleElements.length * group.elements.length;
            }
            
            score += Math.round(contentScore);
            
            console.log(`📊 内容评分详情 ${group.selector}:`, {
                ...contentDebug,
                totalScore: Math.round(contentScore),
                sampleSize: sampleElements.length,
                totalElements: group.elements.length
            });
            
            return {
                ...group,
                score,
                domDepth,
                isControlElement,
                isContentElement,
                contentScore: Math.round(contentScore)
            };
        });
        
        // 排序并选择最佳
        candidates.sort((a, b) => b.score - a.score);
        
        // 输出候选结果
        console.log('🏆 候选元素评分:', candidates.slice(0, 5).map(c => ({
            selector: c.selector,
            score: Math.round(c.score),
            averageArea: Math.round(c.averageArea),
            domDepth: c.domDepth,
            changes: `+${c.totalNewElements}新元素, 共${c.totalCountChange}增长`,
            avgOverlapRatio: c.overlapRatios.length > 0 ? 
                (c.overlapRatios.reduce((a, b) => a + b, 0) / c.overlapRatios.length * 100).toFixed(1) + '%' : 'N/A',
            contentScore: c.contentScore || 0
        })));
        
        const best = candidates[0];
        if (best) {
            console.log(`🎯 选择最佳元素: ${best.selector} (评分: ${Math.round(best.score)})`);
            return {
                selector: best.selector,
                elements: best.elements,
                totalGrowth: best.totalCountChange,
                totalNewElements: best.totalNewElements,
                score: best.score,
                averageArea: best.averageArea,
                overlapAnalysis: {
                    avgOverlapRatio: best.overlapRatios.length > 0 ? 
                        best.overlapRatios.reduce((a, b) => a + b, 0) / best.overlapRatios.length : 0,
                    avgContentSimilarity: best.contentSimilarities.length > 0 ?
                        best.contentSimilarities.reduce((a, b) => a + b, 0) / best.contentSimilarities.length : 0,
                    allNewElements: best.allNewElements
                }
            };
        }
        
        return null;
    }
    
    // 计算元素到根的DOM层级深度
    calculateDOMDepth(element) {
        let depth = 0;
        let current = element;
        while (current && current !== document.body && depth < 20) {
            depth++;
            current = current.parentElement;
        }
        return depth;
    }
    
    // 安全获取元素className（处理SVG等特殊情况）
    getElementClassName(element) {
        if (!element.className) return '';
        
        // 处理SVGAnimatedString情况
        if (typeof element.className === 'string') {
            return element.className;
        } else if (element.className.baseVal !== undefined) {
            return element.className.baseVal; // SVG元素
        }
        
        return '';
    }
    
    // 检查是否为静态元素（只过滤明显的静态元素）
    checkIfNotStaticElement(selector, beforeElements, afterElements) {
        // 1. 只过滤非常明显的静态关键词
        const obviousStaticKeywords = /\b(banner|header|toolbar|fixed-top|navbar|advertisement)\b/i;
        if (obviousStaticKeywords.test(selector)) {
            console.log(`🚫 静态元素过滤: ${selector} - 包含明显静态关键词`);
            return false;
        }
        
        // 2. 检查是否真的是完全相同的内容（100%相同才过滤）
        if (beforeElements.length > 0 && afterElements.length > 0 && beforeElements.length === afterElements.length) {
            let identicalCount = 0;
            const maxCheck = Math.min(3, beforeElements.length);
            
            for (let i = 0; i < maxCheck; i++) {
                const beforeContent = beforeElements[i].textContent?.trim() || '';
                const afterContent = afterElements[i].textContent?.trim() || '';
                
                if (beforeContent === afterContent && beforeContent.length > 10) {
                    identicalCount++;
                }
            }
            
            // 如果所有检查的元素内容都完全相同，才认为是静态的
            if (identicalCount === maxCheck && identicalCount > 0) {
                console.log(`🚫 静态元素过滤: ${selector} - 内容完全相同`);
                return false;
            }
        }
        
        console.log(`✅ 通过静态元素检查: ${selector}`);
        return true;
    }
    
    // 检查元素是否在可滚动容器内
    checkScrollableContainer(elements) {
        let scrollableContainerCount = 0;
        let totalElements = elements.length;
        const scrollableContainers = new Set();
        
        elements.forEach(element => {
            let parent = element.parentElement;
            let foundScrollable = false;
            
            // 向上查找可滚动的父容器（最多查找10层）
            for (let i = 0; i < 10 && parent && !foundScrollable; i++) {
                const computedStyle = window.getComputedStyle(parent);
                const overflowY = computedStyle.overflowY;
                const overflowX = computedStyle.overflowX;
                
                // 检查是否可滚动
                const isScrollable = (
                    overflowY === 'scroll' || 
                    overflowY === 'auto' || 
                    overflowX === 'scroll' || 
                    overflowX === 'auto'
                ) && (
                    parent.scrollHeight > parent.clientHeight ||
                    parent.scrollWidth > parent.clientWidth
                );
                
                if (isScrollable) {
                    scrollableContainerCount++;
                    scrollableContainers.add(parent);
                    foundScrollable = true;
                }
                
                parent = parent.parentElement;
            }
        });
        
        const scrollableRatio = scrollableContainerCount / totalElements;
        
        console.log(`📜 滚动容器检测:`, {
            totalElements,
            scrollableElements: scrollableContainerCount,
            scrollableRatio: (scrollableRatio * 100).toFixed(1) + '%',
            uniqueContainers: scrollableContainers.size
        });
        
        return {
            scrollableRatio,
            scrollableContainerCount,
            uniqueContainers: scrollableContainers.size,
            hasScrollableContainer: scrollableRatio > 0.3 || scrollableContainers.size > 0 // 降低到30%或有任何滚动容器
        };
    }
    
    // 检查元素是否位于页面中心区域（更严格的中心检测）
    isElementInCenterArea(element) {
        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 定义真正的中心区域（更严格的中心定义）
        const centerLeft = viewportWidth * 0.25;   // 左边25%
        const centerRight = viewportWidth * 0.75;  // 右边75%
        const centerTop = viewportHeight * 0.2;    // 顶部20%
        const centerBottom = viewportHeight * 0.8; // 底部80%
        
        // 检查元素是否主要位于中心区域
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        
        const isInHorizontalCenter = elementCenterX >= centerLeft && elementCenterX <= centerRight;
        const isInVerticalCenter = elementCenterY >= centerTop && elementCenterY <= centerBottom;
        
        // 同时满足水平和垂直中心条件
        return isInHorizontalCenter && isInVerticalCenter;
    }
    
    // 分析元素内容（增强版本，区分内容和导航）
    analyzeElementContent(element) {
        const text = element.textContent?.trim() || '';
        const links = element.querySelectorAll('a, button, [onclick]');
        const images = element.querySelectorAll('img, picture, [style*="background-image"]');
        const videos = element.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="bilibili"]');
        
        // 更严格的导航检测
        const className = element.className || '';
        const classString = typeof className === 'string' ? className : (className.baseVal || '');
        const isLikelyNavigation = /\b(nav|menu|header|footer|toolbar|control)\b/i.test(classString);
        
        // 检查链接质量 - 排除一些控制按钮
        const meaningfulLinks = Array.from(links).filter(link => {
            const linkText = link.textContent?.trim() || '';
            const linkClass = link.className || '';
            const linkClassString = typeof linkClass === 'string' ? linkClass : (linkClass.baseVal || '');
            
            // 排除明显的控制按钮
            const isControlButton = /\b(btn|button|icon|control|close|more)\b/i.test(linkClassString);
            
            return linkText.length > 0 && !isControlButton;
        });
        
        return {
            hasText: text.length > 5,
            hasRichText: text.length > 15, // 更丰富的文本内容
            hasLinks: links.length > 0,
            hasMeaningfulLinks: meaningfulLinks.length >= 2, // 至少2个有意义的链接
            hasImages: images.length > 0,
            hasVideos: videos.length > 0,
            textLength: text.length,
            linkCount: links.length,
            meaningfulLinkCount: meaningfulLinks.length,
            imageCount: images.length,
            videoCount: videos.length,
            isLikelyNavigation: isLikelyNavigation
        };
    }
    
    // 计算元素评分（更新后的算法）
    calculateElementScore(classInfo, contentStats, validCount, centerCount = 0) {
        let score = 0;
        
        // 基础分：总增长数量（更适用于多轮增长）
        score += (classInfo.totalGrowth || classInfo.growth || 0) * 10;
        
        // 持续增长分数（奖励持续增长的模式）
        if (classInfo.continuousGrowthCount) {
            score += classInfo.continuousGrowthCount * 15;
        }
        
        // 增长率分数
        score += Math.min((classInfo.growthRate || 0) * 20, 50);
        
        // 内容丰富度分数
        score += contentStats.hasText * 2;
        score += contentStats.hasLinks * 2; 
        score += contentStats.hasImages * 3;
        score += contentStats.hasVideos * 5;
        
        // 有效元素比例分数
        const totalCount = classInfo.finalCount || classInfo.afterCount || 1;
        score += (validCount / totalCount) * 30;
        
        // 中心位置分数（新增）
        if (centerCount > 0) {
            score += (centerCount / totalCount) * 25;
        }
        
        return score;
    }

    highlightDynamicElements(bestMatches) {
        this.clearObservedElements();

        // 只处理最高分元素（第一个）
        if (bestMatches.length > 0) {
            const bestMatch = bestMatches[0];
            const { elements, selector, totalGrowth, growth, averageArea, score, contentScore } = bestMatch;
            const displayGrowth = totalGrowth || growth || 0;
            
            // 只高亮前几个代表性元素（最多3个）
            const elementsToHighlight = elements.slice(0, Math.min(3, elements.length));
            console.log(`🎯 高亮最高分元素: ${selector} (评分: ${score ? Math.round(score) : 'N/A'}, 内容分: ${contentScore || 0})`);
            
            elementsToHighlight.forEach((element, elementIndex) => {
                element.style.outline = '3px solid #ff6b35';
                element.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
                element.style.position = 'relative';
                element.style.boxShadow = '0 2px 8px rgba(255, 107, 53, 0.3)';
                
                // 分析当前元素的内容
                const stats = this.analyzeElementContent(element);
                const isInCenter = this.isElementInCenterArea(element);
                
                // 创建详细标签
                const label = document.createElement('div');
                const contentTypes = [];
                if (stats.hasText) contentTypes.push('📝');
                if (stats.hasLinks) contentTypes.push('🔗');
                if (stats.hasImages) contentTypes.push('🖼️');
                if (stats.hasVideos) contentTypes.push('🎥');
                
                // 添加位置和大小标识
                const centerIndicator = isInCenter ? '🎯' : '';
                const sizeIndicator = averageArea > 50000 ? '📏' : '';
                
                label.innerHTML = `
                    <div style="font-weight: bold;">🏆最佳-${elementIndex + 1} ${centerIndicator}${sizeIndicator}</div>
                    <div style="font-size: 9px;">${selector.substring(1, 15)}...</div>
                    <div style="font-size: 10px;">${contentTypes.join('')}</div>
                    <div style="font-size: 9px;">+${displayGrowth} 📏${Math.round(averageArea/1000)}K 分数:${score ? Math.round(score) : 'N/A'}</div>
                `;
                
                label.style.cssText = `
                    position: absolute !important;
                    top: -50px !important;
                    left: 0 !important;
                    background: linear-gradient(135deg, #ff6b35, #f7931e) !important;
                    color: white !important;
                    padding: 4px 6px !important;
                    border-radius: 6px !important;
                    font-size: 10px !important;
                    font-weight: bold !important;
                    z-index: 9999 !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                    min-width: 50px !important;
                    text-align: center !important;
                `;
                
                element.appendChild(label);
                this.observedElements.push({element, label});
            });
        }
        
        console.log('🎨 高亮显示完成: 只显示最高分元素');
    }
    
    showDynamicObservationResults(bestMatches) {
        if (bestMatches.length === 0) {
            this.showNotification('未发现符合条件的最大列表元素 🤔', 'warning');
            return;
        }
        
        // 现在只有一个最大的元素
        const bestMatch = bestMatches[0];
        const bestGrowth = bestMatch.totalGrowth || bestMatch.growth || 0;
        const totalElements = bestMatch.elements.length;
        
        // 生成详细消息
        let message = `🎯 发现最大主要列表元素!\n`;
        message += `📈 三屏滚动增长 ${bestGrowth} 个元素\n`;
        if (bestMatch.totalNewElements !== undefined) {
            message += `🆕 真实新增元素 ${bestMatch.totalNewElements} 个\n`;
        }
        message += `🏆 选中元素: ${bestMatch.selector.substring(0, 25)}\n`;
        message += `   总共 ${totalElements} 个元素\n`;
        
        // 显示大小信息
        if (bestMatch.averageArea) {
            const sizeKB = (bestMatch.averageArea / 1000).toFixed(1);
            message += `   📏 平均大小: ${sizeKB}K像素²\n`;
        }
        
        // 显示重合度分析信息
        if (bestMatch.overlapAnalysis) {
            const overlap = bestMatch.overlapAnalysis;
            if (overlap.avgOverlapRatio !== undefined) {
                message += `   🔄 平均重合度: ${(overlap.avgOverlapRatio * 100).toFixed(1)}%\n`;
            }
        }
        
        // 显示内容评分信息
        if (bestMatch.contentScore !== undefined && bestMatch.contentScore !== 0) {
            message += `   🏅 内容质量分: ${bestMatch.contentScore}分\n`;
        }
        
        // 分析第一个元素的内容作为示例
        if (bestMatch.elements && bestMatch.elements.length > 0) {
            const firstElement = bestMatch.elements[0];
            const stats = this.analyzeElementContent(firstElement);
            const isInCenter = this.isElementInCenterArea(firstElement);
            
            if (isInCenter) {
                message += `   🎯 位置: 中心区域\n`;
            }
            
            const content = [];
            if (stats.hasText) content.push(`📝文本`);
            if (stats.hasLinks) content.push(`🔗链接`);
            if (stats.hasImages) content.push(`🖼️图片`);
            if (stats.hasVideos) content.push(`🎥视频`);
            
            if (content.length > 0) {
                message += `   内容包含: ${content.join(', ')}\n`;
            }
        }
        
        this.showNotification(message, 'success');
        
        // 在控制台输出详细结果
        console.log('🎯 持续增长观察结果详情 (已过滤嵌套):', {
            totalMatches: bestMatches.length,
            totalElements,
            totalGrowth: bestGrowth,
            matches: bestMatches.map(match => ({
                selector: match.selector,
                totalGrowth: match.totalGrowth || match.growth,
                totalNewElements: match.totalNewElements,
                continuousGrowthCount: match.continuousGrowthCount,
                centerRatio: match.centerRatio ? `${Math.round(match.centerRatio * 100)}%` : 'N/A',
                score: match.score ? match.score.toFixed(1) : 'N/A',
                content: match.contentStats,
                elementCount: match.elements.length,
                overlapAnalysis: match.overlapAnalysis || 'N/A'
            }))
        });
    }

    clearObservedElements() {
        this.observedElements.forEach(({element, label}) => {
            element.style.outline = '';
            element.style.backgroundColor = '';
            if (label && label.parentNode) {
                label.parentNode.removeChild(label);
            }
        });
        this.observedElements = [];
    }

    // ===== 新的基于XPath的检测方法 =====
    
    // 1. 捕获第一屏所有元素的XPath
    captureFirstScreenElements() {
        const firstScreenElements = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            // 只记录在第一屏视口内的元素
            if (rect.top >= 0 && 
                rect.bottom <= window.innerHeight && 
                rect.left >= 0 && 
                rect.right <= window.innerWidth &&
                rect.width * rect.height > 100) { // 过滤太小的元素
                
                const xpath = this.getElementXPath(element);
                firstScreenElements.push({
                    element: element,
                    xpath: xpath,
                    rect: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    },
                    textContent: element.textContent?.trim().substring(0, 50) || ''
                });
            }
        });
        
        console.log(`📋 第一屏元素捕获完成: ${firstScreenElements.length} 个元素`);
        return firstScreenElements;
    }

    // 2. 生成元素的XPath
    getElementXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        const parts = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let index = 0;
            let hasFollowingSiblings = false;
            let hasPrecedingSiblings = false;
            
            for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) {
                    hasPrecedingSiblings = true;
                    index++;
                }
            }
            
            for (let sibling = element.nextSibling; sibling; sibling = sibling.nextSibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) {
                    hasFollowingSiblings = true;
                    break;
                }
            }
            
            const tagName = element.tagName.toLowerCase();
            const pathIndex = (hasPrecedingSiblings || hasFollowingSiblings) ? `[${index + 1}]` : '';
            parts.unshift(tagName + pathIndex);
            
            element = element.parentNode;
        }
        
        return parts.length ? '/' + parts.join('/') : '';
    }

    // 3. 检查第一屏元素是否仍在视口内
    checkElementsStillVisible(firstScreenElements) {
        let stillVisibleCount = 0;
        
        firstScreenElements.forEach(elementInfo => {
            try {
                // 通过XPath查找元素
                const element = document.evaluate(elementInfo.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const isVisible = rect.top >= 0 && 
                                    rect.bottom <= window.innerHeight && 
                                    rect.left >= 0 && 
                                    rect.right <= window.innerWidth;
                    
                    if (isVisible) {
                        stillVisibleCount++;
                    }
                }
            } catch (e) {
                // XPath查找失败，元素可能已被移除
            }
        });
        
        return stillVisibleCount;
    }

    // 4. 找出当前视口内的新元素
    findNewElementsInViewport(firstScreenElements) {
        const newElements = [];
        const firstScreenXPaths = new Set(firstScreenElements.map(el => el.xpath));
        
        // 获取当前视口内的所有元素
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top >= 0 && 
                rect.bottom <= window.innerHeight && 
                rect.left >= 0 && 
                rect.right <= window.innerWidth &&
                rect.width * rect.height > 100) {
                
                const xpath = this.getElementXPath(element);
                
                // 如果这个元素不在第一屏记录中，就是新元素
                if (!firstScreenXPaths.has(xpath)) {
                    newElements.push({
                        element: element,
                        xpath: xpath,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        textContent: element.textContent?.trim().substring(0, 50) || '',
                        tagName: element.tagName.toLowerCase(),
                        className: this.getElementClassName(element)
                    });
                }
            }
        });
        
        return newElements;
    }

    // 5. 找出最佳父级容器并识别动态子容器
    findBestParentContainers(newElementsByScroll) {
        // 收集所有新元素
        const allNewElements = [];
        newElementsByScroll.forEach(scrollData => {
            allNewElements.push(...scrollData.newElements);
        });
        
        if (allNewElements.length === 0) {
            return [];
        }
        
        // 按父级容器分组
        const containerGroups = {};
        
        allNewElements.forEach(elementInfo => {
            const element = elementInfo.element;
            let parent = element.parentElement;
            
            // 向上查找合适的父级容器（最多5层）
            for (let depth = 0; depth < 5 && parent; depth++) {
                const parentXPath = this.getElementXPath(parent);
                const parentClassName = this.getElementClassName(parent);
                
                // 跳过没有意义的容器
                if (!parentClassName || parentClassName.includes('body') || parentClassName.includes('html')) {
                    parent = parent.parentElement;
                    continue;
                }
                
                if (!containerGroups[parentXPath]) {
                    containerGroups[parentXPath] = {
                        container: parent,
                        xpath: parentXPath,
                        className: parentClassName,
                        childElements: [],
                        score: 0,
                        depth: depth
                    };
                }
                
                containerGroups[parentXPath].childElements.push(elementInfo);
                break;
            }
        });
        
        // 分析每个父容器中的动态子容器类名
        const containers = Object.values(containerGroups);
        containers.forEach(container => {
            // 识别动态子容器
            const dynamicChildClasses = this.identifyDynamicChildClasses(container);
            container.dynamicChildClasses = dynamicChildClasses;
            
            let score = 0;
            
            // 子元素数量分数
            score += container.childElements.length * 10;
            
            // 深度分数（更深的父级容器分数更高）
            score += container.depth * 5;
            
            // 内容多样性分数
            const uniqueContent = new Set(container.childElements.map(el => el.textContent));
            score += uniqueContent.size * 3;
            
            // 容器大小分数
            const rect = container.container.getBoundingClientRect();
            score += Math.min(rect.width * rect.height / 10000, 50);
            
            // 动态子容器类名质量分数
            score += dynamicChildClasses.length * 15;
            
            container.score = score;
        });
        
        // 过滤嵌套容器，只保留最外层根容器
        const filteredContainers = this.filterNestedContainers(containers);
        
        // 按分数排序，返回前3个
        filteredContainers.sort((a, b) => b.score - a.score);
        
        console.log('🏆 容器评分结果 (已过滤嵌套):', filteredContainers.slice(0, 3).map(c => ({
            className: c.className,
            childCount: c.childElements.length,
            dynamicChildClasses: c.dynamicChildClasses?.map(dc => dc.className) || [],
            score: Math.round(c.score),
            depth: c.depth
        })));
        
        return filteredContainers.slice(0, 3);
    }

    // 识别父容器中真正的动态子容器类名和内部变化元素
    identifyDynamicChildClasses(containerInfo) {
        const container = containerInfo.container;
        const childElements = containerInfo.childElements;
        
        // 按子元素的类名分组
        const childClassGroups = {};
        
        childElements.forEach(elementInfo => {
            const element = elementInfo.element;
            const className = this.getElementClassName(element);
            
            if (className && className.trim()) {
                // 获取最具体的类名（通常是第一个或最长的）
                const classes = className.trim().split(/\s+/);
                const primaryClass = this.selectPrimaryClassName(classes);
                
                if (!childClassGroups[primaryClass]) {
                    childClassGroups[primaryClass] = {
                        className: primaryClass,
                        elements: [],
                        xpaths: new Set(),
                        retentionRate: 0,
                        score: 0,
                        changingInternalElements: [] // 新增：容器内部变化的元素
                    };
                }
                
                childClassGroups[primaryClass].elements.push(element);
                childClassGroups[primaryClass].xpaths.add(elementInfo.xpath);
            }
        });
        
        // 分析每个子容器类的动态特性和内部变化元素
        const dynamicChildClasses = [];
        
        Object.values(childClassGroups).forEach(classGroup => {
            // 检查类名是否在三次滚动中都出现
            const retentionRate = this.calculateClassRetentionRate(classGroup.className, container);
            classGroup.retentionRate = retentionRate;
            
            // 分析容器内部真正变化的元素
            const changingInternalElements = this.analyzeInternalChangingElements(classGroup.elements);
            classGroup.changingInternalElements = changingInternalElements;
            
            // 计算评分
            let score = 0;
            score += classGroup.elements.length * 10; // 元素数量
            score += (1 - retentionRate) * 30; // XPath保存率越低分数越高（动态内容）
            score += this.analyzeChildContentQuality(classGroup.elements) * 20; // 内容质量
            score += changingInternalElements.length * 15; // 内部变化元素数量
            
            classGroup.score = score;
            
            // 过滤广告：保存率太高的可能是广告
            const isLikelyAd = retentionRate > 0.8 || this.isLikelyAdvertisement(classGroup.className);
            
            console.log(`🔍 子容器类分析 ${classGroup.className}:`, {
                elementCount: classGroup.elements.length,
                retentionRate: (retentionRate * 100).toFixed(1) + '%',
                changingInternalElements: changingInternalElements.length,
                score: Math.round(score),
                isLikelyAd: isLikelyAd,
                internalClasses: changingInternalElements.map(ie => ie.className)
            });
            
            if (!isLikelyAd && classGroup.elements.length >= 2) {
                dynamicChildClasses.push(classGroup);
            }
        });
        
        // 按分数排序，返回最佳的动态子容器类
        dynamicChildClasses.sort((a, b) => b.score - a.score);
        
        console.log(`✅ 识别到 ${dynamicChildClasses.length} 个动态子容器类:`, 
            dynamicChildClasses.map(dc => ({
                className: dc.className,
                count: dc.elements.length,
                retentionRate: (dc.retentionRate * 100).toFixed(1) + '%',
                changingElements: dc.changingInternalElements.length,
                score: Math.round(dc.score)
            }))
        );
        
        return dynamicChildClasses.slice(0, 3); // 返回前3个最佳的
    }

    // 分析容器内部真正变化的元素 - 重点检测"类名持续存在+元素实例不断变化"的模式
    analyzeInternalChangingElements(containerElements) {
        const changingElements = [];
        const internalClassStats = {};
        
        // 分析每个容器内部的所有子元素
        containerElements.forEach((containerElement, containerIndex) => {
            const allInternalElements = containerElement.querySelectorAll('*');
            
            allInternalElements.forEach(internalElement => {
                const className = this.getElementClassName(internalElement);
                if (className && className.trim()) {
                    const classes = className.trim().split(/\s+/);
                    
                    classes.forEach(cls => {
                        if (cls && !cls.startsWith('wao-') && !cls.startsWith('webmonkey-')) {
                            if (!internalClassStats[cls]) {
                                internalClassStats[cls] = {
                                    className: cls,
                                    elements: new Set(),
                                    containers: new Set(),
                                    xpaths: new Set(),
                                    contentFingerprints: new Set(), // 新增：内容指纹
                                    totalCount: 0,
                                    scrollHistory: [] // 新增：三次滚动的历史记录
                                };
                            }
                            
                            internalClassStats[cls].elements.add(internalElement);
                            internalClassStats[cls].containers.add(containerElement);
                            internalClassStats[cls].xpaths.add(this.getElementXPath(internalElement));
                            internalClassStats[cls].totalCount++;
                            
                            // 生成内容指纹
                            const contentFingerprint = this.generateContentFingerprint(internalElement);
                            internalClassStats[cls].contentFingerprints.add(contentFingerprint);
                        }
                    });
                }
            });
        });
        
        // 基于三次滚动历史分析每个class的动态特性
        Object.values(internalClassStats).forEach(classStats => {
            // 检查该class是否符合"持续存在+实例变化"的模式
            const dynamicListPattern = this.checkDynamicListPattern(classStats);
            
            // 计算该内部class的变化特征
            const uniqueContainers = classStats.containers.size;
            const totalContainers = containerElements.length;
            const appearanceRate = uniqueContainers / totalContainers;
            
            // 计算该class在历史滚动中的变化情况（重点关注实例变化）
            const instanceChangeRate = this.calculateInstanceChangeRate(classStats.className);
            
            // 分析内容质量
            const sampleElements = Array.from(classStats.elements).slice(0, 3);
            const contentQuality = this.analyzeChildContentQuality(sampleElements);
            
            // 新的评分算法：专门针对动态列表模式
            let changeScore = 0;
            
            // 1. 类名持续存在性分数（类名在三次滚动中都存在）
            changeScore += dynamicListPattern.classPersistence * 40;
            
            // 2. 实例变化性分数（具体元素实例在变化）
            changeScore += instanceChangeRate * 30;
            
            // 3. 出现率分数（在多个容器中出现）
            changeScore += appearanceRate * 20;
            
            // 4. 内容质量分数
            changeScore += contentQuality * 10;
            
            // 过滤掉明显的UI控制元素和静态元素
            const isUIControl = /\b(btn|button|icon|control|menu|nav|header|footer|toolbar)\b/i.test(classStats.className);
            const isListElement = /\b(item|list|feed|post|card|entry|row|tile|vue-recycle-scroller)\b/i.test(classStats.className);
            const isContentElement = /\b(content|text|title|body|desc|info|detail|main)\b/i.test(classStats.className);
            
            // 特别关注列表相关的class名
            if (isListElement) changeScore *= 2.0; // 列表元素大幅加分
            if (isContentElement) changeScore *= 1.5; // 内容元素加分
            if (isUIControl) changeScore *= 0.2; // UI控制元素大幅减分
            
            console.log(`🔬 动态列表模式分析 ${classStats.className}:`, {
                totalCount: classStats.totalCount,
                uniqueContainers: uniqueContainers,
                appearanceRate: (appearanceRate * 100).toFixed(1) + '%',
                classPersistence: (dynamicListPattern.classPersistence * 100).toFixed(1) + '%',
                instanceChangeRate: (instanceChangeRate * 100).toFixed(1) + '%',
                contentQuality: contentQuality.toFixed(2),
                changeScore: Math.round(changeScore),
                isListElement: isListElement,
                isContentElement: isContentElement,
                isUIControl: isUIControl,
                uniqueContentFingerprints: classStats.contentFingerprints.size
            });
            
            // 选择符合动态列表模式的元素
            if (changeScore > 30 && classStats.totalCount >= 2 && dynamicListPattern.classPersistence > 0.5) {
                changingElements.push({
                    className: classStats.className,
                    elements: Array.from(classStats.elements),
                    changeScore: changeScore,
                    classPersistence: dynamicListPattern.classPersistence,
                    instanceChangeRate: instanceChangeRate,
                    appearanceRate: appearanceRate,
                    isListElement: isListElement,
                    isContentElement: isContentElement,
                    uniqueContentCount: classStats.contentFingerprints.size,
                    dynamicListPattern: dynamicListPattern
                });
            }
        });
        
        // 按变化分数排序
        changingElements.sort((a, b) => b.changeScore - a.changeScore);
        
        console.log(`🎯 发现 ${changingElements.length} 个动态列表元素:`, 
            changingElements.slice(0, 5).map(ce => ({
                className: ce.className,
                elements: ce.elements.length,
                changeScore: Math.round(ce.changeScore),
                classPersistence: (ce.classPersistence * 100).toFixed(1) + '%',
                instanceChangeRate: (ce.instanceChangeRate * 100).toFixed(1) + '%',
                isListElement: ce.isListElement
            }))
        );
        
        return changingElements.slice(0, 10); // 返回前10个最佳的动态列表元素
    }

    // 检查是否符合动态列表模式：类名持续存在 + 实例不断变化
    checkDynamicListPattern(classStats) {
        if (!this.scrollHistory || this.scrollHistory.length === 0) {
            return { classPersistence: 0.5, instanceVariation: 0.5 };
        }
        
        let classAppearanceCount = 0;
        let totalInstanceCount = 0;
        let uniqueXPathCount = classStats.xpaths.size;
        
        // 检查该class在三次滚动中的出现情况
        this.scrollHistory.forEach(historyEntry => {
            let foundInThisScroll = false;
            let instanceCountInThisScroll = 0;
            
            historyEntry.elements.forEach(elementInfo => {
                const element = elementInfo.element;
                const allDescendants = element.querySelectorAll(`*`);
                
                Array.from(allDescendants).forEach(descendant => {
                    const descendantClassName = this.getElementClassName(descendant);
                    if (descendantClassName && descendantClassName.includes(classStats.className)) {
                        foundInThisScroll = true;
                        instanceCountInThisScroll++;
                        totalInstanceCount++;
                    }
                });
            });
            
            if (foundInThisScroll) {
                classAppearanceCount++;
            }
        });
        
        // 类名持续性：类名在三次滚动中出现的比例
        const classPersistence = classAppearanceCount / this.scrollHistory.length;
        
        // 实例变化性：XPath数量与总实例数量的比例（越接近1表示实例变化越大）
        const instanceVariation = totalInstanceCount > 0 ? 
            Math.min(uniqueXPathCount / totalInstanceCount, 1) : 0;
        
        return {
            classPersistence: classPersistence,
            instanceVariation: instanceVariation,
            classAppearanceCount: classAppearanceCount,
            totalInstanceCount: totalInstanceCount,
            uniqueXPathCount: uniqueXPathCount
        };
    }

    // 计算实例变化率
    calculateInstanceChangeRate(className) {
        if (!this.scrollHistory || this.scrollHistory.length === 0) {
            return 0.5; // 默认中等变化率
        }
        
        const scrollInstances = [];
        
        // 收集每次滚动中该class的实例信息
        this.scrollHistory.forEach((historyEntry, scrollIndex) => {
            const instancesInThisScroll = new Set();
            
            historyEntry.elements.forEach(elementInfo => {
                const element = elementInfo.element;
                const matchingElements = element.querySelectorAll(`*`);
                
                Array.from(matchingElements).forEach(matchingElement => {
                    const matchingClassName = this.getElementClassName(matchingElement);
                    if (matchingClassName && matchingClassName.includes(className)) {
                        // 生成实例指纹（位置+内容）
                        const instanceFingerprint = this.generateInstanceFingerprint(matchingElement);
                        instancesInThisScroll.add(instanceFingerprint);
                    }
                });
            });
            
            scrollInstances.push({
                scrollIndex: scrollIndex,
                instances: instancesInThisScroll
            });
        });
        
        // 计算实例变化率
        if (scrollInstances.length < 2) return 0;
        
        let totalInstancesAcrossScrolls = 0;
        let uniqueInstancesAcrossScrolls = new Set();
        
        scrollInstances.forEach(scrollData => {
            totalInstancesAcrossScrolls += scrollData.instances.size;
            scrollData.instances.forEach(instance => {
                uniqueInstancesAcrossScrolls.add(instance);
            });
        });
        
        // 实例变化率 = 唯一实例数 / 总实例数（越大表示变化越多）
        const instanceChangeRate = totalInstancesAcrossScrolls > 0 ? 
            uniqueInstancesAcrossScrolls.size / totalInstancesAcrossScrolls : 0;
        
        return Math.min(instanceChangeRate, 1);
    }

    // 生成内容指纹
    generateContentFingerprint(element) {
        const text = element.textContent?.trim().substring(0, 50) || '';
        const tagName = element.tagName.toLowerCase();
        const hasImage = element.querySelector('img') !== null;
        const hasLink = element.querySelector('a') !== null;
        
        return `${tagName}:${text}:${hasImage}:${hasLink}`;
    }

    // 生成实例指纹（位置+内容）
    generateInstanceFingerprint(element) {
        const rect = element.getBoundingClientRect();
        const contentFingerprint = this.generateContentFingerprint(element);
        const positionFingerprint = `${Math.round(rect.top)}:${Math.round(rect.left)}`;
        
        return `${positionFingerprint}|${contentFingerprint}`;
    }

    // 计算内部元素class的保存率（基于滚动历史）
    calculateInternalClassRetentionRate(className) {
        if (!this.scrollHistory || this.scrollHistory.length === 0) {
            return 0.5; // 默认中等保存率
        }
        
        let appearanceCount = 0;
        
        // 检查该class在三次滚动中的出现情况
        this.scrollHistory.forEach(historyEntry => {
            // 在当前滚动的所有元素中查找该class
            const hasClass = historyEntry.elements.some(elementInfo => {
                const element = elementInfo.element;
                const allDescendants = element.querySelectorAll('*');
                
                return Array.from(allDescendants).some(descendant => {
                    const descendantClassName = this.getElementClassName(descendant);
                    return descendantClassName && descendantClassName.includes(className);
                });
            });
            
            if (hasClass) {
                appearanceCount++;
            }
        });
        
        return appearanceCount / this.scrollHistory.length;
    }

    // 选择主要类名（最具体的）
    selectPrimaryClassName(classes) {
        if (classes.length === 1) return classes[0];
        
        // 优先选择包含特定关键词的类名
        const contentKeywords = ['feed', 'item', 'post', 'card', 'content', 'article'];
        for (const cls of classes) {
            for (const keyword of contentKeywords) {
                if (cls.toLowerCase().includes(keyword)) {
                    return cls;
                }
            }
        }
        
        // 否则选择最长的类名（通常更具体）
        return classes.reduce((longest, current) => 
            current.length > longest.length ? current : longest
        );
    }

    // 计算类名在三次滚动中的保存率
    calculateClassRetentionRate(className, container) {
        // 基于真实的三次滚动历史数据计算保存率
        if (!this.scrollHistory || this.scrollHistory.length === 0) {
            // 回退到简化计算
            const elements = container.querySelectorAll(`.${className}`);
            const totalChildren = container.children.length;
            return totalChildren === 0 ? 0 : Math.min(elements.length / totalChildren, 1);
        }
        
        // 分析该类名在三次滚动中的出现情况
        let appearanceCount = 0;
        let totalAppearances = 0;
        const classXPaths = new Set(); // 收集该类名的所有XPath
        
        this.scrollHistory.forEach(historyEntry => {
            const classData = historyEntry.classDistribution[className];
            if (classData) {
                appearanceCount++;
                totalAppearances += classData.count;
                // 收集所有XPath
                classData.xpaths.forEach(xpath => classXPaths.add(xpath));
            }
        });
        
        // 计算保存率
        // 1. 基础保存率：该类在三次滚动中出现的比例
        const basicRetentionRate = appearanceCount / this.scrollHistory.length;
        
        // 2. XPath稳定性：检查XPath的重复程度
        let totalXPathCount = 0;
        let uniqueXPathCount = classXPaths.size;
        
        this.scrollHistory.forEach(historyEntry => {
            const classData = historyEntry.classDistribution[className];
            if (classData) {
                totalXPathCount += classData.xpaths.size;
            }
        });
        
        // XPath保存率：重复的XPath比例越高，说明是静态内容（广告）
        const xpathRetentionRate = uniqueXPathCount > 0 ? (totalXPathCount - uniqueXPathCount) / totalXPathCount : 0;
        
        // 综合保存率：基础保存率 + XPath稳定性
        const finalRetentionRate = (basicRetentionRate * 0.6) + (xpathRetentionRate * 0.4);
        
        console.log(`📊 类名保存率分析 ${className}:`, {
            出现次数: appearanceCount,
            总滚动次数: this.scrollHistory.length,
            基础保存率: (basicRetentionRate * 100).toFixed(1) + '%',
            唯一XPath数: uniqueXPathCount,
            总XPath数: totalXPathCount,
            XPath保存率: (xpathRetentionRate * 100).toFixed(1) + '%',
            最终保存率: (finalRetentionRate * 100).toFixed(1) + '%'
        });
        
        return Math.min(finalRetentionRate, 1);
    }

    // 分析子元素内容质量
    analyzeChildContentQuality(elements) {
        if (elements.length === 0) return 0;
        
        let qualityScore = 0;
        const sampleSize = Math.min(3, elements.length);
        
        for (let i = 0; i < sampleSize; i++) {
            const stats = this.analyzeElementContent(elements[i]);
            
            if (stats.hasText) qualityScore += 0.2;
            if (stats.hasLinks) qualityScore += 0.3;
            if (stats.hasImages) qualityScore += 0.3;
            if (stats.hasVideos) qualityScore += 0.2;
        }
        
        return qualityScore / sampleSize;
    }

    // 检查是否可能是广告
    isLikelyAdvertisement(className) {
        const adKeywords = ['ad', 'ads', 'banner', 'sponsor', 'promo', 'commercial'];
        const lowerClassName = className.toLowerCase();
        
        return adKeywords.some(keyword => lowerClassName.includes(keyword));
    }

    // 过滤嵌套容器，只保留最外层的根容器
    filterNestedContainers(containers) {
        if (containers.length <= 1) return containers;
        
        const filtered = [];
        
        console.log(`🔍 开始过滤 ${containers.length} 个容器的嵌套关系...`);
        
        for (let i = 0; i < containers.length; i++) {
            const currentContainer = containers[i];
            let isNested = false;
            
            // 检查当前容器是否被其他容器包含
            for (let j = 0; j < containers.length; j++) {
                if (i === j) continue;
                
                const otherContainer = containers[j];
                
                // 检查当前容器是否是其他容器的子容器
                const isContainedByOther = this.isContainerNested(currentContainer.container, otherContainer.container);
                
                if (isContainedByOther) {
                    console.log(`🔗 检测到嵌套容器: ${currentContainer.className} 被 ${otherContainer.className} 包含`);
                    isNested = true;
                    break;
                }
            }
            
            // 如果不是嵌套的，保留这个容器
            if (!isNested) {
                filtered.push(currentContainer);
                console.log(`✅ 保留根容器: ${currentContainer.className} (子元素: ${currentContainer.childElements.length})`);
            } else {
                console.log(`❌ 过滤嵌套容器: ${currentContainer.className}`);
            }
        }
        
        console.log(`🎯 嵌套过滤完成: ${containers.length} -> ${filtered.length} 个容器`);
        return filtered;
    }

    // 检查容器是否被嵌套在另一个容器内
    isContainerNested(childContainer, parentContainer) {
        // 使用DOM的contains方法检查包含关系
        if (parentContainer.contains(childContainer) && parentContainer !== childContainer) {
            return true;
        }
        return false;
    }

    // 6. 高亮具体的内部变化元素
    highlightBestContainers(containers) {
        this.clearObservedElements();
        
        containers.forEach((containerInfo, containerIndex) => {
            const dynamicChildClasses = containerInfo.dynamicChildClasses || [];
            
            // 高亮每个动态子容器类内部的具体变化元素
            dynamicChildClasses.forEach((childClass, classIndex) => {
                const changingInternalElements = childClass.changingInternalElements || [];
                
                console.log(`🎨 高亮动态子容器 ${childClass.className} 内部的 ${changingInternalElements.length} 个变化元素`);
                
                // 优先高亮内部变化元素
                if (changingInternalElements.length > 0) {
                    changingInternalElements.forEach((changingElement, changeIndex) => {
                        const elementsToHighlight = changingElement.elements.slice(0, Math.min(10, changingElement.elements.length));
                        
                        console.log(`  📍 高亮变化元素: ${changingElement.className} (${elementsToHighlight.length}个实例)`);
                        
                        elementsToHighlight.forEach((element, elementIndex) => {
                            // 高亮具体的变化元素
                            element.style.outline = '2px solid #00ff88';
                            element.style.backgroundColor = 'rgba(0, 255, 136, 0.15)';
                            element.style.position = 'relative';
                            element.style.boxShadow = '0 1px 6px rgba(0, 255, 136, 0.4)';
                            
                            // 创建动态列表元素标签
                            const label = document.createElement('div');
                            const classPersistenceDisplay = (changingElement.classPersistence * 100).toFixed(1) + '%';
                            const instanceChangeDisplay = (changingElement.instanceChangeRate * 100).toFixed(1) + '%';
                            const changeScoreDisplay = Math.round(changingElement.changeScore);
                            
                            // 判断是否为列表元素
                            const elementTypeIcon = changingElement.isListElement ? '📋' : 
                                                   changingElement.isContentElement ? '📝' : '🎯';
                            
                            label.innerHTML = `
                                <div style="font-weight: bold;">${elementTypeIcon} 动态列表元素 ${containerIndex + 1}-${classIndex + 1}-${changeIndex + 1}</div>
                                <div style="font-size: 9px;">${changingElement.className.substring(0, 18)}...</div>
                                <div style="font-size: 9px;">类名持续: ${classPersistenceDisplay} | 实例变化: ${instanceChangeDisplay}</div>
                                <div style="font-size: 9px;">评分: ${changeScoreDisplay} (${elementIndex + 1}/${elementsToHighlight.length})</div>
                            `;
                            
                            // 根据元素类型和分数调整标签颜色
                            let backgroundColor = '#00ff88'; // 默认绿色
                            let borderColor = '#00cc6a';
                            
                            // 列表元素特殊标识（最高优先级）
                            if (changingElement.isListElement) {
                                backgroundColor = '#ff6b35'; // 橙色 - 列表元素
                                borderColor = '#e63946';
                            } else if (changingElement.isContentElement) {
                                backgroundColor = '#6f42c1'; // 紫色 - 内容元素
                                borderColor = '#5a2d91';
                            } else if (changingElement.changeScore > 60) {
                                backgroundColor = '#ffc107'; // 黄色 - 高分通用元素
                                borderColor = '#e0a800';
                            }
                            
                            // 特别标识vue-recycle-scroller相关元素
                            if (changingElement.className.includes('vue-recycle-scroller')) {
                                backgroundColor = '#dc3545'; // 红色 - Vue虚拟滚动组件
                                borderColor = '#c82333';
                            }
                            
                            label.style.cssText = `
                                position: absolute !important;
                                top: -75px !important;
                                left: 0 !important;
                                background: linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}dd) !important;
                                color: white !important;
                                padding: 4px 6px !important;
                                border-radius: 4px !important;
                                font-size: 9px !important;
                                font-weight: bold !important;
                                z-index: 9999 !important;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
                                min-width: 110px !important;
                                text-align: center !important;
                                border: 1px solid ${borderColor} !important;
                            `;
                            
                            element.appendChild(label);
                            this.observedElements.push({element, label});
                        });
                    });
                } else {
                    // 如果没有找到内部变化元素，则高亮容器元素
                    const elementsToHighlight = childClass.elements.slice(0, Math.min(3, childClass.elements.length));
                    
                    console.log(`  ⚠️ 未找到内部变化元素，高亮容器: ${childClass.className}`);
                    
                    elementsToHighlight.forEach((element, elementIndex) => {
                        // 高亮容器元素（虚线边框表示需要进一步分析）
                        element.style.outline = '2px dashed #ffc107';
                        element.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                        element.style.position = 'relative';
                        element.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)';
                        
                        const label = document.createElement('div');
                        const retentionDisplay = (childClass.retentionRate * 100).toFixed(1) + '%';
                        
                        label.innerHTML = `
                            <div style="font-weight: bold;">⚠️ 容器元素 ${containerIndex + 1}-${classIndex + 1}</div>
                            <div style="font-size: 9px;">${childClass.className.substring(0, 18)}...</div>
                            <div style="font-size: 10px;">保存率: ${retentionDisplay}</div>
                            <div style="font-size: 9px;">需分析内部元素 (${elementIndex + 1}/${elementsToHighlight.length})</div>
                        `;
                        
                        label.style.cssText = `
                            position: absolute !important;
                            top: -75px !important;
                            left: 0 !important;
                            background: linear-gradient(135deg, #ffc107, #e0a800) !important;
                            color: white !important;
                            padding: 6px 8px !important;
                            border-radius: 6px !important;
                            font-size: 10px !important;
                            font-weight: bold !important;
                            z-index: 9999 !important;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                            min-width: 120px !important;
                            text-align: center !important;
                            border: 2px solid #e0a800 !important;
                        `;
                        
                        element.appendChild(label);
                        this.observedElements.push({element, label});
                    });
                }
            });
            
            // 如果没有找到任何动态子容器，则高亮父容器
            if (dynamicChildClasses.length === 0) {
                const container = containerInfo.container;
                container.style.outline = '3px dashed #dc3545';
                container.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                container.style.position = 'relative';
                
                const label = document.createElement('div');
                label.innerHTML = `
                    <div style="font-weight: bold;">⚠️ 父容器 ${containerIndex + 1}</div>
                    <div style="font-size: 9px;">${containerInfo.className.substring(0, 20)}...</div>
                    <div style="font-size: 10px;">需要进一步分析子容器</div>
                `;
                
                label.style.cssText = `
                    position: absolute !important;
                    top: -60px !important;
                    left: 0 !important;
                    background: linear-gradient(135deg, #dc3545, #c82333) !important;
                    color: white !important;
                    padding: 6px 8px !important;
                    border-radius: 6px !important;
                    font-size: 10px !important;
                    font-weight: bold !important;
                    z-index: 9999 !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                    min-width: 100px !important;
                    text-align: center !important;
                `;
                
                container.appendChild(label);
                this.observedElements.push({element: container, label});
            }
        });
    }

    // 7. 显示XPath观察结果
    showXPathObservationResults(containers, persistenceStats = null) {
        if (containers.length === 0) {
            this.showNotification('未发现符合条件的动态容器 🤔', 'warning');
            return;
        }
        
        const bestContainer = containers[0];
        const dynamicChildClasses = bestContainer.dynamicChildClasses || [];
        
        let message = `🎯 发现动态列表元素!\n`;
        message += `📦 父容器: ${bestContainer.className.substring(0, 25)}\n`;
        
        if (dynamicChildClasses.length > 0) {
            const bestChildClass = dynamicChildClasses[0];
            const changingInternalElements = bestChildClass.changingInternalElements || [];
            
            message += `🧩 动态子容器: ${bestChildClass.className.substring(0, 20)}\n`;
            message += `   📊 容器数量: ${bestChildClass.elements.length} 个\n`;
            message += `   🔄 容器保存率: ${(bestChildClass.retentionRate * 100).toFixed(1)}%\n`;
            
            // 显示内部动态列表元素信息
            if (changingInternalElements.length > 0) {
                message += `\n📋 动态列表元素: ${changingInternalElements.length} 个\n`;
                
                // 显示最佳的动态列表元素
                const bestChangingElement = changingInternalElements[0];
                message += `   🏆 最佳: ${bestChangingElement.className.substring(0, 18)}\n`;
                message += `   📈 变化评分: ${Math.round(bestChangingElement.changeScore)} 分\n`;
                message += `   🔄 类名持续性: ${(bestChangingElement.classPersistence * 100).toFixed(1)}%\n`;
                message += `   🎭 实例变化率: ${(bestChangingElement.instanceChangeRate * 100).toFixed(1)}%\n`;
                message += `   📍 出现率: ${(bestChangingElement.appearanceRate * 100).toFixed(1)}%\n`;
                
                // 显示元素类型
                if (bestChangingElement.isListElement) {
                    message += `   📋 列表元素 ✓\n`;
                } else if (bestChangingElement.isContentElement) {
                    message += `   📝 内容元素 ✓\n`;
                }
                
                // 特别标识vue-recycle-scroller
                if (bestChangingElement.className.includes('vue-recycle-scroller')) {
                    message += `   🔧 Vue虚拟滚动组件 ✓\n`;
                }
                
                // 统计变化元素总数
                const totalChangingElements = changingInternalElements.reduce((sum, ce) => sum + ce.elements.length, 0);
                message += `   🔢 列表元素实例总数: ${totalChangingElements} 个\n`;
                
                // 显示内容多样性
                if (bestChangingElement.uniqueContentCount) {
                    message += `   🎨 内容种类: ${bestChangingElement.uniqueContentCount} 种\n`;
                }
            } else {
                message += `\n⚠️ 未发现动态列表元素\n`;
                message += `   📊 容器评分: ${Math.round(bestChildClass.score)} 分\n`;
            }
            
            // 显示广告过滤信息
            const filteredCount = Object.keys(bestContainer.dynamicChildClasses).length - dynamicChildClasses.length;
            if (filteredCount > 0) {
                message += `\n🚫 过滤广告容器: ${filteredCount} 个\n`;
            }
        } else {
            message += `⚠️ 未找到明确的子容器类\n`;
            message += `🔢 总子元素: ${bestContainer.childElements.length} 个\n`;
        }
        
        message += `📏 层级深度: ${bestContainer.depth}\n`;
        
        if (persistenceStats) {
            message += `\n📈 持续性分析:\n`;
            message += `   发现总元素: ${persistenceStats.总元素} 个\n`;
            message += `   持续存在: ${persistenceStats.持续元素} 个\n`;
            message += `   过滤临时元素: ${persistenceStats.过滤比例}\n`;
        }
        
        const hasChangingElements = dynamicChildClasses.length > 0 && 
                                   dynamicChildClasses.some(dc => dc.changingInternalElements?.length > 0);
        const messageType = hasChangingElements ? 'success' : 'warning';
        this.showNotification(message, messageType);
        
        console.log('🎯 XPath内部变化元素检测结果详情:', {
            containers: containers.map(c => ({
                className: c.className,
                xpath: c.xpath,
                childElements: c.childElements.length,
                dynamicChildClasses: c.dynamicChildClasses?.map(dc => ({
                    className: dc.className,
                    containerCount: dc.elements.length,
                    retentionRate: (dc.retentionRate * 100).toFixed(1) + '%',
                    score: Math.round(dc.score),
                    changingInternalElements: dc.changingInternalElements?.map(cie => ({
                        className: cie.className,
                        elementCount: cie.elements.length,
                        changeScore: Math.round(cie.changeScore),
                        retentionRate: (cie.retentionRate * 100).toFixed(1) + '%',
                        appearanceRate: (cie.appearanceRate * 100).toFixed(1) + '%',
                        isContentElement: cie.isContentElement
                    })) || []
                })) || [],
                score: c.score,
                depth: c.depth
            })),
            persistenceStats: persistenceStats
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        
        // 支持多行消息
        if (message.includes('\n')) {
            notification.innerHTML = message.split('\n').map(line => 
                `<div style="margin: 2px 0;">${line}</div>`
            ).join('');
        } else {
            notification.textContent = message;
        }
        
        const colors = {
            'info': '#6f42c1',
            'success': '#28a745', 
            'warning': '#ffc107',
            'error': '#dc3545'
        };
        
        notification.style.cssText = `
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            background: white !important;
            border-radius: 8px !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
            padding: 16px 20px !important;
            font-size: 14px !important;
            z-index: 99999999 !important;
            max-width: 350px !important;
            min-width: 200px !important;
            border-left: 4px solid ${colors[type] || colors.info} !important;
            font-family: Arial, sans-serif !important;
            line-height: 1.4 !important;
            animation: slideInRight 0.3s ease-out !important;
        `;
        
        document.body.appendChild(notification);
        
        // 根据消息长度调整显示时间
        const displayTime = Math.max(3000, message.length * 50);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, displayTime);
        
        // 添加CSS动画
        if (!document.getElementById('webmonkey-animations')) {
            const style = document.createElement('style');
            style.id = 'webmonkey-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 直接检测真正的动态列表元素 - 基于"类名持续存在+元素实例不断变化"模式
    findTrueDynamicListElements(persistentElements) {
        console.log('🔍 开始直接检测动态列表元素...');
        
        // 1. 分析所有持续存在元素的子元素，按类名分组
        const classElementGroups = {};
        
        persistentElements.forEach(elementInfo => {
            const element = elementInfo.element;
            const allDescendants = element.querySelectorAll('*[class]');
            
            Array.from(allDescendants).forEach(descendant => {
                const className = this.getElementClassName(descendant);
                if (className && className.trim()) {
                    const classes = className.trim().split(/\s+/);
                    
                    classes.forEach(cls => {
                        if (cls && !cls.startsWith('wao-') && !cls.startsWith('webmonkey-') && cls.length > 2) {
                            if (!classElementGroups[cls]) {
                                classElementGroups[cls] = {
                                    className: cls,
                                    elements: new Set(),
                                    containers: new Set(),
                                    scrollHistoryElements: [] // 三次滚动中出现的元素
                                };
                            }
                            
                            classElementGroups[cls].elements.add(descendant);
                            classElementGroups[cls].containers.add(element);
                        }
                    });
                }
            });
        });
        
        // 2. 检查每个类名的动态列表特征
        const candidateDynamicClasses = [];
        
        Object.values(classElementGroups).forEach(classGroup => {
            // 检查该类名是否在三次滚动历史中都出现过（类名持续性）
            const classPersistence = this.checkClassPersistenceInScrollHistory(classGroup.className);
            
            // 计算实例变化率（同一类名下的具体元素实例在变化）
            const instanceChangeRate = this.calculateInstanceVariationRate(classGroup.className);
            
            // 分析内容特征
            const contentQuality = this.analyzeElementContentQuality(Array.from(classGroup.elements).slice(0, 5));
            
            // 检查是否符合列表元素特征
            const isListElement = this.checkIfListElement(classGroup.className, Array.from(classGroup.elements));
            
            // 计算动态评分
            let dynamicScore = 0;
            dynamicScore += classPersistence * 50; // 类名持续性权重最高
            dynamicScore += instanceChangeRate * 40; // 实例变化性权重次高
            dynamicScore += contentQuality * 10; // 内容质量
            
            // 列表元素加分
            if (isListElement) {
                dynamicScore += 20;
            }
            
            // 过滤掉明显的控制元素
            const isControlElement = /\b(btn|button|icon|control|menu|nav|header|footer|toolbar|sidebar)\b/i.test(classGroup.className);
            
            console.log(`📊 类名分析: ${classGroup.className}`, {
                元素数量: classGroup.elements.size,
                容器数量: classGroup.containers.size,
                类名持续性: (classPersistence * 100).toFixed(1) + '%',
                实例变化率: (instanceChangeRate * 100).toFixed(1) + '%',
                内容质量: contentQuality.toFixed(1),
                是否列表元素: isListElement,
                是否控制元素: isControlElement,
                动态评分: Math.round(dynamicScore)
            });
            
            // 筛选条件：高动态评分 + 非控制元素 + 足够数量的元素
            if (dynamicScore >= 60 && !isControlElement && classGroup.elements.size >= 3) {
                candidateDynamicClasses.push({
                    ...classGroup,
                    classPersistence,
                    instanceChangeRate,
                    contentQuality,
                    isListElement,
                    dynamicScore
                });
            }
        });
        
        // 3. 按动态评分排序，返回最佳的动态列表元素
        candidateDynamicClasses.sort((a, b) => b.dynamicScore - a.dynamicScore);
        
        console.log(`✅ 发现 ${candidateDynamicClasses.length} 个动态列表元素类:`, 
            candidateDynamicClasses.map(c => ({
                className: c.className,
                elements: c.elements.size,
                score: Math.round(c.dynamicScore),
                persistence: (c.classPersistence * 100).toFixed(1) + '%',
                variation: (c.instanceChangeRate * 100).toFixed(1) + '%'
            }))
        );
        
        return candidateDynamicClasses.slice(0, 3); // 返回前3个最佳的
    }

    // 检查类名在滚动历史中的持续性
    checkClassPersistenceInScrollHistory(className) {
        if (!this.scrollHistory || this.scrollHistory.length === 0) {
            return 0.5; // 默认值
        }
        
        let appearanceCount = 0;
        
        this.scrollHistory.forEach(historyEntry => {
            let foundInThisScroll = false;
            
            historyEntry.elements.forEach(elementInfo => {
                const element = elementInfo.element;
                const descendantsWithClass = element.querySelectorAll(`*[class*="${className}"]`);
                
                if (descendantsWithClass.length > 0) {
                    foundInThisScroll = true;
                }
            });
            
            if (foundInThisScroll) {
                appearanceCount++;
            }
        });
        
        return appearanceCount / this.scrollHistory.length;
    }

    // 计算同一类名下元素实例的变化率
    calculateInstanceVariationRate(className) {
        if (!this.scrollHistory || this.scrollHistory.length < 2) {
            return 0.5; // 默认值
        }
        
        const instanceSets = [];
        
        // 收集每次滚动中该类名的所有元素实例的XPath
        this.scrollHistory.forEach(historyEntry => {
            const instanceXPaths = new Set();
            
            historyEntry.elements.forEach(elementInfo => {
                const element = elementInfo.element;
                const descendantsWithClass = element.querySelectorAll(`*[class*="${className}"]`);
                
                Array.from(descendantsWithClass).forEach(descendant => {
                    const xpath = this.getElementXPath(descendant);
                    instanceXPaths.add(xpath);
                });
            });
            
            instanceSets.push(instanceXPaths);
        });
        
        // 计算相邻滚动间的元素实例变化率
        let totalChanges = 0;
        let comparisons = 0;
        
        for (let i = 1; i < instanceSets.length; i++) {
            const prevSet = instanceSets[i - 1];
            const currentSet = instanceSets[i];
            
            const intersection = new Set([...prevSet].filter(x => currentSet.has(x)));
            const union = new Set([...prevSet, ...currentSet]);
            
            if (union.size > 0) {
                const changeRate = 1 - (intersection.size / union.size);
                totalChanges += changeRate;
                comparisons++;
            }
        }
        
        return comparisons > 0 ? totalChanges / comparisons : 0.5;
    }

    // 检查是否为列表元素
    checkIfListElement(className, elements) {
        // 检查类名是否包含列表相关关键词
        const listKeywords = ['item', 'list', 'card', 'post', 'article', 'entry', 'row', 'cell', 'scroller'];
        const hasListKeyword = listKeywords.some(keyword => className.toLowerCase().includes(keyword));
        
        if (hasListKeyword) {
            return true;
        }
        
        // 检查元素内容是否具有列表特征（链接、图片、文本结构）
        let listContentCount = 0;
        
        elements.slice(0, 3).forEach(element => {
            const links = element.querySelectorAll('a');
            const images = element.querySelectorAll('img');
            const texts = element.querySelectorAll('*').length;
            
            if (links.length >= 1 && texts >= 3) {
                listContentCount++;
            }
        });
        
        return listContentCount >= 2; // 至少2个元素具有列表特征
    }

    // 分析元素内容质量
    analyzeElementContentQuality(elements) {
        let totalScore = 0;
        
        elements.forEach(element => {
            let score = 0;
            
            // 文本内容
            const textLength = element.textContent?.trim().length || 0;
            if (textLength > 10) score += 2;
            if (textLength > 50) score += 2;
            
            // 链接数量
            const links = element.querySelectorAll('a');
            score += Math.min(links.length, 3) * 2;
            
            // 图片数量
            const images = element.querySelectorAll('img');
            score += Math.min(images.length, 2) * 1;
            
            // 视频
            const videos = element.querySelectorAll('video');
            score += videos.length * 3;
            
            totalScore += score;
        });
        
        return elements.length > 0 ? totalScore / elements.length : 0;
    }

    // 高亮动态列表元素 - 使用不同颜色区分多个类
    highlightDynamicListElements(dynamicListElements) {
        this.clearObservedElements();
        
        console.log(`🎨 开始高亮 ${dynamicListElements.length} 个动态列表元素类`);
        
        // 预定义颜色方案 - 为不同的类分配不同颜色
        const colorSchemes = [
            { border: '#ff4757', bg: 'rgba(255, 71, 87, 0.15)', name: '红色', emoji: '🔴' },      // 红色 - 最高优先级
            { border: '#2ed573', bg: 'rgba(46, 213, 115, 0.15)', name: '绿色', emoji: '🟢' },    // 绿色 - 第二优先级
            { border: '#3742fa', bg: 'rgba(55, 66, 250, 0.15)', name: '蓝色', emoji: '🔵' },     // 蓝色 - 第三优先级
            { border: '#ffa502', bg: 'rgba(255, 165, 2, 0.15)', name: '橙色', emoji: '🟠' },     // 橙色 - 第四优先级
            { border: '#a55eea', bg: 'rgba(165, 94, 234, 0.15)', name: '紫色', emoji: '🟣' },    // 紫色 - 第五优先级
            { border: '#26de81', bg: 'rgba(38, 222, 129, 0.15)', name: '青色', emoji: '🟡' },    // 青色 - 第六优先级
            { border: '#fd79a8', bg: 'rgba(253, 121, 168, 0.15)', name: '粉色', emoji: '🩷' },   // 粉色 - 第七优先级
            { border: '#fdcb6e', bg: 'rgba(253, 203, 110, 0.15)', name: '黄色', emoji: '🟨' },   // 黄色 - 第八优先级
        ];
        
        dynamicListElements.forEach((dynamicClass, classIndex) => {
            const elementsToHighlight = Array.from(dynamicClass.elements).slice(0, 10);
            
            // 为每个类分配不同的颜色（循环使用颜色方案）
            const colorScheme = colorSchemes[classIndex % colorSchemes.length];
            
            console.log(`  📍 高亮第 ${classIndex + 1} 个动态类: ${dynamicClass.className} (${elementsToHighlight.length}个实例) - 使用${colorScheme.name}${colorScheme.emoji}`);
            
            elementsToHighlight.forEach((element, elementIndex) => {
                // 使用分配的颜色方案
                element.style.outline = `3px solid ${colorScheme.border}`;
                element.style.backgroundColor = colorScheme.bg;
                element.style.position = 'relative';
                element.style.boxShadow = `0 2px 8px ${colorScheme.border}40`;
                
                // 创建标签
                const label = document.createElement('div');
                
                // 根据类型和优先级选择图标
                let typeIcon = '🎯';
                if (dynamicClass.isListElement) {
                    typeIcon = '📋';
                } else if (dynamicClass.className.includes('vue-recycle-scroller')) {
                    typeIcon = '🔧';
                } else if (dynamicClass.className.includes('item')) {
                    typeIcon = '📄';
                }
                
                label.innerHTML = `
                    <div style="font-weight: bold;">${colorScheme.emoji} ${typeIcon} 动态列表 ${classIndex + 1}-${elementIndex + 1}</div>
                    <div style="font-size: 10px;">${dynamicClass.className.length > 25 ? dynamicClass.className.substring(0, 25) + '...' : dynamicClass.className}</div>
                    <div style="font-size: 9px;">持续性: ${(dynamicClass.classPersistence * 100).toFixed(1)}% | 变化率: ${(dynamicClass.instanceChangeRate * 100).toFixed(1)}%</div>
                    <div style="font-size: 9px;">评分: ${Math.round(dynamicClass.dynamicScore)} ${dynamicClass.isListElement ? '📋列表' : '📝内容'}</div>
                `;
                
                label.style.cssText = `
                    position: absolute !important;
                    top: -30px !important;
                    left: 0 !important;
                    background: ${colorScheme.border} !important;
                    color: white !important;
                    padding: 5px 8px !important;
                    border-radius: 6px !important;
                    font-size: 11px !important;
                    font-family: Arial, sans-serif !important;
                    font-weight: normal !important;
                    line-height: 1.2 !important;
                    z-index: 999999 !important;
                    white-space: nowrap !important;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.4) !important;
                    pointer-events: none !important;
                    max-width: 280px !important;
                    word-wrap: break-word !important;
                    white-space: pre-line !important;
                    border: 2px solid rgba(255,255,255,0.3) !important;
                `;
                
                element.appendChild(label);
                this.observedElements.push({ element, label });
            });
        });
        
        // 显示总结统计
        const totalElements = dynamicListElements.reduce((sum, dc) => sum + dc.elements.size, 0);
        const listElements = dynamicListElements.filter(dc => dc.isListElement).length;
        
        console.log(`✅ 高亮完成: ${totalElements} 个元素实例，${listElements} 个列表类型`);
        console.log(`🎨 颜色分配:`, dynamicListElements.map((dc, idx) => 
            `${colorSchemes[idx % colorSchemes.length].emoji} ${dc.className} (${dc.elements.size}个)`
        ).join(', '));
    }

    // 显示动态列表检测结果
    showDynamicListResults(dynamicListElements, stats) {
        let message = `🎯 动态列表元素检测结果\n\n`;
        
        message += `📊 总体统计:\n`;
        message += `   滚动次数: ${stats.滚动次数} 次\n`;
        message += `   留存类名: ${stats.留存类名数} 个\n`;
        message += `   留存元素: ${stats.留存元素总数} 个\n`;
        message += `   动态列表: ${stats.动态列表元素} 个\n\n`;
        
        if (dynamicListElements.length > 0) {
            const bestElement = dynamicListElements[0];
            message += `🎯 最佳动态列表元素:\n`;
            message += `   📋 类名: ${bestElement.className}\n`;
            message += `   🔢 实例数量: ${bestElement.elements.size} 个\n`;
            message += `   📊 动态评分: ${Math.round(bestElement.dynamicScore)} 分\n`;
            message += `   🔄 类名持续性: ${(bestElement.classPersistence * 100).toFixed(1)}%\n`;
            message += `   🎭 实例变化率: ${(bestElement.instanceChangeRate * 100).toFixed(1)}%\n`;
            message += `   📝 内容质量: ${bestElement.contentQuality.toFixed(1)} 分\n`;
            message += `   ${bestElement.isListElement ? '📋 列表元素 ✓' : '📝 内容元素'}\n`;
            
            if (bestElement.className.includes('vue-recycle-scroller')) {
                message += `   🔧 Vue虚拟滚动组件 ✓\n`;
            }
            
            if (dynamicListElements.length > 1) {
                message += `\n📋 其他发现:\n`;
                const colorEmojis = ['🔴', '🟢', '🔵', '🟠', '🟣', '🟡', '🩷', '🟨'];
                dynamicListElements.slice(1).forEach((element, index) => {
                    const colorEmoji = colorEmojis[(index + 1) % colorEmojis.length];
                    message += `   ${colorEmoji} ${index + 2}. ${element.className} (${element.elements.size}个, ${Math.round(element.dynamicScore)}分)\n`;
                });
            }
        }
        
        this.showNotification(message, 'success');
    }

    // 找出当前视口内完整显示的新元素（不在第一屏记录中的）
    findCompletelyVisibleNewElements(firstScreenElements) {
        const firstScreenXPaths = new Set(firstScreenElements.map(el => el.xpath));
        const completelyVisibleElements = [];
        
        // 获取当前视口尺寸
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const viewportLeft = window.scrollX;
        const viewportRight = viewportLeft + window.innerWidth;
        
        // 扫描页面所有有类名的元素
        const allElementsWithClass = document.querySelectorAll('*[class]');
        
        Array.from(allElementsWithClass).forEach(element => {
            // 跳过插件自己的元素
            const className = this.getElementClassName(element);
            if (!className || className.includes('wao-') || className.includes('webmonkey-')) {
                return;
            }
            
            const xpath = this.getElementXPath(element);
            
            // 跳过第一屏已记录的元素
            if (firstScreenXPaths.has(xpath)) {
                return;
            }
            
            // 检查元素是否完整在视口内
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + window.scrollY;
            const elementBottom = rect.bottom + window.scrollY;
            const elementLeft = rect.left + window.scrollX;
            const elementRight = rect.right + window.scrollX;
            
            // 元素必须完整在视口内（所有边界都在视口范围内）
            const isCompletelyVisible = 
                elementTop >= viewportTop &&
                elementBottom <= viewportBottom &&
                elementLeft >= viewportLeft &&
                elementRight <= viewportRight &&
                rect.width > 0 && rect.height > 0; // 元素必须有实际尺寸
            
            if (isCompletelyVisible) {
                completelyVisibleElements.push({
                    element,
                    xpath,
                    className,
                    rect: {
                        top: elementTop,
                        bottom: elementBottom,
                        left: elementLeft,
                        right: elementRight,
                        width: rect.width,
                        height: rect.height
                    }
                });
            }
        });
        
        return completelyVisibleElements;
    }

    // 按类名分组元素 - 修复元素重复问题
    groupElementsByClass(elements) {
        const classGroups = {};
        
        elements.forEach(elementInfo => {
            const className = elementInfo.className;
            if (className && className.trim()) {
                const classes = className.trim().split(/\s+/);
                
                classes.forEach(cls => {
                    if (cls && cls.length > 2 && !cls.startsWith('wao-') && !cls.startsWith('webmonkey-')) {
                        if (!classGroups[cls]) {
                            classGroups[cls] = {
                                className: cls,
                                elements: [],
                                xpaths: new Set(),
                                elementXPathSet: new Set() // 用于去重
                            };
                        }
                        
                        // 检查是否已经添加过这个元素（基于xpath去重）
                        if (!classGroups[cls].elementXPathSet.has(elementInfo.xpath)) {
                            classGroups[cls].elements.push(elementInfo);
                            classGroups[cls].xpaths.add(elementInfo.xpath);
                            classGroups[cls].elementXPathSet.add(elementInfo.xpath);
                        }
                    }
                });
            }
        });
        
        // 清理临时去重字段并验证去重效果
        Object.values(classGroups).forEach(group => {
            // 验证elements数组长度和xpaths Set大小一致（确保去重正常）
            if (group.elements.length !== group.xpaths.size) {
                console.warn(`⚠️ 类名 ${group.className} 去重异常: elements=${group.elements.length}, xpaths=${group.xpaths.size}`);
            }
            delete group.elementXPathSet;
        });
        
        return classGroups;
    }

    // 检查指定xpath的元素是否还在当前视口中完整可见
    countStillVisibleElements(xpaths) {
        let visibleCount = 0;
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const viewportLeft = window.scrollX;
        const viewportRight = viewportLeft + window.innerWidth;
        
        xpaths.forEach(xpath => {
            try {
                const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const elementTop = rect.top + window.scrollY;
                    const elementBottom = rect.bottom + window.scrollY;
                    const elementLeft = rect.left + window.scrollX;
                    const elementRight = rect.right + window.scrollX;
                    
                    // 检查是否完整在视口内
                    const isCompletelyVisible = 
                        elementTop >= viewportTop &&
                        elementBottom <= viewportBottom &&
                        elementLeft >= viewportLeft &&
                        elementRight <= viewportRight &&
                        rect.width > 0 && rect.height > 0;
                    
                    if (isCompletelyVisible) {
                        visibleCount++;
                    }
                }
            } catch (error) {
                // XPath可能无效，忽略错误
                console.warn('XPath查询失败:', xpath, error);
            }
        });
        
        return visibleCount;
    }

    // 分析最终留存的元素，生成动态列表元素数据
    analyzeFinalRetainedElements(retainedClassGroups) {
        const dynamicListElements = [];
        
        Object.values(retainedClassGroups).forEach(classGroup => {
            // 分析内容质量
            const contentQuality = this.analyzeElementContentQuality(
                classGroup.elements.slice(0, 5).map(ei => ei.element)
            );
            
            // 检查是否为列表元素
            const isListElement = this.checkIfListElement(
                classGroup.className, 
                classGroup.elements.map(ei => ei.element)
            );
            
            // 计算动态评分
            let dynamicScore = 0;
            
            // 基础分：通过了三次滚动留存过滤
            dynamicScore += 50;
            
            // 元素数量分：元素越多分数越高
            dynamicScore += Math.min(classGroup.elements.length, 20) * 2;
            
            // 内容质量分
            dynamicScore += contentQuality * 15;
            
            // 列表元素加分
            if (isListElement) {
                dynamicScore += 25;
            }
            
            // 特殊类名加分（Vue组件等）
            if (classGroup.className.includes('vue-recycle-scroller') || 
                classGroup.className.includes('scroller') ||
                classGroup.className.includes('item')) {
                dynamicScore += 15;
            }
            
            // 过滤掉明显的控制元素
            const isControlElement = /\b(btn|button|icon|control|menu|nav|header|footer|toolbar|sidebar|modal)\b/i.test(classGroup.className);
            
            // 更精确的内容元素识别 - 基于类名模式和元素结构分析
            const isContentElement = this.identifyContentElement(classGroup.className, classGroup.elements);
            
            // 更精确的列表容器识别 - 基于类名和结构模式
            const isListContainer = this.identifyListContainer(classGroup.className, classGroup.elements);
            
            // 调整评分 - 强烈偏好列表容器
            if (isListContainer) {
                dynamicScore += 40; // 列表容器大幅加分
                console.log(`🎯 识别为列表容器，额外加分40分: ${classGroup.className}`);
            }
            
            // 内容元素减分
            if (isContentElement && !isListContainer) {
                dynamicScore -= 25; // 纯内容元素减分
                console.log(`📝 识别为内容元素，减分25分: ${classGroup.className}`);
            }
            
            console.log(`📊 留存类名分析: ${classGroup.className}`, {
                元素数量: classGroup.elements.length,
                内容质量: contentQuality.toFixed(1),
                是否列表元素: isListElement,
                是否列表容器: isListContainer,
                是否内容元素: isContentElement,
                是否控制元素: isControlElement,
                最终动态评分: Math.round(dynamicScore)
            });
            
            // 筛选条件：动态评分 + 非控制元素 + 足够数量的元素
            // 列表容器更低门槛，内容元素更高门槛
            let minScore;
            if (isListContainer) {
                minScore = 60; // 列表容器低门槛
            } else if (isContentElement) {
                minScore = 90; // 内容元素高门槛
            } else {
                minScore = 70; // 一般元素中等门槛
            }
            
            if (dynamicScore >= minScore && !isControlElement && classGroup.elements.length >= 2) {
                dynamicListElements.push({
                    className: classGroup.className,
                    elements: new Set(classGroup.elements.map(ei => ei.element)),
                    elementInfos: classGroup.elements,
                    contentQuality,
                    isListElement,
                    dynamicScore,
                    classPersistence: 1.0, // 通过三次滚动留存，持续性100%
                    instanceChangeRate: 1.0 // 每次滚动都有新实例，变化率100%
                });
            }
        });
        
        // 按动态评分排序
        dynamicListElements.sort((a, b) => b.dynamicScore - a.dynamicScore);
        
        console.log(`✅ 分析留存元素完成，发现 ${dynamicListElements.length} 个动态列表元素类:`, 
            dynamicListElements.map(d => ({
                className: d.className,
                elements: d.elements.size,
                score: Math.round(d.dynamicScore),
                isListElement: d.isListElement
            }))
        );
        
        // 进行父子关系去重分析
        const deduplicatedElements = this.removeDuplicateParentChildElements(dynamicListElements);
        
        return deduplicatedElements.slice(0, 3); // 返回前3个最佳的去重后元素
    }

    // 精确识别内容元素 - 基于类名模式和DOM结构分析
    identifyContentElement(className, elementInfos) {
        // 1. 基于类名的内容元素识别模式
        const contentClassPatterns = [
            /\b(text|content|desc|description|title|label|caption)\b/i,
            /\b(ogText|wbtext|detail|summary|msg|message)\b/i,
            /\b(txt|str|string|words|chars|para|paragraph)\b/i
        ];
        
        const hasContentPattern = contentClassPatterns.some(pattern => pattern.test(className));
        
        // 2. 分析元素的DOM结构特征
        if (elementInfos && elementInfos.length > 0) {
            const sampleElements = elementInfos.slice(0, 3).map(ei => ei.element);
            
            // 检查是否主要包含文本内容而非子元素
            const textOnlyElements = sampleElements.filter(el => {
                const children = el.children;
                const textContent = el.textContent?.trim() || '';
                
                // 文本内容多但子元素少的特征
                return textContent.length > 10 && children.length <= 2;
            });
            
            const hasTextOnlyCharacteristic = textOnlyElements.length / sampleElements.length > 0.6;
            
            // 3. 检查是否为纯展示元素（如span, div with text only）
            const displayOnlyElements = sampleElements.filter(el => {
                const tagName = el.tagName.toLowerCase();
                const hasInteractiveChildren = el.querySelector('a, button, input, select, textarea') !== null;
                return (tagName === 'span' || tagName === 'div') && !hasInteractiveChildren;
            });
            
            const hasDisplayOnlyCharacteristic = displayOnlyElements.length / sampleElements.length > 0.7;
            
            console.log(`🔍 内容元素分析 ${className}:`, {
                类名匹配: hasContentPattern,
                文本为主特征: hasTextOnlyCharacteristic,
                纯展示特征: hasDisplayOnlyCharacteristic,
                样本数: sampleElements.length
            });
            
            return hasContentPattern || (hasTextOnlyCharacteristic && hasDisplayOnlyCharacteristic);
        }
        
        return hasContentPattern;
    }

    // 精确识别列表容器 - 基于类名模式和结构特征
    identifyListContainer(className, elementInfos) {
        // 1. 强列表容器模式 - Vue组件等（优先级最高）
        const strongListPatterns = [
            /vue-recycle-scroller.*item.*view/i,  // vue-recycle-scroller__item-view
            /vue-recycle-scroller/i,              // 任何vue-recycle-scroller相关
            /wbpro-feed/i,                        // 微博feed容器
            /Feed_wrap/i,                         // Feed容器
            /\b(scroller|scroll)\b.*\b(item|view|container)\b/i,
            /\b(item|view|container)\b.*\b(scroller|scroll)\b/i
        ];
        
        const hasStrongListPattern = strongListPatterns.some(pattern => pattern.test(className));
        
        // 2. 一般列表容器模式
        const listContainerPatterns = [
            /\b(item|entry|row|cell|card|tile)\b.*\b(view|wrapper|container|box)\b/i,
            /\b(list|feed|stream)\b.*\b(item|entry|element)\b/i,
            /\b(item|entry)-\w+(-\w+)*$/i, // item-xxx, entry-xxx-yyy 等模式
            /\b(view|container|wrapper)-\w+(-\w+)*$/i // view-xxx, container-xxx-yyy 等
        ];
        
        const hasListContainerPattern = listContainerPatterns.some(pattern => pattern.test(className));
        
        // 3. 特殊类名直接识别（微博特定）
        const directListContainerNames = [
            'vue-recycle-scroller__item-view',
            'wbpro-scroller-item',
            'Feed_wrap_3v9LH',
            'Feed_normal_12A98'
        ];
        
        const isDirectListContainer = directListContainerNames.some(name => 
            className.includes(name) || className === name
        );
        
        // 4. 分析DOM结构特征
        let hasContainerStructure = false;
        if (elementInfos && elementInfos.length > 0) {
            const sampleElements = elementInfos.slice(0, 3).map(ei => ei.element);
            
            // 检查是否有容器结构特征
            const containerElements = sampleElements.filter(el => {
                const children = el.children;
                const hasMultipleChildren = children.length >= 2;
                const hasStructuredContent = el.querySelector('div, span, a, img, p, h1, h2, h3, h4, h5, h6') !== null;
                
                return hasMultipleChildren && hasStructuredContent;
            });
            
            hasContainerStructure = containerElements.length / sampleElements.length > 0.5;
            
            console.log(`🎯 列表容器分析 ${className}:`, {
                强列表模式: hasStrongListPattern,
                列表容器模式: hasListContainerPattern,
                直接匹配: isDirectListContainer,
                容器结构特征: hasContainerStructure,
                样本数: sampleElements.length
            });
        }
        
        // 强模式或直接匹配立即返回true
        if (hasStrongListPattern || isDirectListContainer) {
            return true;
        }
        
        // 一般模式需要结构特征支持
        return hasListContainerPattern && hasContainerStructure;
    }

    // 移除重复的父子元素关系 - 智能去重，优先保留真正的列表容器
    removeDuplicateParentChildElements(dynamicListElements) {
        console.log('🔍 开始智能去重分析...');
        
        // 1. 首先按类型和分数分组
        const listContainers = [];
        const contentElements = [];
        const regularElements = [];
        
        dynamicListElements.forEach(element => {
            // 识别列表容器（vue-recycle-scroller等）
            const isListContainer = this.identifyListContainer(element.className, element.elementInfos);
            const isContentElement = this.identifyContentElement(element.className, element.elementInfos);
            
            console.log(`🏷️ 元素分类: ${element.className}`, {
                类型: isListContainer ? '列表容器' : isContentElement ? '内容元素' : '常规元素',
                分数: Math.round(element.dynamicScore),
                元素数: element.elements.size
            });
            
            if (isListContainer) {
                listContainers.push(element);
            } else if (isContentElement) {
                contentElements.push(element);
            } else {
                regularElements.push(element);
            }
        });
        
        // 2. 如果有列表容器，优先保留最佳的列表容器
        if (listContainers.length > 0) {
            console.log('🎯 发现列表容器，优先保留最佳列表容器');
            
            // 按分数排序，选择最佳的列表容器
            listContainers.sort((a, b) => b.dynamicScore - a.dynamicScore);
            const bestListContainer = listContainers[0];
            
            console.log(`✅ 选择最佳列表容器: ${bestListContainer.className} (分数: ${Math.round(bestListContainer.dynamicScore)})`);
            
            // 检查是否需要保留其他非重叠的列表容器
            const filtered = [bestListContainer];
            
            for (let i = 1; i < listContainers.length; i++) {
                const candidate = listContainers[i];
                const relationship = this.analyzeElementRelationship(bestListContainer, candidate);
                
                console.log(`🔗 检查次级列表容器: ${candidate.className}`, {
                    与最佳容器关系: relationship.type,
                    重叠率: (relationship.overlapRate * 100).toFixed(1) + '%'
                });
                
                // 如果重叠率低，可以保留
                if (relationship.overlapRate < 0.3) {
                    filtered.push(candidate);
                    console.log(`✅ 保留非重叠列表容器: ${candidate.className}`);
                } else {
                    console.log(`❌ 过滤重叠列表容器: ${candidate.className}`);
                }
            }
            
            // 检查是否需要保留任何高质量的常规元素
            regularElements.forEach(element => {
                if (element.dynamicScore >= 85) { // 只保留高分常规元素
                    const hasOverlap = filtered.some(existing => {
                        const relationship = this.analyzeElementRelationship(existing, element);
                        return relationship.overlapRate > 0.5;
                    });
                    
                    if (!hasOverlap) {
                        filtered.push(element);
                        console.log(`✅ 保留高分非重叠常规元素: ${element.className} (分数: ${Math.round(element.dynamicScore)})`);
                    }
                }
            });
            
            console.log(`🎯 智能去重完成: ${dynamicListElements.length} → ${filtered.length} (优先列表容器策略)`);
            return filtered;
            
        } else {
            // 3. 如果没有列表容器，使用传统去重逻辑但更加严格
            console.log('⚠️ 未发现明确的列表容器，使用严格去重策略');
            
            const allElements = [...regularElements, ...contentElements];
            allElements.sort((a, b) => b.dynamicScore - a.dynamicScore);
            
            const filtered = [];
            
            for (const currentElement of allElements) {
                let shouldKeep = true;
                
                // 内容元素需要更高的标准
                const isCurrentContent = contentElements.includes(currentElement);
                const minScoreThreshold = isCurrentContent ? 95 : 80;
                
                if (currentElement.dynamicScore < minScoreThreshold) {
                    console.log(`❌ 过滤低分元素: ${currentElement.className} (分数: ${Math.round(currentElement.dynamicScore)}, 需要: ${minScoreThreshold})`);
                    continue;
                }
                
                // 检查与已保留元素的关系
                for (const existingElement of filtered) {
                    const relationship = this.analyzeElementRelationship(currentElement, existingElement);
                    
                    if (relationship.overlapRate > 0.6) {
                        console.log(`❌ 过滤重叠元素: ${currentElement.className} (与 ${existingElement.className} 重叠 ${(relationship.overlapRate * 100).toFixed(1)}%)`);
                        shouldKeep = false;
                        break;
                    }
                }
                
                if (shouldKeep) {
                    filtered.push(currentElement);
                    console.log(`✅ 保留元素: ${currentElement.className} (分数: ${Math.round(currentElement.dynamicScore)})`);
                }
            }
            
            console.log(`🎯 严格去重完成: ${dynamicListElements.length} → ${filtered.length}`);
            return filtered.slice(0, 2); // 最多保留2个最佳元素
        }
    }

    // 分析两个元素组之间的关系
    analyzeElementRelationship(elementGroup1, elementGroup2) {
        const elements1 = Array.from(elementGroup1.elements);
        const elements2 = Array.from(elementGroup2.elements);
        
        // 计算元素重叠率
        let overlapCount = 0;
        
        elements1.forEach(el1 => {
            elements2.forEach(el2 => {
                // 检查是否是相同元素或父子关系
                if (el1 === el2) {
                    overlapCount++;
                } else if (el1.contains(el2) || el2.contains(el1)) {
                    overlapCount += 0.8; // 父子关系算80%重叠
                } else if (this.elementsAreClose(el1, el2)) {
                    overlapCount += 0.5; // 位置接近算50%重叠
                }
            });
        });
        
        const maxElements = Math.max(elements1.length, elements2.length);
        const overlapRate = overlapCount / maxElements;
        
        // 判断关系类型
        let relationshipType = 'independent';
        
        if (overlapRate > 0.9) {
            relationshipType = 'duplicate';
        } else if (overlapRate > 0.7) {
            relationshipType = 'high_overlap';
        } else if (overlapRate > 0.3) {
            relationshipType = 'partial_overlap';
        }
        
        // 特别检查包含关系
        const containmentRate1 = this.calculateContainmentRate(elements1, elements2);
        const containmentRate2 = this.calculateContainmentRate(elements2, elements1);
        
        if (containmentRate1 > 0.8) {
            relationshipType = 'contains_other';
        } else if (containmentRate2 > 0.8) {
            relationshipType = 'contained_by_other';
        }
        
        return {
            type: relationshipType,
            overlapRate: overlapRate,
            containmentRate1: containmentRate1,
            containmentRate2: containmentRate2
        };
    }

    // 计算包含率
    calculateContainmentRate(containerElements, containedElements) {
        let containedCount = 0;
        
        containedElements.forEach(containedEl => {
            containerElements.forEach(containerEl => {
                if (containerEl.contains(containedEl)) {
                    containedCount++;
                }
            });
        });
        
        return containedElements.length > 0 ? containedCount / containedElements.length : 0;
    }

    // 检查两个元素是否位置接近
    elementsAreClose(el1, el2) {
        try {
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();
            
            const distance = Math.sqrt(
                Math.pow(rect1.left - rect2.left, 2) + 
                Math.pow(rect1.top - rect2.top, 2)
            );
            
            const avgSize = (rect1.width + rect1.height + rect2.width + rect2.height) / 4;
            
            return distance < avgSize * 0.5; // 距离小于平均尺寸的50%认为是接近
        } catch (error) {
            return false;
        }
    }

    // 判断是否是同一个列表的不同层级
    isSameListDifferentLevel(className1, className2) {
        // 检查类名是否有包含关系
        if (className1.includes(className2) || className2.includes(className1)) {
            return true;
        }
        
        // 检查是否都包含相同的关键词
        const keywords = ['item', 'list', 'scroller', 'card', 'post', 'entry', 'row', 'cell'];
        let commonKeywords = 0;
        
        keywords.forEach(keyword => {
            if (className1.includes(keyword) && className2.includes(keyword)) {
                commonKeywords++;
            }
        });
        
        // 如果有2个以上共同关键词，认为是同一列表的不同层级
        return commonKeywords >= 2;
    }
}

// 初始化脚本
console.log('🏁 Initializing WebMonkey Content Script...');
console.log('📄 Document readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ Document still loading, waiting...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📱 DOMContentLoaded fired, creating SimpleContentScript');
        new SimpleContentScript();
    });
} else {
    console.log('📱 Document ready, creating SimpleContentScript immediately');
    new SimpleContentScript();
}

console.log('🎯 WebMonkey Content Script setup complete!');