/**
 * Cookie Manager - Cookie管理器
 * 职责：管理网站Cookie的保存、加载和与后端的同步
 * 
 * 🚨 此文件严格限制在500行以内 - 细菌化原则
 */

export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface DomainCookies {
  domain: string;
  cookies: CookieData[];
  savedAt: string;
  url: string;
}

export interface CookieManagerOptions {
  onCookiesSaved?: (domain: string, cookies: CookieData[]) => void;
  onCookiesLoaded?: (domain: string, cookies: CookieData[]) => void;
  onError?: (error: string) => void;
}

export class CookieManager {
  private options: CookieManagerOptions;
  private currentDomain: string;

  constructor(options: CookieManagerOptions = {}) {
    this.options = options;
    this.currentDomain = this.extractMainDomain(window.location.hostname);
  }

  // 提取主域名
  private extractMainDomain(hostname: string): string {
    // 移除子域名，保留主域名
    const parts = hostname.split('.');
    
    // 处理localhost和IP地址
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return hostname;
    }
    
    // 对于常规域名，保留最后两部分（例如: example.com）
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    
    return hostname;
  }

  // 获取当前网站的所有Cookie
  public async getCurrentSiteCookies(): Promise<CookieData[]> {
    return new Promise((resolve, reject) => {
      try {
        // 使用chrome.cookies API获取当前域名的所有cookie
        chrome.cookies.getAll({ domain: this.currentDomain }, (cookies) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          const cookieData: CookieData[] = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expirationDate,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite as 'Strict' | 'Lax' | 'None'
          }));

          resolve(cookieData);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // 保存当前网站Cookie到后端
  public async saveCookiesToBackend(): Promise<void> {
    try {
      const cookies = await this.getCurrentSiteCookies();
      
      const domainCookies: DomainCookies = {
        domain: this.currentDomain,
        cookies: cookies,
        savedAt: new Date().toISOString(),
        url: window.location.href
      };

      // 发送到后端服务器
      const response = await this.sendToBackend('SAVE_COOKIES', domainCookies);
      
      if (response.success) {
        console.log(`✅ Successfully saved ${cookies.length} cookies for domain: ${this.currentDomain}`);
        this.options.onCookiesSaved?.(this.currentDomain, cookies);
        
        // 显示成功提示
        this.showNotification(`🍪 已保存 ${cookies.length} 个Cookie`, 'success');
      } else {
        throw new Error(response.error || 'Failed to save cookies');
      }
    } catch (error) {
      const errorMsg = `保存Cookie失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      this.options.onError?.(errorMsg);
      this.showNotification('❌ Cookie保存失败', 'error');
    }
  }

  // 从后端加载Cookie到当前网站
  public async loadCookiesFromBackend(): Promise<void> {
    try {
      const response = await this.sendToBackend('LOAD_COOKIES', { 
        domain: this.currentDomain,
        url: window.location.href
      });

      if (response.success && response.data) {
        const domainCookies = response.data as DomainCookies;
        
        // 设置Cookie到浏览器
        await this.setCookiesToBrowser(domainCookies.cookies);
        
        console.log(`✅ Successfully loaded ${domainCookies.cookies.length} cookies for domain: ${this.currentDomain}`);
        this.options.onCookiesLoaded?.(this.currentDomain, domainCookies.cookies);
        
        // 显示成功提示
        this.showNotification(`🍪 已加载 ${domainCookies.cookies.length} 个Cookie`, 'success');
        
        // 刷新页面以应用Cookie
        if (confirm('Cookie已加载，是否刷新页面以应用更改？')) {
          window.location.reload();
        }
      } else {
        throw new Error(response.error || 'No cookies found for this domain');
      }
    } catch (error) {
      const errorMsg = `加载Cookie失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      this.options.onError?.(errorMsg);
      this.showNotification('❌ Cookie加载失败', 'error');
    }
  }

  // 设置Cookie到浏览器
  private async setCookiesToBrowser(cookies: CookieData[]): Promise<void> {
    const setPromises = cookies.map(cookie => {
      return new Promise<void>((resolve, reject) => {
        const cookieDetails: chrome.cookies.SetDetails = {
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expirationDate: cookie.expires
        };

        // 处理sameSite属性
        if (cookie.sameSite) {
          (cookieDetails as any).sameSite = cookie.sameSite;
        }

        chrome.cookies.set(cookieDetails, (result) => {
          if (chrome.runtime.lastError) {
            console.warn(`Failed to set cookie ${cookie.name}:`, chrome.runtime.lastError.message);
            // 不要拒绝单个cookie的失败，继续设置其他cookie
          }
          resolve();
        });
      });
    });

    await Promise.all(setPromises);
  }

  // 发送消息到后端
  private async sendToBackend(action: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // 通过background script发送到后端
      chrome.runtime.sendMessage({
        type: 'BACKEND_REQUEST',
        action: action,
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  // 显示通知
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '2147483648';
    notification.style.background = type === 'success' ? '#4CAF50' : 
                                   type === 'error' ? '#f44336' : '#2196F3';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = 'bold';
    notification.style.transition = 'all 0.3s ease';
    notification.style.cursor = 'pointer';
    notification.textContent = message;

    // 点击关闭
    notification.onclick = () => {
      notification.remove();
    };

    document.body.appendChild(notification);

    // 3秒后自动关闭
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 3000);
  }

  // 获取Cookie统计信息
  public async getCookieStats(): Promise<{
    domain: string;
    totalCookies: number;
    httpOnlyCookies: number;
    secureCookies: number;
    sessionCookies: number;
    persistentCookies: number;
  }> {
    const cookies = await this.getCurrentSiteCookies();
    
    return {
      domain: this.currentDomain,
      totalCookies: cookies.length,
      httpOnlyCookies: cookies.filter(c => c.httpOnly).length,
      secureCookies: cookies.filter(c => c.secure).length,
      sessionCookies: cookies.filter(c => !c.expires).length,
      persistentCookies: cookies.filter(c => c.expires).length
    };
  }

  // 清除当前域名的所有Cookie
  public async clearCurrentDomainCookies(): Promise<void> {
    try {
      const cookies = await this.getCurrentSiteCookies();
      
      const removePromises = cookies.map(cookie => {
        return new Promise<void>((resolve) => {
          chrome.cookies.remove({
            url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
            name: cookie.name
          }, () => {
            resolve();
          });
        });
      });

      await Promise.all(removePromises);
      
      this.showNotification(`🗑️ 已清除 ${cookies.length} 个Cookie`, 'info');
      
      // 刷新页面
      if (confirm('Cookie已清除，是否刷新页面？')) {
        window.location.reload();
      }
    } catch (error) {
      const errorMsg = `清除Cookie失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      this.options.onError?.(errorMsg);
      this.showNotification('❌ Cookie清除失败', 'error');
    }
  }

  // 获取当前主域名
  public getCurrentDomain(): string {
    return this.currentDomain;
  }
}