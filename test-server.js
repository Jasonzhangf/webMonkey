const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建HTTP服务器提供Web界面
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'test-ui.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading test UI');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/test-page') {
    fs.readFile(path.join(__dirname, 'test-page.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading test page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/simple-test') {
    fs.readFile(path.join(__dirname, 'simple-test.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading simple test page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/logs') {
    // 返回当前日志
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(messageLog));
  } else if (req.url === '/current-tab-id') {
    // 返回当前标签页ID
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tabId: currentTabId }));
  } else if (req.url === '/clear-logs' && req.method === 'POST') {
    // 清除日志
    messageLog.length = 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (req.url === '/send' && req.method === 'POST') {
    // 发送消息
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const message = JSON.parse(body);
        broadcast(message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// 存储收到的消息和当前标签页ID
const messageLog = [];
const clients = new Set();
let currentTabId = null;

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Plugin connected');
  clients.add(ws);
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    id: generateId(),
    type: 'connection_status',
    timestamp: new Date().toISOString(),
    source: 'orchestrator',
    target: 'plugin',
    payload: {
      status: 'connected',
      message: 'Connected to test orchestrator'
    }
  }));
  
  // 处理来自插件的消息
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Received message:', parsedMessage);
      
      // 记录消息
      messageLog.push({
        time: new Date().toISOString(),
        direction: 'received',
        message: parsedMessage
      });
      
      // 如果消息包含标签页ID，记录它
      if (parsedMessage.tab_id) {
        currentTabId = parsedMessage.tab_id;
        console.log(`Current tab ID updated: ${currentTabId}`);
      }
      
      // 自动响应某些消息类型
      handleMessage(parsedMessage, ws);
      
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Plugin disconnected');
    clients.delete(ws);
  });
});

// 处理特定类型的消息
function handleMessage(message, ws) {
  // 如果是插件状态消息，发送确认
  if (message.type === 'plugin_status') {
    ws.send(JSON.stringify({
      id: generateId(),
      type: 'connection_status',
      timestamp: new Date().toISOString(),
      source: 'orchestrator',
      target: 'plugin',
      node_id: message.node_id || '',
      payload: {
        node_id: message.node_id || '',
        status: 'connected'
      }
    }));
  }
}

// 生成唯一ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// 向所有客户端广播消息
function broadcast(message) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
  
  // 记录发送的消息
  messageLog.push({
    time: new Date().toISOString(),
    direction: 'sent',
    message
  });
}

// 启动服务器
const PORT = 8765;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
});

// 导出广播函数供外部使用
module.exports = { broadcast };