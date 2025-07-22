"""
Cookie Service - Cookie管理服务
职责：存储、检索、管理按域名分类的Cookie数据
通信：接收WebSocket和HTTP请求，维护Cookie数据库

🚨 此文件严格限制在500行以内 - 细菌化原则
"""

import json
import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class CookieData:
    """Cookie数据模型"""
    
    def __init__(self, name: str, value: str, domain: str, path: str = "/", 
                 expires: Optional[float] = None, http_only: bool = False,
                 secure: bool = False, same_site: Optional[str] = None):
        self.name = name
        self.value = value
        self.domain = domain
        self.path = path
        self.expires = expires
        self.http_only = http_only
        self.secure = secure
        self.same_site = same_site
        
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'name': self.name,
            'value': self.value,
            'domain': self.domain,
            'path': self.path,
            'expires': self.expires,
            'httpOnly': self.http_only,
            'secure': self.secure,
            'sameSite': self.same_site
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CookieData':
        """从字典创建CookieData对象"""
        return cls(
            name=data['name'],
            value=data['value'],
            domain=data['domain'],
            path=data.get('path', '/'),
            expires=data.get('expires'),
            http_only=data.get('httpOnly', False),
            secure=data.get('secure', False),
            same_site=data.get('sameSite')
        )


class DomainCookies:
    """域名Cookie集合"""
    
    def __init__(self, domain: str, cookies: List[CookieData], 
                 saved_at: str, url: str):
        self.domain = domain
        self.cookies = cookies
        self.saved_at = saved_at
        self.url = url
        
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'domain': self.domain,
            'cookies': [cookie.to_dict() for cookie in self.cookies],
            'savedAt': self.saved_at,
            'url': self.url
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DomainCookies':
        """从字典创建DomainCookies对象"""
        cookies = [CookieData.from_dict(cookie_data) 
                  for cookie_data in data['cookies']]
        return cls(
            domain=data['domain'],
            cookies=cookies,
            saved_at=data['savedAt'],
            url=data['url']
        )


