/**
 * WebMonkey Browser Automation - Dynamic List Observer Module
 * 
 * 动态列表观察模块 - 智能检测页面中的动态列表元素
 * 使用XPath追踪和滚动分析技术，自动识别类似微博feed、商品列表等动态内容
 * 
 * @category Observe
 * @author WebMonkey Team
 * @version 1.0.0
 */

class ObserveDynamicList {
    constructor() {
        this.moduleInfo = {
            name: 'observeDynamicList',
            category: 'observe',
            description: '智能检测页面中的动态列表元素，支持虚拟滚动和无限加载列表',
            version: '1.0.0',
            supportedTypes: ['dynamicList'],
            requiredPermissions: ['scroll', 'dom']
        };
        
        // 观察状态
        this.isObserving = false;
        this.observedElements = [];
        this.scrollHistory = [];
        
        // 配置参数
        this.config = {
            scrollCount: 3,           // 滚动次数
            scrollDistanceRatio: 1.2, // 滚动距离比例（相对于屏幕高度）
            waitTime: 3000,          // 每次滚动后等待时间（毫秒）
            minElementCount: 2,      // 最小元素数量要求
            maxResults: 3            // 最大返回结果数
        };
    }

    /**
     * 主要观察方法 - 检测页面中的动态列表
     * @param {Object} options - 观察选项
     * @param {Element} options.parentElement - 父元素限制（可选）
     * @param {Object} options.config - 自定义配置（可选）
     * @returns {Promise<Array>} 观察结果列表
     */
    async observe(options = {}) {
        console.log('🔍 [ObserveDynamicList] 开始动态列表观察...');
        
        try {
            // 应用自定义配置
            if (options.config) {
                this.config = { ...this.config, ...options.config };
            }
            
            this.isObserving = true;
            this.observedElements = [];
            this.scrollHistory = [];
            
            // 执行智能观察
            const results = await this.performIntelligentObservation(options.parentElement);
            
            // 转换为标准观察结果格式
            const observeResults = this.formatObserveResults(results);
            
            console.log(`✅ [ObserveDynamicList] 观察完成，发现 ${observeResults.length} 个动态列表`);
            return observeResults;
            
        } catch (error) {
            console.error('❌ [ObserveDynamicList] 观察过程出错:', error);
            throw error;
        } finally {
            this.isObserving = false;
        }
    }

