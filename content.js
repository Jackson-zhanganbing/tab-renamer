// content.js
(function() {
  'use strict';
  
  let customTitle = null;
  
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setTitle' && request.title) {
      setPersistentTitle(request.title);
      sendResponse({ success: true });
    }
  });
  
  function setPersistentTitle(title) {
    customTitle = title;
    
    // 立即设置标题
    document.title = title;
    
    // 重写title属性
    overrideTitleProperty();
    
    // 监控DOM变化
    monitorTitleChanges();
    
    console.log('Tab title set persistently to:', title);
  }
  
  function overrideTitleProperty() {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
    
    if (originalDescriptor) {
      Object.defineProperty(document, 'title', {
        get: function() {
          return customTitle || originalDescriptor.get.call(document);
        },
        set: function(value) {
          // 忽略任何尝试修改title的操作
          if (customTitle) {
            updateTitleElement(customTitle);
          }
          return customTitle;
        }
      });
    }
  }
  
  function monitorTitleChanges() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeName === 'TITLE') {
              node.textContent = customTitle;
            }
          });
        }
      });
      
      // 检查title元素
      const titleElement = document.querySelector('title');
      if (titleElement && titleElement.textContent !== customTitle) {
        titleElement.textContent = customTitle;
      }
    });
    
    observer.observe(document, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  function updateTitleElement(title) {
    let titleElement = document.querySelector('title');
    if (!titleElement) {
      titleElement = document.createElement('title');
      document.head.appendChild(titleElement);
    }
    titleElement.textContent = title;
  }
  
  // 初始化时检查是否有需要设置的标题
  chrome.runtime.sendMessage({ action: 'getTitle' }, (response) => {
    if (response && response.title) {
      setPersistentTitle(response.title);
    }
  });
  
})();