// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    checkAndRenameTab(tabId, tab.url);
  }
});

// 监听标签页创建
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url) {
    console.log('Tab created:', tab.url);
    setTimeout(() => {
      checkAndRenameTab(tab.id, tab.url);
    }, 1000);
  }
});

// 检查并重命名标签页
async function checkAndRenameTab(tabId, url) {
  try {
    const result = await chrome.storage.local.get(['tabRenameRules']);
    const rules = result.tabRenameRules || [];
    
    console.log('Checking rules for URL:', url);
    console.log('Available rules:', rules);

    // 查找所有匹配的规则
    const matchedRules = [];
    for (const rule of rules) {
      if (rule.enabled && matchesRule(url, rule)) {
        console.log('Rule matched:', rule);
        matchedRules.push(rule);
      }
    }

    // 如果有多个匹配规则，选择最长的urlPattern
    if (matchedRules.length > 0) {
      let bestRule = matchedRules[0];
      
      if (matchedRules.length > 1) {
        // 按urlPattern长度排序，选择最长的
        matchedRules.sort((a, b) => b.urlPattern.length - a.urlPattern.length);
        bestRule = matchedRules[0];
        console.log('Multiple rules matched, selected longest pattern:', bestRule.urlPattern);
      }

      try {
        // 方法1：使用 scripting.executeScript（Manifest V3 推荐）
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: setTabTitle,
          args: [bestRule.newName]
        });
        console.log('Tab title updated via scripting:', bestRule.newName);
      } catch (scriptError) {
        console.log('Scripting failed, using tabs API:', scriptError);
        
        // 方法2：备用方案 - 使用 tabs API
        // 注意：这种方法可能在某些网站上受限
        await chrome.tabs.update(tabId, { 
          title: bestRule.newName 
        });
        console.log('Tab title updated via tabs API:', bestRule.newName);
      }
    }
  } catch (error) {
    console.error('Error in checkAndRenameTab:', error);
  }
}

// 在页面上下文中执行的函数
function setTabTitle(newTitle) {
  document.title = newTitle;
}

// 检查是否匹配规则
function matchesRule(url, rule) {
  try {
    console.log('Matching rule:', rule.matchType, 'for URL:', url);
    
    if (rule.type === 'url') {
      return matchesURLRule(url, rule);
    }
    
    return false;
  } catch (error) {
    console.error('Error matching rule:', error);
    return false;
  }
}

// URL字符串匹配逻辑
function matchesURLRule(url, rule) {
  try {
    const fullUrl = url.toLowerCase();
    const pattern = rule.urlPattern.toLowerCase();
    
    console.log('URL Rule - Full URL:', fullUrl);
    console.log('URL Pattern:', pattern, 'Match Type:', rule.matchType);

    switch (rule.matchType) {
      case 'contains':
        return fullUrl.includes(pattern);
      case 'startsWith':
        return fullUrl.startsWith(pattern);
      case 'endsWith':
        return fullUrl.endsWith(pattern);
      case 'regex':
        try {
          const regex = new RegExp(pattern);
          return regex.test(fullUrl);
        } catch (e) {
          console.error('Invalid regex pattern:', pattern);
          return false;
        }
      default:
        return fullUrl.includes(pattern);
    }
  } catch (error) {
    console.error('Error in URL rule matching:', error);
    return false;
  }
}

// 监听存储变化，重新应用规则
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.tabRenameRules) {
    console.log('Rules updated, reapplying to all tabs');
    // 重新检查所有标签页
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url) {
          checkAndRenameTab(tab.id, tab.url);
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTitle' && sender.tab) {
    // 检查这个标签页是否有匹配的规则
    checkAndSendTitle(sender.tab.id, sender.tab.url, sendResponse);
    return true; // 保持消息通道开放
  }
});

async function checkAndSendTitle(tabId, url, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['tabRenameRules']);
    const rules = result.tabRenameRules || [];
    
    // 查找所有匹配的规则
    const matchedRules = [];
    for (const rule of rules) {
      if (rule.enabled && matchesRule(url, rule)) {
        matchedRules.push(rule);
      }
    }

    // 如果有多个匹配规则，选择最长的urlPattern
    if (matchedRules.length > 0) {
      let bestRule = matchedRules[0];
      
      if (matchedRules.length > 1) {
        // 按urlPattern长度排序，选择最长的
        matchedRules.sort((a, b) => b.urlPattern.length - a.urlPattern.length);
        bestRule = matchedRules[0];
      }
      
      sendResponse({ title: bestRule.newName });
    } else {
      sendResponse({ title: null });
    }
  } catch (error) {
    console.error('Error in checkAndSendTitle:', error);
    sendResponse({ title: null });
  }
}