"""
Browser Menu Injector - 非无头模式浏览器菜单注入器
职责：在非无头模式下为浏览器页面注入Cookie管理菜单
功能：通过JavaScript注入的方式提供Cookie保存和加载功能

🚨 此文件严格限制在500行以内 - 细菌化原则
"""

import asyncio
import logging
from typing import Optional
from playwright.async_api import Page

logger = logging.getLogger(__name__)


class BrowserMenuInjector:
    """浏览器菜单注入器 - 为非无头模式注入Cookie管理菜单"""
    
    def __init__(self, cookie_service):
        self.cookie_service = cookie_service
        self.menu_injected = False
        
    def get_menu_script(self) -> str:
        """获取菜单注入脚本"""
        return """
(function() {
    // 避免重复注入
    if (window.webMonkeyCookieMenu) {
        return;
    }
    
    window.webMonkeyCookieMenu = true;
    
    // Cookie管理菜单HTML
    const menuHTML = `
        <div id="webmonkey-cookie-menu" style="
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 2147483647;
            background: linear-gradient(135deg, #2d2d2d 0%, #404040 100%);
            border: 2px solid #FFC107;
            border-radius: 12px;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 14px;
            color: #ffffff;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            min-width: 200px;
            user-select: none;
            transition: all 0.3s ease;
        ">
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #555;
            ">
                <div style="
                    font-weight: bold;
                    font-size: 16px;
                    color: #FFC107;
                    display: flex;
                    align-items: center;
                ">
                    🍪 Cookie管理器
                </div>
                <button id="webmonkey-close-btn" style="
                    background: none;
                    border: none;
                    color: #FFC107;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,193,7,0.2)'" 
                   onmouseout="this.style.background='none'">×</button>
            </div>
            
            <div id="webmonkey-domain-info" style="
                margin-bottom: 12px;
                padding: 8px;
                background: rgba(255,193,7,0.1);
                border-radius: 6px;
                font-size: 12px;
            ">
                <strong>当前域名:</strong> <span id="webmonkey-current-domain"></span>
            </div>
            
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button id="webmonkey-save-btn" style="
                    flex: 1;
                    background: #4CAF50;
                    border: none;
                    color: white;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: bold;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#45a049'; this.style.transform='translateY(-1px)'" 
                   onmouseout="this.style.background='#4CAF50'; this.style.transform='translateY(0)'">
                    💾 保存Cookie
                </button>
                
                <button id="webmonkey-load-btn" style="
                    flex: 1;
                    background: #2196F3;
                    border: none;
                    color: white;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: bold;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#1976D2'; this.style.transform='translateY(-1px)'" 
                   onmouseout="this.style.background='#2196F3'; this.style.transform='translateY(0)'">
                    📥 加载Cookie
                </button>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button id="webmonkey-clear-btn" style="
                    flex: 1;
                    background: #f44336;
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#da190b'; this.style.transform='translateY(-1px)'" 
                   onmouseout="this.style.background='#f44336'; this.style.transform='translateY(0)'">
                    🗑️ 清除Cookie
                </button>
                
                <button id="webmonkey-refresh-btn" style="
                    flex: 1;
                    background: #FF9800;
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#F57C00'; this.style.transform='translateY(-1px)'" 
                   onmouseout="this.style.background='#FF9800'; this.style.transform='translateY(0)'">
                    🔄 刷新页面
                </button>
            </div>
            
            <div id="webmonkey-status" style="
                margin-top: 12px;
                padding: 6px 8px;
                border-radius: 4px;
                font-size: 11px;
                text-align: center;
                min-height: 16px;
                transition: all 0.3s ease;
            "></div>
        </div>
    `;
    
    // 添加菜单到页面
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    
    const menu = document.getElementById('webmonkey-cookie-menu');
    const domainSpan = document.getElementById('webmonkey-current-domain');
    const saveBtn = document.getElementById('webmonkey-save-btn');
    const loadBtn = document.getElementById('webmonkey-load-btn');
    const clearBtn = document.getElementById('webmonkey-clear-btn');
    const refreshBtn = document.getElementById('webmonkey-refresh-btn');
    const closeBtn = document.getElementById('webmonkey-close-btn');
    const statusDiv = document.getElementById('webmonkey-status');
    
    // 显示当前域名
    const currentDomain = window.location.hostname;
    domainSpan.textContent = currentDomain;
    
    // 状态显示函数
    function showStatus(message, type = 'info') {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#FF9800'
        };
        
        statusDiv.style.background = colors[type] || colors.info;
        statusDiv.textContent = message;
        statusDiv.style.opacity = '1';
        
        setTimeout(() => {
            statusDiv.style.opacity = '0.7';
        }, 3000);
    }
    
    // Cookie操作函数
    function getAllCookies() {
        return document.cookie.split(';').reduce((cookies, cookie) => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = decodeURIComponent(value);
            }
            return cookies;
        }, {});
    }
    
    function setCookie(name, value, options = {}) {
        let cookieString = `${name}=${encodeURIComponent(value)}`;
        
        if (options.expires) {
            cookieString += `; expires=${new Date(options.expires).toUTCString()}`;
        }
        if (options.path) {
            cookieString += `; path=${options.path}`;
        }
        if (options.domain) {
            cookieString += `; domain=${options.domain}`;
        }
        if (options.secure) {
            cookieString += `; secure`;
        }
        if (options.sameSite) {
            cookieString += `; samesite=${options.sameSite}`;
        }
        
        document.cookie = cookieString;
    }
    
    function clearAllCookies() {
        const cookies = getAllCookies();
        Object.keys(cookies).forEach(name => {
            // 尝试多种路径和域名组合来删除cookie
            const domains = ['', `.${currentDomain}`, currentDomain];
            const paths = ['/', ''];
            
            domains.forEach(domain => {
                paths.forEach(path => {
                    let deleteString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                    if (path) deleteString += `; path=${path}`;
                    if (domain) deleteString += `; domain=${domain}`;
                    document.cookie = deleteString;
                });
            });
        });
    }
    
    // 与后端通信的函数
    async function communicateWithBackend(action, data) {
        try {
            // 尝试通过window.webMonkeyAPI（如果存在）
            if (window.webMonkeyAPI) {
                return await window.webMonkeyAPI[action](data);
            }
            
            // 备用：通过fetch请求后端API
            const response = await fetch(`http://localhost:5009/api/cookies/${action}`, {
                method: action === 'load' ? 'GET' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: action !== 'load' ? JSON.stringify(data) : undefined
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Failed to communicate with backend for ${action}:`, error);
            throw error;
        }
    }
    
    // 事件处理器
    saveBtn.onclick = async () => {
        try {
            showStatus('正在保存Cookie...', 'info');
            saveBtn.disabled = true;
            
            const cookies = getAllCookies();
            const cookieData = {
                domain: currentDomain,
                cookies: Object.entries(cookies).map(([name, value]) => ({
                    name,
                    value,
                    domain: currentDomain,
                    path: '/',
                    secure: window.location.protocol === 'https:',
                    sameSite: 'Lax'
                })),
                savedAt: new Date().toISOString(),
                url: window.location.href
            };
            
            const result = await communicateWithBackend('save', cookieData);
            
            if (result.success) {
                showStatus(`✅ 已保存 ${Object.keys(cookies).length} 个Cookie`, 'success');
            } else {
                throw new Error(result.error || 'Save failed');
            }
            
        } catch (error) {
            showStatus(`❌ 保存失败: ${error.message}`, 'error');
        } finally {
            saveBtn.disabled = false;
        }
    };
    
    loadBtn.onclick = async () => {
        try {
            showStatus('正在加载Cookie...', 'info');
            loadBtn.disabled = true;
            
            const result = await communicateWithBackend('load', { domain: currentDomain });
            
            if (result.success && result.data) {
                const domainCookies = result.data;
                
                // 先清除现有Cookie
                clearAllCookies();
                
                // 设置新Cookie
                domainCookies.cookies.forEach(cookie => {
                    setCookie(cookie.name, cookie.value, {
                        path: cookie.path,
                        domain: cookie.domain,
                        expires: cookie.expires,
                        secure: cookie.secure,
                        sameSite: cookie.sameSite
                    });
                });
                
                showStatus(`✅ 已加载 ${domainCookies.cookies.length} 个Cookie`, 'success');
                
                // 询问是否刷新页面
                if (confirm('Cookie已加载，是否刷新页面以应用更改？')) {
                    window.location.reload();
                }
            } else {
                throw new Error(result.error || 'No cookies found');
            }
            
        } catch (error) {
            showStatus(`❌ 加载失败: ${error.message}`, 'error');
        } finally {
            loadBtn.disabled = false;
        }
    };
    
    clearBtn.onclick = () => {
        if (confirm('确定要清除所有Cookie吗？此操作不可撤销。')) {
            clearAllCookies();
            showStatus('🗑️ 已清除所有Cookie', 'warning');
        }
    };
    
    refreshBtn.onclick = () => {
        window.location.reload();
    };
    
    closeBtn.onclick = () => {
        menu.remove();
        window.webMonkeyCookieMenu = false;
    };
    
    // 快捷键支持
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key) {
                case 'S':
                    e.preventDefault();
                    saveBtn.click();
                    break;
                case 'L':
                    e.preventDefault();
                    loadBtn.click();
                    break;
                case 'C':
                    e.preventDefault();
                    clearBtn.click();
                    break;
                case 'M':
                    e.preventDefault();
                    if (menu.style.display === 'none') {
                        menu.style.display = 'block';
                    } else {
                        menu.style.display = 'none';
                    }
                    break;
            }
        }
    });
    
    // 添加拖拽功能
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    
    menu.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        
        isDragging = true;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        menu.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        menu.style.transform = `translate(${currentX}px, ${currentY}px)`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            menu.style.cursor = 'default';
        }
    });
    
    showStatus('🎉 Cookie管理器已就绪', 'success');
    
    console.log('🍪 WebMonkey Cookie Menu injected successfully');
})();
        """
    
    async def inject_menu(self, page: Page, auto_hide: bool = False) -> bool:
        """向页面注入Cookie管理菜单"""
        try:
            # 注入菜单脚本
            await page.evaluate(self.get_menu_script())
            
            # 如果需要自动隐藏，延迟几秒后隐藏
            if auto_hide:
                await asyncio.sleep(3)
                await page.evaluate("""
                    const menu = document.getElementById('webmonkey-cookie-menu');
                    if (menu) {
                        menu.style.display = 'none';
                    }
                """)
            
            logger.info("✅ Successfully injected Cookie management menu")
            self.menu_injected = True
            return True
            
        except Exception as e:
            logger.error(f"Failed to inject Cookie menu: {e}")
            return False
    
    async def show_menu(self, page: Page) -> bool:
        """显示已注入的菜单"""
        try:
            await page.evaluate("""
                const menu = document.getElementById('webmonkey-cookie-menu');
                if (menu) {
                    menu.style.display = 'block';
                } else {
                    console.warn('Cookie menu not found, re-injecting...');
                    return false;
                }
            """)
            return True
        except Exception as e:
            logger.error(f"Failed to show Cookie menu: {e}")
            # 如果显示失败，尝试重新注入
            return await self.inject_menu(page)
    
    async def hide_menu(self, page: Page) -> bool:
        """隐藏菜单"""
        try:
            await page.evaluate("""
                const menu = document.getElementById('webmonkey-cookie-menu');
                if (menu) {
                    menu.style.display = 'none';
                }
            """)
            return True
        except Exception as e:
            logger.error(f"Failed to hide Cookie menu: {e}")
            return False
    
    async def remove_menu(self, page: Page) -> bool:
        """移除菜单"""
        try:
            await page.evaluate("""
                const menu = document.getElementById('webmonkey-cookie-menu');
                if (menu) {
                    menu.remove();
                }
                window.webMonkeyCookieMenu = false;
            """)
            self.menu_injected = False
            return True
        except Exception as e:
            logger.error(f"Failed to remove Cookie menu: {e}")
            return False