document.addEventListener('DOMContentLoaded', function() {
  const rulesList = document.getElementById('rules-list');
  const currentUrlElement = document.getElementById('current-url');
  const refreshUrlButton = document.getElementById('refresh-url');
  const addCurrentUrlButton = document.getElementById('add-current-url');
  const editCurrentUrlButton = document.getElementById('edit-current-url');
  const quickAddSection = document.getElementById('quick-add-section');
  const quickAddPattern = document.getElementById('quick-add-pattern');
  const quickAddName = document.getElementById('quick-add-name');
  const saveQuickAddButton = document.getElementById('save-quick-add');
  const cancelQuickAddButton = document.getElementById('cancel-quick-add');
  const importButton = document.getElementById('import-rules');
  const exportButton = document.getElementById('export-rules');
  const importFile = document.getElementById('import-file');
  const enableAllButton = document.getElementById('enable-all');
  const disableAllButton = document.getElementById('disable-all');
  const clearAllButton = document.getElementById('clear-all');
  const totalRulesElement = document.getElementById('total-rules');
  const enabledRulesElement = document.getElementById('enabled-rules');
  const disabledRulesElement = document.getElementById('disabled-rules');
  
  let currentUrl = '';
  let editingRuleId = null;
  let isEditingUrl = false;
  let currentRules = []; // 保存当前规则数据

  // 从URL中提取域名后第一根正斜杠之前的部分
// 从URL中提取域名后第一根正斜杠之前的部分（包含端口）
function extractDomainWithFirstPath(url) {
  try {
    const urlObj = new URL(url);
    let result = urlObj.hostname;
    
    // 添加端口（如果不是默认端口）
    if (urlObj.port && urlObj.port !== '' && 
        !(urlObj.protocol === 'https:' && urlObj.port === '443') &&
        !(urlObj.protocol === 'http:' && urlObj.port === '80')) {
      result += ':' + urlObj.port;
    }
    
    // 如果URL有路径且路径不是根路径
    if (urlObj.pathname && urlObj.pathname !== '/') {
      // 获取第一个路径段
      const firstSlashIndex = urlObj.pathname.indexOf('/', 0);
      if (firstSlashIndex !== -1) {
        // 截取到第一个正斜杠之前
        result += urlObj.pathname.substring(0, firstSlashIndex);
      } else {
        // 如果只有一个路径段，直接使用整个路径
        result += urlObj.pathname;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing URL:', error);
    // 如果URL解析失败，尝试简单的字符串处理
    const domainMatch = url.match(/^(https?:\/\/[^\/]+)/);
    if (domainMatch) {
      return domainMatch[1];
    }
    return url; // 如果都无法处理，返回原URL
  }
}

  // 获取当前标签页URL
  function getCurrentTabUrl() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url) {
        currentUrl = tabs[0].url;
        const extractedUrl = extractDomainWithFirstPath(currentUrl);
        
        if (!isEditingUrl) {
          currentUrlElement.value = extractedUrl;
          currentUrlElement.readOnly = true;
        }
      } else {
        currentUrlElement.value = '无法获取当前标签页URL';
      }
    });
  }

  // 初始化
  getCurrentTabUrl();
  loadRules();

  // 刷新URL
  refreshUrlButton.addEventListener('click', function() {
    isEditingUrl = false;
    currentUrlElement.readOnly = true;
    getCurrentTabUrl();
  });

  // 编辑URL
  editCurrentUrlButton.addEventListener('click', function() {
    isEditingUrl = true;
    currentUrlElement.readOnly = false;
    currentUrlElement.focus();
    currentUrlElement.select();
  });

  // 基于当前URL添加规则
  addCurrentUrlButton.addEventListener('click', function() {
    let urlToUse = '';
    
    if (isEditingUrl) {
      // 如果正在编辑，使用编辑框中的内容
      urlToUse = currentUrlElement.value;
    } else {
      // 否则使用提取后的URL
      urlToUse = extractDomainWithFirstPath(currentUrl);
    }
    
    if (!urlToUse) {
      alert('请先获取或输入URL');
      return;
    }
    
    // 显示快速添加区域
    quickAddPattern.textContent = urlToUse;
    quickAddName.value = '';
    quickAddSection.style.display = 'block';
    
    // 滚动到快速添加区域
    quickAddSection.scrollIntoView({ behavior: 'smooth' });
  });

  // 保存快速添加规则
  saveQuickAddButton.addEventListener('click', function() {
    const newName = quickAddName.value.trim();
    const urlToUse = quickAddPattern.textContent;
    
    if (!newName) {
      alert('请填写新标签名称');
      return;
    }

    const rule = {
      type: 'url',
      urlPattern: urlToUse,
      matchType: 'contains',
      newName: newName,
      enabled: true
    };

    saveRule(rule);
    quickAddSection.style.display = 'none';
  });

  // 取消快速添加
  cancelQuickAddButton.addEventListener('click', function() {
    quickAddSection.style.display = 'none';
  });

  // 导入规则
  importButton.addEventListener('click', function() {
    importFile.click();
  });

  importFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const rules = JSON.parse(event.target.result);
          importRules(rules);
        } catch (error) {
          alert('导入失败: 文件格式不正确');
        }
      };
      reader.readAsText(file);
    }
  });

  // 导出规则
  exportButton.addEventListener('click', function() {
    exportRules();
  });

  // 全部启用
  enableAllButton.addEventListener('click', function() {
    chrome.storage.local.get(['tabRenameRules'], function(result) {
      const rules = result.tabRenameRules || [];
      rules.forEach(rule => rule.enabled = true);
      chrome.storage.local.set({tabRenameRules: rules}, function() {
        loadRules();
      });
    });
  });

  // 全部禁用
  disableAllButton.addEventListener('click', function() {
    chrome.storage.local.get(['tabRenameRules'], function(result) {
      const rules = result.tabRenameRules || [];
      rules.forEach(rule => rule.enabled = false);
      chrome.storage.local.set({tabRenameRules: rules}, function() {
        loadRules();
      });
    });
  });

  // 清空规则
  clearAllButton.addEventListener('click', function() {
    if (confirm('确定要清空所有规则吗？此操作不可恢复！')) {
      chrome.storage.local.set({tabRenameRules: []}, function() {
        loadRules();
      });
    }
  });

  // 加载规则
  function loadRules() {
    chrome.storage.local.get(['tabRenameRules'], function(result) {
      currentRules = result.tabRenameRules || [];
      displayRules(currentRules);
      updateStats(currentRules);
    });
  }

  // 更新统计信息
  function updateStats(rules) {
    const total = rules.length;
    const enabled = rules.filter(rule => rule.enabled).length;
    const disabled = total - enabled;

    totalRulesElement.textContent = total;
    enabledRulesElement.textContent = enabled;
    disabledRulesElement.textContent = disabled;
  }

  // 显示规则列表
  function displayRules(rules) {
    rulesList.innerHTML = '';

    if (rules.length === 0) {
      rulesList.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
          <div style="font-size: 16px; margin-bottom: 8px;">暂无规则</div>
          <div style="font-size: 14px; color: #95a5a6;">点击"基于当前URL添加规则"创建第一条规则</div>
        </div>
      `;
      return;
    }

    rules.forEach((rule, index) => {
      const ruleItem = document.createElement('div');
      ruleItem.className = `rule-item ${rule.enabled ? 'enabled' : 'disabled'}`;
      ruleItem.setAttribute('data-index', index);
      
      // 检查是否正在编辑这个规则
      const isEditing = editingRuleId === index;

      if (isEditing) {
        // 编辑模式 - 在当前行显示编辑框
        ruleItem.innerHTML = `
          <div class="rule-info">
            <span class="rule-type">URL</span>
            <input type="text" class="edit-input edit-url" value="${rule.urlPattern}" placeholder="URL字符串" style="min-width: 200px;">
            <select class="edit-input edit-match-type">
              <option value="contains" ${rule.matchType === 'contains' ? 'selected' : ''}>包含</option>
              <option value="startsWith" ${rule.matchType === 'startsWith' ? 'selected' : ''}>开头</option>
              <option value="endsWith" ${rule.matchType === 'endsWith' ? 'selected' : ''}>结尾</option>
              <option value="regex" ${rule.matchType === 'regex' ? 'selected' : ''}>正则</option>
            </select>
            <span class="rule-arrow">→</span>
            <input type="text" class="edit-input edit-name" value="${rule.newName}" placeholder="新名称" style="min-width: 200px;">
          </div>
          <div class="rule-actions">
            <button class="btn-success btn-icon save-edit" data-index="${index}">保存</button>
            <button class="btn-secondary btn-icon cancel-edit" data-index="${index}">取消</button>
          </div>
        `;
      } else {
        // 正常显示模式
        ruleItem.innerHTML = `
          <div class="rule-info">
            <span class="rule-type">URL</span>
            <span class="rule-pattern">${rule.urlPattern}</span>
            <span class="rule-arrow">→</span>
            <span class="rule-name">${rule.newName}</span>
          </div>
          <div class="rule-actions">
            <label class="toggle-switch">
              <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-index="${index}">
              <span class="toggle-slider"></span>
            </label>
            <button class="btn-primary btn-icon edit-rule" data-index="${index}">编辑</button>
            <button class="btn-danger btn-icon delete-rule" data-index="${index}">删除</button>
          </div>
        `;
      }

      rulesList.appendChild(ruleItem);
    });

    // 绑定所有事件监听器
    bindEventListeners();
  }

  // 绑定事件监听器
  function bindEventListeners() {
    // 绑定切换开关事件
    document.querySelectorAll('.toggle-switch input').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const index = parseInt(this.getAttribute('data-index'));
        toggleRule(index);
      });
    });

    // 绑定编辑按钮事件
    document.querySelectorAll('.edit-rule').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        enterEditMode(index);
      });
    });

    // 绑定删除按钮事件
    document.querySelectorAll('.delete-rule').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        deleteRule(index);
      });
    });

    // 绑定保存编辑按钮事件
    document.querySelectorAll('.save-edit').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        saveEditFromButton(index);
      });
    });

    // 绑定取消编辑按钮事件
    document.querySelectorAll('.cancel-edit').forEach(button => {
      button.addEventListener('click', function() {
        editingRuleId = null;
        loadRules();
      });
    });
  }

  // 从按钮保存编辑
  function saveEditFromButton(index) {
    const ruleItem = document.querySelector(`.rule-item[data-index="${index}"]`);
    if (!ruleItem) {
      console.error('Could not find rule item for index:', index);
      return;
    }

    const urlPatternInput = ruleItem.querySelector('.edit-url');
    const matchTypeSelect = ruleItem.querySelector('.edit-match-type');
    const newNameInput = ruleItem.querySelector('.edit-name');

    if (!urlPatternInput || !matchTypeSelect || !newNameInput) {
      console.error('Could not find edit inputs for rule item:', index);
      console.log('Available inputs:', {
        urlPatternInput: ruleItem.querySelector('.edit-url'),
        matchTypeSelect: ruleItem.querySelector('.edit-match-type'),
        newNameInput: ruleItem.querySelector('.edit-name')
      });
      return;
    }

    const urlPattern = urlPatternInput.value.trim();
    const matchType = matchTypeSelect.value;
    const newName = newNameInput.value.trim();

    if (!urlPattern) {
      alert('请填写URL匹配字符串');
      return;
    }

    if (!newName) {
      alert('请填写新标签名称');
      return;
    }

    // 直接使用当前规则数据
    if (index < currentRules.length) {
      currentRules[index] = {
        ...currentRules[index],
        urlPattern: urlPattern,
        matchType: matchType,
        newName: newName
      };

      chrome.storage.local.set({tabRenameRules: currentRules}, function() {
        console.log('Rule updated successfully:', currentRules[index]);
        editingRuleId = null;
        loadRules();
      });
    } else {
      console.error('Rule index out of bounds:', index);
    }
  }

  // 进入编辑模式
  function enterEditMode(index) {
    editingRuleId = index;
    loadRules();
  }

  // 保存规则
// 保存规则
function saveRule(rule) {
  chrome.storage.local.get(['tabRenameRules'], function(result) {
    const rules = result.tabRenameRules || [];
    // 将新规则添加到数组开头
    rules.unshift(rule);
    chrome.storage.local.set({tabRenameRules: rules}, function() {
      console.log('Rule saved:', rule);
      loadRules();
    });
  });
}

  // 切换规则状态
  function toggleRule(index) {
    chrome.storage.local.get(['tabRenameRules'], function(result) {
      const rules = result.tabRenameRules || [];
      if (index < rules.length) {
        rules[index].enabled = !rules[index].enabled;
        chrome.storage.local.set({tabRenameRules: rules}, function() {
          loadRules();
        });
      }
    });
  }

  // 删除规则
  function deleteRule(index) {
    if (confirm('确定要删除此规则吗？')) {
      chrome.storage.local.get(['tabRenameRules'], function(result) {
        const rules = result.tabRenameRules || [];
        if (index < rules.length) {
          rules.splice(index, 1);
          chrome.storage.local.set({tabRenameRules: rules}, function() {
            loadRules();
          });
        }
      });
    }
  }

  // 导入规则
  function importRules(newRules) {
    if (Array.isArray(newRules)) {
      // 确保导入的规则有正确的type字段
      const validatedRules = newRules.map(rule => {
        if (!rule.type) {
          rule.type = 'url';
        }
        return rule;
      });

      chrome.storage.local.set({tabRenameRules: validatedRules}, function() {
        loadRules();
        alert(`成功导入 ${validatedRules.length} 条规则`);
      });
    } else {
      alert('导入失败: 规则格式不正确');
    }
  }

  // 导出规则
  function exportRules() {
    chrome.storage.local.get(['tabRenameRules'], function(result) {
      const rules = result.tabRenameRules || [];
      if (rules.length === 0) {
        alert('没有规则可以导出');
        return;
      }

      const dataStr = JSON.stringify(rules, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `tab-rename-rules-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });
  }
});