class CookieService:
    """Cookie管理服务"""
    
    def __init__(self, storage_path: str = "cookies.db"):
        self.storage_path = Path(storage_path)
        self.db_path = self.storage_path
        self._init_database()
        
    def _init_database(self) -> None:
        """初始化数据库"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS domain_cookies (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        domain TEXT NOT NULL,
                        cookies_json TEXT NOT NULL,
                        saved_at TEXT NOT NULL,
                        url TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # 创建域名索引
                cursor.execute('''
                    CREATE INDEX IF NOT EXISTS idx_domain 
                    ON domain_cookies(domain)
                ''')
                
                conn.commit()
                logger.info(f"Cookie database initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"Failed to initialize cookie database: {e}")
            raise
    
    def extract_main_domain(self, hostname: str) -> str:
        """提取主域名"""
        # 处理localhost和IP地址
        if hostname == 'localhost' or self._is_ip_address(hostname):
            return hostname
            
        parts = hostname.split('.')
        # 对于常规域名，保留最后两部分
        if len(parts) >= 2:
            return '.'.join(parts[-2:])
        return hostname
    
    def _is_ip_address(self, hostname: str) -> bool:
        """检查是否为IP地址"""
        try:
            parts = hostname.split('.')
            return len(parts) == 4 and all(0 <= int(part) <= 255 for part in parts)
        except (ValueError, AttributeError):
            return False
    
    def extract_domain_from_url(self, url: str) -> str:
        """从URL提取主域名"""
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname or parsed.netloc
            return self.extract_main_domain(hostname)
        except Exception:
            return url
    
    async def save_cookies(self, domain_cookies_data: Dict[str, Any]) -> Dict[str, Any]:
        """保存Cookie到数据库"""
        try:
            domain_cookies = DomainCookies.from_dict(domain_cookies_data)
            main_domain = self.extract_main_domain(domain_cookies.domain)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 检查是否已存在该域名的记录
                cursor.execute(
                    'SELECT id FROM domain_cookies WHERE domain = ?',
                    (main_domain,)
                )
                existing = cursor.fetchone()
                
                cookies_json = json.dumps([cookie.to_dict() for cookie in domain_cookies.cookies])
                current_time = datetime.now().isoformat()
                
                if existing:
                    # 更新现有记录
                    cursor.execute('''
                        UPDATE domain_cookies 
                        SET cookies_json = ?, saved_at = ?, url = ?, updated_at = ?
                        WHERE domain = ?
                    ''', (cookies_json, domain_cookies.saved_at, domain_cookies.url, 
                          current_time, main_domain))
                    logger.info(f"Updated cookies for domain: {main_domain}")
                else:
                    # 插入新记录
                    cursor.execute('''
                        INSERT INTO domain_cookies 
                        (domain, cookies_json, saved_at, url, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (main_domain, cookies_json, domain_cookies.saved_at, 
                          domain_cookies.url, current_time, current_time))
                    logger.info(f"Saved cookies for new domain: {main_domain}")
                
                conn.commit()
                
                return {
                    'success': True,
                    'message': f'Saved {len(domain_cookies.cookies)} cookies for {main_domain}',
                    'domain': main_domain,
                    'cookie_count': len(domain_cookies.cookies)
                }
                
        except Exception as e:
            logger.error(f"Failed to save cookies: {e}")
            return {
                'success': False,
                'error': f'Failed to save cookies: {str(e)}'
            }
    
    async def load_cookies(self, domain: str) -> Dict[str, Any]:
        """从数据库加载Cookie"""
        try:
            main_domain = self.extract_main_domain(domain)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT cookies_json, saved_at, url, updated_at
                    FROM domain_cookies 
                    WHERE domain = ?
                    ORDER BY updated_at DESC
                    LIMIT 1
                ''', (main_domain,))
                
                result = cursor.fetchone()
                
                if not result:
                    return {
                        'success': False,
                        'error': f'No cookies found for domain: {main_domain}'
                    }
                
                cookies_json, saved_at, url, updated_at = result
                cookies_data = json.loads(cookies_json)
                
                # 创建DomainCookies对象
                domain_cookies = DomainCookies(
                    domain=main_domain,
                    cookies=[CookieData.from_dict(cookie_data) for cookie_data in cookies_data],
                    saved_at=saved_at,
                    url=url
                )
                
                logger.info(f"Loaded {len(domain_cookies.cookies)} cookies for {main_domain}")
                
                return {
                    'success': True,
                    'data': domain_cookies.to_dict(),
                    'loaded_at': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to load cookies for {domain}: {e}")
            return {
                'success': False,
                'error': f'Failed to load cookies: {str(e)}'
            }
    
    async def get_domains(self) -> Dict[str, Any]:
        """获取所有存储的域名列表"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT domain, COUNT(*) as cookie_count, 
                           MAX(updated_at) as last_updated
                    FROM domain_cookies
                    GROUP BY domain
                    ORDER BY last_updated DESC
                ''')
                
                domains = []
                for row in cursor.fetchall():
                    domains.append({
                        'domain': row[0],
                        'cookie_count': row[1],
                        'last_updated': row[2]
                    })
                
                return {
                    'success': True,
                    'domains': domains,
                    'total_domains': len(domains)
                }
                
        except Exception as e:
            logger.error(f"Failed to get domains: {e}")
            return {
                'success': False,
                'error': f'Failed to get domains: {str(e)}'
            }
    
    async def delete_cookies(self, domain: str) -> Dict[str, Any]:
        """删除指定域名的Cookie"""
        try:
            main_domain = self.extract_main_domain(domain)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM domain_cookies WHERE domain = ?', (main_domain,))
                
                if cursor.rowcount > 0:
                    conn.commit()
                    logger.info(f"Deleted cookies for domain: {main_domain}")
                    return {
                        'success': True,
                        'message': f'Deleted cookies for {main_domain}'
                    }
                else:
                    return {
                        'success': False,
                        'error': f'No cookies found for domain: {main_domain}'
                    }
                    
        except Exception as e:
            logger.error(f"Failed to delete cookies for {domain}: {e}")
            return {
                'success': False,
                'error': f'Failed to delete cookies: {str(e)}'
            }
    
    async def cleanup_expired_cookies(self, days: int = 30) -> Dict[str, Any]:
        """清理过期的Cookie记录"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    DELETE FROM domain_cookies 
                    WHERE updated_at < ?
                ''', (cutoff_date,))
                
                deleted_count = cursor.rowcount
                conn.commit()
                
                logger.info(f"Cleaned up {deleted_count} expired cookie records")
                
                return {
                    'success': True,
                    'deleted_count': deleted_count,
                    'message': f'Cleaned up {deleted_count} expired records'
                }
                
        except Exception as e:
            logger.error(f"Failed to cleanup expired cookies: {e}")
            return {
                'success': False,
                'error': f'Failed to cleanup: {str(e)}'
            }
    
    def close(self) -> None:
        """关闭服务"""
        logger.info("Cookie service closed")