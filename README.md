Tab Renamer Pro 🏷️
https://img.shields.io/badge/Chrome-Web%2520Store-blue?logo=googlechrome
https://img.shields.io/badge/License-MIT-green.svg
https://img.shields.io/badge/PRs-welcome-brightgreen.svg

智能浏览器标签页重命名工具 - 解决多IP环境管理难题，让运维、测试、开发工作更高效

🌟 特性
🚀 核心功能
智能URL匹配 - 自动识别IP和域名环境

最长匹配规则 - 多个规则匹配时选择最精确的

实时重命名 - 标签页创建或更新时立即生效

持久化标题 - 防止网页动态修改标题

🛠️ 便捷管理
可视化规则编辑 - 直观的规则管理界面

一键导入导出 - 快速备份和分享规则配置

批量操作 - 支持启用/禁用/清空所有规则

离线运行 - 所有数据本地存储，保护隐私

🎯 适用场景
text
🔧 运维工程师 - 管理10+套环境IP不再混乱
🧪 测试人员 - 清晰区分测试/预生产/生产环境  
💻 开发人员 - 本地开发、联调环境一目了然
☁️ SaaS客服 - 快速识别客户专属环境
📸 界面预览
<img width="800" height="600" alt="image" src="https://github.com/user-attachments/assets/b7e1ca17-275a-41b6-a1f4-b8bcb0de90e6" />

简洁直观的规则管理界面

![Uploading image.png…]()

基于当前URL快速添加规则

🚀 安装方式
Chrome 浏览器
访问 Chrome Web Store 搜索 "Tab Renamer Pro"

点击"添加到 Chrome"

开始配置你的环境规则

手动安装（开发版）
下载最新发布版本

打开 Chrome 扩展程序页面 (chrome://extensions/)

开启"开发者模式"

点击"加载已解压的扩展程序"

选择插件文件夹

📖 使用指南
基础使用
打开插件 - 点击浏览器工具栏中的 Tab Renamer Pro 图标

获取当前URL - 点击"刷新URL"获取当前标签页地址

添加规则 - 点击"基于当前URL添加规则"

设置名称 - 输入易于识别的环境名称（如"生产环境"）

保存规则 - 点击保存，新标签页将自动重命名

高级功能
编辑规则 - 点击规则右侧的编辑按钮修改匹配模式

批量管理 - 使用导入/导出功能迁移规则配置

匹配模式 - 支持包含、开头、结尾、正则表达式多种匹配方式

🏗️ 技术架构
text
Tab Renamer Pro
├── Background Script (后台脚本)
│   ├── 标签页监听
│   ├── 规则匹配引擎
│   └── 存储管理
├── Content Script (内容脚本)
│   ├── 标题重写
│   └── DOM监控
└── Popup Interface (弹出界面)
    ├── 规则管理
    ├── 实时预览
    └── 批量操作

# 克隆项目
git clone https://github.com/Jackson-zhanganbing/tab-renamer.git
# 进入目录
cd tab-renamer-pro

# 加载扩展
# 1. 打开 chrome://extensions/
# 2. 开启开发者模式  
# 3. 加载项目文件夹
项目结构
text
tab-renamer-pro/
├── icons/                 # 插件图标
├── background.js         # 后台服务脚本
├── content.js           # 内容注入脚本
├── popup.html           # 弹出界面
├── popup.js            # 界面交互逻辑
├── manifest.json        # 插件配置
└── README.md           # 项目文档
🤝 贡献指南
我们欢迎所有形式的贡献！请参阅 CONTRIBUTING.md 了解详情。



💡 使用场景示例
运维团队
json
[
  {
    "urlPattern": "10.64.10.209",
    "newName": "国内预生产环境",
    "matchType": "contains"
  },
  {
    "urlPattern": "10.64.14.204", 
    "newName": "国内生产环境",
    "matchType": "contains"
  }
]
开发人员
json
[
  {
    "urlPattern": "localhost:3000",
    "newName": "🚀 本地开发环境",
    "matchType": "contains"
  },
  {
    "urlPattern": "staging.example.com",
    "newName": "🧪 测试环境", 
    "matchType": "contains"
  }
]
⭐ 如果这个项目对你有帮助，请给我们一个 Star！

🔔 关注更新 - 我们持续改进，为用户提供更好的体验！