    /**
     * 智能观察核心逻辑 - 基于XPath追踪和滚动分析
     * @param {Element} parentElement - 父元素限制
     * @returns {Promise<Array>} 检测到的动态列表元素
     */
    async performIntelligentObservation(parentElement = null) {
        console.log('🔍 开始智能观察 - 基于XPath的正确检测逻辑...');
        
        // 1. 捕获第一屏所有元素的XPath
        const firstScreenElements = this.captureFirstScreenElements(parentElement);
        console.log('📊 第一屏捕获:', firstScreenElements.length, '个元素');
        
        // 2. 执行多次滚动检测 - 正确的留存过滤逻辑
        let retainedClassGroups = {}; // 每次滚动后留存的类名组
        this.scrollHistory = []; // 存储每次滚动的详细数据
        
        for (let scrollIndex = 0; scrollIndex < this.config.scrollCount; scrollIndex++) {
            console.log(`📱 执行第 ${scrollIndex + 1} 次滚动...`);
            
            // 计算滚动距离
            let scrollDistance = window.innerHeight * this.config.scrollDistanceRatio;
            if (scrollIndex > 0) {
                scrollDistance = window.innerHeight * 1.5; // 后续滚动更多距离
            }
            
            window.scrollBy(0, scrollDistance);
            
            // 等待内容加载和页面稳定
            await new Promise(resolve => setTimeout(resolve, this.config.waitTime));
            
            // 找出当前视口内完整显示的所有元素（不在第一屏记录中的）
            const currentViewportElements = this.findCompletelyVisibleNewElements(firstScreenElements, parentElement);
            console.log(`👁️ 第${scrollIndex + 1}次滚动发现完整可见的新元素: ${currentViewportElements.length} 个`);
            
            // 按类名分组元素
            const currentClassGroups = this.groupElementsByClass(currentViewportElements);
            
            if (scrollIndex === 0) {
                // 第1次滚动：记录所有类名组
                retainedClassGroups = currentClassGroups;
                console.log(`🆕 第1次滚动留存类名: ${Object.keys(retainedClassGroups).length} 个类`);
            } else {
                // 第2/3次滚动：进行留存过滤
                const newRetainedClassGroups = {};
                
                Object.keys(retainedClassGroups).forEach(className => {
                    const previousElementXPaths = retainedClassGroups[className].xpaths;
                    const currentClassGroup = currentClassGroups[className];
                    
                    if (currentClassGroup) {
                        // 检查上次留存的xpath元素是否还在当前视口中
                        const stillVisiblePreviousElements = this.countStillVisibleElements(previousElementXPaths);
                        
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
        
        // 分析最终留存的元素
        const dynamicListElements = this.analyzeFinalRetainedElements(retainedClassGroups);
        
        console.log('✅ 动态列表元素检测完成');
        return dynamicListElements;
    }

    /**
     * 捕获第一屏所有元素的XPath信息
     * @param {Element} parentElement - 父元素限制
     * @returns {Array} 第一屏元素信息数组
     */
    captureFirstScreenElements(parentElement = null) {
        const elements = [];
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const viewportLeft = window.scrollX;
        const viewportRight = viewportLeft + window.innerWidth;
        
        const allElements = parentElement ? 
            Array.from(parentElement.querySelectorAll('*[class]')) : 
            Array.from(document.querySelectorAll('*[class]'));
        
        allElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + window.scrollY;
            const elementBottom = rect.bottom + window.scrollY;
            const elementLeft = rect.left + window.scrollX;
            const elementRight = rect.right + window.scrollX;
            
            // 检查是否完整在第一屏视口内
            const isCompletelyVisible = 
                elementTop >= viewportTop &&
                elementBottom <= viewportBottom &&
                elementLeft >= viewportLeft &&
                elementRight <= viewportRight &&
                rect.width > 0 && rect.height > 0;
            
            if (isCompletelyVisible) {
                const xpath = this.getElementXPath(element);
                elements.push({ element, xpath });
            }
        });
        
        console.log('📋 第一屏元素捕获完成:', elements.length, '个元素');
        return elements;
    }

    /**
     * 查找完整可见的新元素（不在第一屏记录中的）
     * @param {Array} firstScreenElements - 第一屏元素列表
     * @param {Element} parentElement - 父元素限制
     * @returns {Array} 新发现的完整可见元素
     */
    findCompletelyVisibleNewElements(firstScreenElements, parentElement = null) {
        const firstScreenXPaths = new Set(firstScreenElements.map(ei => ei.xpath));
        const newElements = [];
        
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const viewportLeft = window.scrollX;
        const viewportRight = viewportLeft + window.innerWidth;
        
        const allElements = parentElement ? 
            Array.from(parentElement.querySelectorAll('*[class]')) : 
            Array.from(document.querySelectorAll('*[class]'));
        
        allElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + window.scrollY;
            const elementBottom = rect.bottom + window.scrollY;
            const elementLeft = rect.left + window.scrollX;
            const elementRight = rect.right + window.scrollX;
            
            // 检查是否完整在当前视口内
            const isCompletelyVisible = 
                elementTop >= viewportTop &&
                elementBottom <= viewportBottom &&
                elementLeft >= viewportLeft &&
                elementRight <= viewportRight &&
                rect.width > 0 && rect.height > 0;
            
            if (isCompletelyVisible) {
                const xpath = this.getElementXPath(element);
                if (!firstScreenXPaths.has(xpath)) {
                    newElements.push({ element, xpath });
                }
            }
        });
        
        return newElements;
    }

    /**
     * 按类名分组元素，支持去重
     * @param {Array} elementInfos - 元素信息数组
     * @returns {Object} 按类名分组的元素对象
     */
    groupElementsByClass(elementInfos) {
        const classGroups = {};
        
        elementInfos.forEach(elementInfo => {
            const className = this.getElementClassName(elementInfo.element);
            if (className && className.trim()) {
                const classes = className.trim().split(/\s+/);
                const primaryClass = this.selectPrimaryClassName(classes);
                
                if (!classGroups[primaryClass]) {
                    classGroups[primaryClass] = {
                        className: primaryClass,
                        elements: [],
                        xpaths: new Set(),
                        elementXPathSet: new Set() // 用于去重
                    };
                }
                
                // 使用XPath进行去重判断
                if (!classGroups[primaryClass].elementXPathSet.has(elementInfo.xpath)) {
                    classGroups[primaryClass].elements.push(elementInfo);
                    classGroups[primaryClass].xpaths.add(elementInfo.xpath);
                    classGroups[primaryClass].elementXPathSet.add(elementInfo.xpath);
                }
            }
        });
        
        // 清理临时去重集合
        Object.values(classGroups).forEach(group => {
            if (group.elements.length !== group.xpaths.size) {
                console.warn(`⚠️ 类名 ${group.className} 去重异常: elements=${group.elements.length}, xpaths=${group.xpaths.size}`);
            }
            delete group.elementXPathSet;
        });
        
        return classGroups;
    }

    /**
     * 检查指定xpath的元素是否还在当前视口中完整可见
     * @param {Set} xpaths - XPath集合
     * @returns {number} 仍然可见的元素数量
     */
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
                // XPath无效或元素不存在，忽略
            }
        });
        
        return visibleCount;
    }

    /**
     * 分析最终留存的元素，识别真正的动态列表
     * @param {Object} retainedClassGroups - 留存的类名组
     * @returns {Array} 动态列表元素数组
     */
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
            }
            
            // 内容元素减分
            if (isContentElement && !isListContainer) {
                dynamicScore -= 25; // 纯内容元素减分
            }
            
            // 筛选条件：动态评分 + 非控制元素 + 足够数量的元素
            let minScore;
            if (isListContainer) {
                minScore = 60; // 列表容器低门槛
            } else if (isContentElement) {
                minScore = 90; // 内容元素高门槛
            } else {
                minScore = 70; // 一般元素中等门槛
            }
            
            if (dynamicScore >= minScore && !isControlElement && classGroup.elements.length >= this.config.minElementCount) {
                dynamicListElements.push({
                    className: classGroup.className,
                    elements: new Set(classGroup.elements.map(ei => ei.element)),
                    elementInfos: classGroup.elements,
                    contentQuality,
                    isListElement,
                    isListContainer,
                    isContentElement,
                    dynamicScore,
                    classPersistence: 1.0, // 通过三次滚动留存，持续性100%
                    instanceChangeRate: 1.0 // 每次滚动都有新实例，变化率100%
                });
            }
        });
        
        // 按动态评分排序
        dynamicListElements.sort((a, b) => b.dynamicScore - a.dynamicScore);
        
        // 进行智能去重分析
        const deduplicatedElements = this.removeDuplicateParentChildElements(dynamicListElements);
        
        return deduplicatedElements.slice(0, this.config.maxResults);
    }

    /**
     * 智能去重 - 优先保留真正的列表容器
     * @param {Array} dynamicListElements - 动态列表元素数组
     * @returns {Array} 去重后的元素数组
     */
    removeDuplicateParentChildElements(dynamicListElements) {
        console.log('🔍 开始智能去重分析...');
        
        // 1. 首先按类型和分数分组
        const listContainers = [];
        const contentElements = [];
        const regularElements = [];
        
        dynamicListElements.forEach(element => {
            if (element.isListContainer) {
                listContainers.push(element);
            } else if (element.isContentElement) {
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
            
            const filtered = [bestListContainer];
            
            // 检查是否需要保留其他非重叠的列表容器
            for (let i = 1; i < listContainers.length; i++) {
                const candidate = listContainers[i];
                const relationship = this.analyzeElementRelationship(bestListContainer, candidate);
                
                if (relationship.overlapRate < 0.3) {
                    filtered.push(candidate);
                    console.log(`✅ 保留非重叠列表容器: ${candidate.className}`);
                }
            }
            
            console.log(`🎯 智能去重完成: ${dynamicListElements.length} → ${filtered.length} (优先列表容器策略)`);
            return filtered;
            
        } else {
            // 3. 如果没有列表容器，使用严格去重策略
            console.log('⚠️ 未发现明确的列表容器，使用严格去重策略');
            
            const allElements = [...regularElements, ...contentElements];
            allElements.sort((a, b) => b.dynamicScore - a.dynamicScore);
            
            const filtered = [];
            
            for (const currentElement of allElements) {
                const isCurrentContent = contentElements.includes(currentElement);
                const minScoreThreshold = isCurrentContent ? 95 : 80;
                
                if (currentElement.dynamicScore < minScoreThreshold) {
                    continue;
                }
                
                // 检查与已保留元素的关系
                let shouldKeep = true;
                for (const existingElement of filtered) {
                    const relationship = this.analyzeElementRelationship(currentElement, existingElement);
                    
                    if (relationship.overlapRate > 0.6) {
                        shouldKeep = false;
                        break;
                    }
                }
                
                if (shouldKeep) {
                    filtered.push(currentElement);
                }
            }
            
            console.log(`🎯 严格去重完成: ${dynamicListElements.length} → ${filtered.length}`);
            return filtered.slice(0, 2);
        }
    }

    /**
     * 精确识别内容元素 - 基于类名模式和DOM结构分析
     * @param {string} className - 类名
     * @param {Array} elementInfos - 元素信息数组
     * @returns {boolean} 是否为内容元素
     */
    identifyContentElement(className, elementInfos) {
        // 基于类名的内容元素识别模式
        const contentClassPatterns = [
            /\b(text|content|desc|description|title|label|caption)\b/i,
            /\b(ogText|wbtext|detail|summary|msg|message)\b/i,
            /\b(txt|str|string|words|chars|para|paragraph)\b/i
        ];
        
        const hasContentPattern = contentClassPatterns.some(pattern => pattern.test(className));
        
        // 分析元素的DOM结构特征
        if (elementInfos && elementInfos.length > 0) {
            const sampleElements = elementInfos.slice(0, 3).map(ei => ei.element);
            
            // 检查是否主要包含文本内容而非子元素
            const textOnlyElements = sampleElements.filter(el => {
                const children = el.children;
                const textContent = el.textContent?.trim() || '';
                return textContent.length > 10 && children.length <= 2;
            });
            
            const hasTextOnlyCharacteristic = textOnlyElements.length / sampleElements.length > 0.6;
            
            return hasContentPattern || hasTextOnlyCharacteristic;
        }
        
        return hasContentPattern;
    }

    /**
     * 精确识别列表容器 - 基于类名模式和结构特征
     * @param {string} className - 类名
     * @param {Array} elementInfos - 元素信息数组
     * @returns {boolean} 是否为列表容器
     */
    identifyListContainer(className, elementInfos) {
        // 强列表容器模式 - Vue组件等（优先级最高）
        const strongListPatterns = [
            /vue-recycle-scroller.*item.*view/i,
            /vue-recycle-scroller/i,
            /wbpro-feed/i,
            /Feed_wrap/i,
            /\b(scroller|scroll)\b.*\b(item|view|container)\b/i,
            /\b(item|view|container)\b.*\b(scroller|scroll)\b/i
        ];
        
        const hasStrongListPattern = strongListPatterns.some(pattern => pattern.test(className));
        
        // 特殊类名直接识别
        const directListContainerNames = [
            'vue-recycle-scroller__item-view',
            'wbpro-scroller-item',
            'Feed_wrap_3v9LH',
            'Feed_normal_12A98'
        ];
        
        const isDirectListContainer = directListContainerNames.some(name => 
            className.includes(name) || className === name
        );
        
        // 强模式或直接匹配立即返回true
        if (hasStrongListPattern || isDirectListContainer) {
            return true;
        }
        
        // 一般列表容器模式
        const listContainerPatterns = [
            /\b(item|entry|row|cell|card|tile)\b.*\b(view|wrapper|container|box)\b/i,
            /\b(list|feed|stream)\b.*\b(item|entry|element)\b/i,
            /\b(item|entry)-\w+(-\w+)*$/i,
            /\b(view|container|wrapper)-\w+(-\w+)*$/i
        ];
        
        const hasListContainerPattern = listContainerPatterns.some(pattern => pattern.test(className));
        
        // 分析DOM结构特征
        if (elementInfos && elementInfos.length > 0) {
            const sampleElements = elementInfos.slice(0, 3).map(ei => ei.element);
            
            const containerElements = sampleElements.filter(el => {
                const children = el.children;
                const hasMultipleChildren = children.length >= 2;
                const hasStructuredContent = el.querySelector('div, span, a, img, p, h1, h2, h3, h4, h5, h6') !== null;
                
                return hasMultipleChildren && hasStructuredContent;
            });
            
            const hasContainerStructure = containerElements.length / sampleElements.length > 0.5;
            return hasListContainerPattern && hasContainerStructure;
        }
        
        return false;
    }

    /**
     * 格式化观察结果为标准格式
     * @param {Array} dynamicListElements - 检测到的动态列表元素
     * @returns {Array} 标准格式的观察结果
     */
    formatObserveResults(dynamicListElements) {
        return dynamicListElements.map((listElement, index) => {
            const sampleElement = Array.from(listElement.elements)[0];
            
            return {
                // 基本信息
                id: `dynamicList_${index + 1}`,
                type: 'dynamicList',
                category: 'observe',
                
                // 定位信息
                selector: {
                    className: listElement.className,
                    css: `.${listElement.className}`,
                    xpath: this.getElementXPath(sampleElement),
                    tag: sampleElement.tagName.toLowerCase()
                },
                
                // 列表信息
                listInfo: {
                    itemCount: listElement.elements.size,
                    itemClassName: listElement.className,
                    isVirtualScroll: listElement.className.includes('vue-recycle-scroller'),
                    isInfiniteLoad: true,
                    containerType: listElement.isListContainer ? 'container' : 'content'
                },
                
                // 质量指标
                quality: {
                    dynamicScore: Math.round(listElement.dynamicScore),
                    contentQuality: listElement.contentQuality,
                    classPersistence: listElement.classPersistence,
                    instanceChangeRate: listElement.instanceChangeRate,
                    confidence: this.calculateConfidence(listElement)
                },
                
                // 元素特征
                characteristics: {
                    isListElement: listElement.isListElement,
                    isListContainer: listElement.isListContainer,
                    isContentElement: listElement.isContentElement,
                    hasStructuredContent: true,
                    supportsBatchOperation: true
                },
                
                // 推荐操作
                recommendedOperations: this.getRecommendedOperations(listElement),
                
                // 原始数据（供operation节点使用）
                rawData: {
                    elements: Array.from(listElement.elements),
                    elementInfos: listElement.elementInfos,
                    detectionMethod: 'scrollAnalysis'
                }
            };
        });
    }

    /**
     * 计算检测置信度
     * @param {Object} listElement - 列表元素对象
     * @returns {number} 置信度（0-1）
     */
    calculateConfidence(listElement) {
        let confidence = 0;
        
        // 基于动态评分
        confidence += Math.min(listElement.dynamicScore / 100, 0.4);
        
        // 基于元素数量
        confidence += Math.min(listElement.elements.size / 10, 0.2);
        
        // 基于类型识别
        if (listElement.isListContainer) confidence += 0.3;
        else if (listElement.isListElement) confidence += 0.2;
        
        // 基于特殊模式
        if (listElement.className.includes('vue-recycle-scroller')) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    /**
     * 获取推荐操作列表
     * @param {Object} listElement - 列表元素对象
     * @returns {Array} 推荐操作数组
     */
    getRecommendedOperations(listElement) {
        const operations = [];
        
        // 基础操作
        operations.push('extractText', 'extractLinks', 'extractImages');
        
        // 根据列表类型推荐特定操作
        if (listElement.isListContainer) {
            operations.push('batchClick', 'batchScroll', 'batchExtract');
        }
        
        if (listElement.className.includes('vue-recycle-scroller')) {
            operations.push('infiniteScroll', 'virtualScrollExtract');
        }
        
        // 根据内容特征推荐操作
        if (listElement.contentQuality > 0.7) {
            operations.push('contentAnalysis', 'semanticExtract');
        }
        
        return operations;
    }

    // ============ 工具方法 ============

    /**
     * 获取元素的XPath
     * @param {Element} element - DOM元素
     * @returns {string} XPath字符串
     */
    getElementXPath(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }
        
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        const parts = [];
        let current = element;
        
        while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
            let index = 1;
            let sibling = current.previousElementSibling;
            
            while (sibling) {
                if (sibling.tagName === current.tagName) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }
            
            const tagName = current.tagName.toLowerCase();
            const part = index > 1 ? `${tagName}[${index}]` : tagName;
            parts.unshift(part);
            current = current.parentElement;
        }
        
        return parts.length > 0 ? '/' + parts.join('/') : '';
    }

    /**
     * 获取元素的类名
     * @param {Element} element - DOM元素
     * @returns {string} 类名字符串
     */
    getElementClassName(element) {
        if (typeof element.className === 'string') {
            return element.className;
        } else if (element.className && element.className.baseVal) {
            return element.className.baseVal;
        }
        return '';
    }

    /**
     * 选择主要类名
     * @param {Array} classes - 类名数组
     * @returns {string} 主要类名
     */
    selectPrimaryClassName(classes) {
        // 优先选择包含特定模式的类名
        const priorityPatterns = [
            /vue-recycle-scroller/i,
            /item.*view/i,
            /feed/i,
            /list/i,
            /container/i
        ];
        
        for (const pattern of priorityPatterns) {
            const match = classes.find(cls => pattern.test(cls));
            if (match) return match;
        }
        
        // 否则选择最长的类名（通常包含更多信息）
        return classes.reduce((longest, current) => 
            current.length > longest.length ? current : longest
        );
    }

    /**
     * 分析元素内容质量
     * @param {Array} elements - 元素数组
     * @returns {number} 内容质量评分（0-1）
     */
    analyzeElementContentQuality(elements) {
        if (!elements || elements.length === 0) return 0;
        
        let totalScore = 0;
        
        elements.forEach(element => {
            let score = 0;
            
            // 文本内容
            const textContent = element.textContent?.trim() || '';
            if (textContent.length > 10) score += 0.3;
            if (textContent.length > 50) score += 0.2;
            
            // 链接
            if (element.querySelector('a')) score += 0.2;
            
            // 图片
            if (element.querySelector('img')) score += 0.2;
            
            // 结构复杂度
            if (element.children.length >= 3) score += 0.1;
            
            totalScore += Math.min(score, 1.0);
        });
        
        return totalScore / elements.length;
    }

    /**
     * 检查是否为列表元素
     * @param {string} className - 类名
     * @param {Array} elements - 元素数组
     * @returns {boolean} 是否为列表元素
     */
    checkIfListElement(className, elements) {
        // 基于类名判断
        const listPatterns = [
            /\b(item|entry|row|cell|card|tile|feed|list)\b/i,
            /vue-recycle-scroller/i
        ];
        
        if (listPatterns.some(pattern => pattern.test(className))) {
            return true;
        }
        
        // 基于结构判断
        if (elements && elements.length >= 2) {
            const hasConsistentStructure = elements.slice(0, 3).every(el => 
                el.children.length >= 2 && el.querySelector('div, span, a')
            );
            return hasConsistentStructure;
        }
        
        return false;
    }

    /**
     * 分析两个元素组之间的关系
     * @param {Object} elementGroup1 - 元素组1
     * @param {Object} elementGroup2 - 元素组2
     * @returns {Object} 关系分析结果
     */
    analyzeElementRelationship(elementGroup1, elementGroup2) {
        const elements1 = Array.from(elementGroup1.elements);
        const elements2 = Array.from(elementGroup2.elements);
        
        // 计算元素重叠率
        let overlapCount = 0;
        
        elements1.forEach(el1 => {
            elements2.forEach(el2 => {
                if (el1 === el2) {
                    overlapCount++;
                } else if (el1.contains(el2) || el2.contains(el1)) {
                    overlapCount += 0.8;
                } else if (this.elementsAreClose(el1, el2)) {
                    overlapCount += 0.5;
                }
            });
        });
        
        const overlapRate = overlapCount / Math.max(elements1.length, elements2.length);
        
        let relationshipType = 'independent';
        if (overlapRate > 0.8) {
            relationshipType = 'high_overlap';
        } else if (overlapRate > 0.5) {
            relationshipType = 'moderate_overlap';
        } else if (overlapRate > 0.2) {
            relationshipType = 'low_overlap';
        }
        
        return {
            type: relationshipType,
            overlapRate: overlapRate
        };
    }

    /**
     * 检查两个元素是否位置接近
     * @param {Element} el1 - 元素1
     * @param {Element} el2 - 元素2
     * @returns {boolean} 是否位置接近
     */
    elementsAreClose(el1, el2) {
        try {
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();
            
            const centerX1 = rect1.left + rect1.width / 2;
            const centerY1 = rect1.top + rect1.height / 2;
            const centerX2 = rect2.left + rect2.width / 2;
            const centerY2 = rect2.top + rect2.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2)
            );
            
            return distance < 100; // 100像素内算接近
        } catch (error) {
            return false;
        }
    }

    /**
     * 清理观察状态
     */
    cleanup() {
        this.isObserving = false;
        this.observedElements = [];
        this.scrollHistory = [];
        console.log('🧹 [ObserveDynamicList] 观察状态已清理');
    }

    /**
     * 获取模块信息
     * @returns {Object} 模块信息对象
     */
    getModuleInfo() {
        return this.moduleInfo;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObserveDynamicList;
} else if (typeof window !== 'undefined') {
    window.ObserveDynamicList = ObserveDynamicList;
}