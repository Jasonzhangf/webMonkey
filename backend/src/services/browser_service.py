# webMonkey/backend/src/services/browser_service.py
import asyncio
import logging
from typing import Optional, Dict, Any
from urllib.parse import urlparse
from playwright.async_api import async_playwright, Browser, Page, BrowserContext

from .cookie_service import CookieService, CookieData
from ..utils.browser_menu_injector import BrowserMenuInjector

logger = logging.getLogger(__name__)

class BrowserService:
    """Manages browser instances using Playwright with automatic Cookie management."""

    def __init__(self):
        self.playwright = None
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None
        self.cookie_service = CookieService()
        self.menu_injector = BrowserMenuInjector(self.cookie_service)
        self._is_running = False
        self.auto_cookie_loading = True  # Enable automatic Cookie loading
        self.headless_mode = False  # Track headless mode

    async def start(self, headless: bool = False):
        """Starts the browser service and launches a persistent browser instance."""
        if self._is_running:
            return
        logger.info("Starting BrowserService...")
        try:
            self.headless_mode = headless
            self.playwright = await async_playwright().start()
            # We use Firefox to be compatible with Camoufox
            self.browser = await self.playwright.firefox.launch(headless=headless)
            
            # Create a persistent context for Cookie management
            self.context = await self.browser.new_context()
            
            self._is_running = True
            logger.info(f"BrowserService started (headless={headless}) and Firefox browser launched.")
        except Exception as e:
            logger.error(f"Failed to start BrowserService or launch browser: {e}")
            raise

    async def stop(self):
        """Stops the browser service and closes the browser instance."""
        logger.info("Stopping BrowserService...")
        if self.context:
            await self.context.close()
            logger.info("Browser context closed.")
        if self.browser:
            await self.browser.close()
            logger.info("Browser closed.")
        if self.playwright:
            await self.playwright.stop()
            logger.info("Playwright stopped.")
        self.browser = None
        self.context = None
        self.playwright = None
        self._is_running = False
        logger.info("BrowserService stopped.")
    
    def is_running(self) -> bool:
        """Check if the browser service is running."""
        return self._is_running

    async def get_page(self) -> Page:
        """Gets a new page from the browser context.

        Returns:
            A new browser page with automatic Cookie loading capability.
        
        Raises:
            Exception: If the browser is not running.
        """
        if not self.context:
            raise Exception("Browser context is not available. Cannot get a page.")
        
        page = await self.context.new_page()
        
        # Set up automatic Cookie loading for this page
        if self.auto_cookie_loading:
            page.on('request', self._handle_page_request)
        
        # Inject Cookie management menu in non-headless mode
        if not self.headless_mode:
            page.on('load', lambda: self._inject_cookie_menu(page))
            
        return page
    
    async def _handle_page_request(self, request):
        """处理页面请求，自动加载对应域名的Cookie"""
        try:
            url = request.url
            domain = self.cookie_service.extract_domain_from_url(url)
            
            # 只处理主页面请求（非资源请求）
            if request.resource_type == 'document':
                await self._load_cookies_for_domain(domain)
                
        except Exception as e:
            logger.warning(f"Failed to auto-load cookies for request {request.url}: {e}")
    
    async def _load_cookies_for_domain(self, domain: str) -> bool:
        """为指定域名加载Cookie"""
        try:
            result = await self.cookie_service.load_cookies(domain)
            
            if result['success'] and result.get('data'):
                domain_cookies = result['data']
                cookies = domain_cookies['cookies']
                
                # 转换Cookie格式为Playwright格式
                playwright_cookies = []
                for cookie in cookies:
                    playwright_cookie = {
                        'name': cookie['name'],
                        'value': cookie['value'],
                        'domain': cookie['domain'],
                        'path': cookie.get('path', '/'),
                        'httpOnly': cookie.get('httpOnly', False),
                        'secure': cookie.get('secure', False),
                        'sameSite': cookie.get('sameSite', 'Lax')
                    }
                    
                    # 添加过期时间（如果存在）
                    if cookie.get('expires'):
                        playwright_cookie['expires'] = cookie['expires']
                        
                    playwright_cookies.append(playwright_cookie)
                
                # 将Cookie添加到浏览器上下文
                await self.context.add_cookies(playwright_cookies)
                
                logger.info(f"✅ Automatically loaded {len(cookies)} cookies for domain: {domain}")
                return True
                
        except Exception as e:
            logger.warning(f"Failed to load cookies for domain {domain}: {e}")
            return False
    
    async def navigate_with_cookies(self, page: Page, url: str) -> bool:
        """导航到URL并自动加载相应的Cookie"""
        try:
            domain = self.cookie_service.extract_domain_from_url(url)
            
            # 先加载Cookie，再导航
            await self._load_cookies_for_domain(domain)
            
            # 导航到目标页面
            await page.goto(url, wait_until='domcontentloaded')
            
            logger.info(f"Successfully navigated to {url} with cookies loaded")
            return True
            
        except Exception as e:
            logger.error(f"Failed to navigate to {url} with cookies: {e}")
            return False
    
    async def save_page_cookies(self, page: Page) -> bool:
        """保存当前页面的Cookie到数据库"""
        try:
            url = page.url
            domain = self.cookie_service.extract_domain_from_url(url)
            
            # 获取当前页面的所有Cookie
            cookies = await self.context.cookies()
            
            # 过滤出当前域名的Cookie
            domain_cookies = [
                cookie for cookie in cookies 
                if domain in cookie.get('domain', '') or cookie.get('domain', '').endswith('.' + domain)
            ]
            
            if not domain_cookies:
                logger.info(f"No cookies found for domain: {domain}")
                return False
            
            # 转换为CookieService格式
            cookie_data_list = []
            for cookie in domain_cookies:
                cookie_data = {
                    'name': cookie['name'],
                    'value': cookie['value'],
                    'domain': cookie['domain'],
                    'path': cookie.get('path', '/'),
                    'expires': cookie.get('expires'),
                    'httpOnly': cookie.get('httpOnly', False),
                    'secure': cookie.get('secure', False),
                    'sameSite': cookie.get('sameSite', 'Lax')
                }
                cookie_data_list.append(cookie_data)
            
            # 构建保存格式
            save_data = {
                'domain': domain,
                'cookies': cookie_data_list,
                'savedAt': asyncio.get_event_loop().time(),
                'url': url
            }
            
            # 保存到数据库
            result = await self.cookie_service.save_cookies(save_data)
            
            if result['success']:
                logger.info(f"✅ Saved {len(cookie_data_list)} cookies for domain: {domain}")
                return True
            else:
                logger.error(f"Failed to save cookies: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to save page cookies: {e}")
            return False
    
    def set_auto_cookie_loading(self, enabled: bool) -> None:
        """启用或禁用自动Cookie加载"""
        self.auto_cookie_loading = enabled
        logger.info(f"Auto cookie loading {'enabled' if enabled else 'disabled'}")
    
    async def clear_cookies(self, domain: Optional[str] = None) -> bool:
        """清除Cookie"""
        try:
            if domain:
                # 清除特定域名的Cookie
                cookies = await self.context.cookies()
                for cookie in cookies:
                    if domain in cookie.get('domain', ''):
                        await self.context.clear_cookies(
                            name=cookie['name'],
                            domain=cookie['domain'],
                            path=cookie.get('path', '/')
                        )
                logger.info(f"Cleared cookies for domain: {domain}")
            else:
                # 清除所有Cookie
                await self.context.clear_cookies()
                logger.info("Cleared all cookies")
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear cookies: {e}")
            return False
    
    async def _inject_cookie_menu(self, page: Page) -> None:
        """在非无头模式下注入Cookie管理菜单"""
        try:
            # 等待页面加载完成
            await page.wait_for_load_state('domcontentloaded')
            
            # 注入菜单（自动隐藏3秒后显示）
            await self.menu_injector.inject_menu(page, auto_hide=True)
            
        except Exception as e:
            logger.warning(f"Failed to inject Cookie menu: {e}")
    
    async def show_cookie_menu(self, page: Page) -> bool:
        """显示Cookie管理菜单"""
        if self.headless_mode:
            logger.warning("Cannot show Cookie menu in headless mode")
            return False
        
        return await self.menu_injector.show_menu(page)
    
    async def hide_cookie_menu(self, page: Page) -> bool:
        """隐藏Cookie管理菜单"""
        return await self.menu_injector.hide_menu(page)
    
    async def remove_cookie_menu(self, page: Page) -> bool:
        """移除Cookie管理菜单"""
        return await self.menu_injector.remove_menu(page)
    
    def is_headless(self) -> bool:
        """检查是否为无头模式"""
        return self.headless_mode

