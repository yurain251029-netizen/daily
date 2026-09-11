# AI × 经济日报 · 站点（部署单元）

> AI 科技 × 经济金融 · 每日晨报（09:00）· 中英双语
> 本目录是**唯一的 Git 仓库**，push 后自动触发线上部署。

## 目录结构

```
site/
├── index.html              # 站点主页（= 最新一期报告，由 auto_deploy 同步）
├── history.html            # 历史报告索引
├── reports/
│   ├── index.html          # 最新一期报告（与根 index.html 同步）
│   └── archive/            # 历史归档 YYYY-MM-DD-{morning|noon|evening}.html
├── assets/
│   ├── css/site.css        # 样式
│   └── js/site.js          # 交互
├── icons/ · *.svg          # PWA 图标与 OG 图
├── sw.js · manifest.webmanifest
├── vercel.json             # Vercel 缓存与 rewrite 规则
├── sitemap.xml · robots.txt · 404.html
└── .gitignore
```

## 线上地址

| 用途 | URL | 状态 |
|------|-----|------|
| **主站** | https://yurain251029-netizen.github.io/daily/ | 已验证在线 |
| 备用 | https://ai-daily-black.vercel.app | 以 Vercel 后台为准 |

- 仓库：https://github.com/yurain251029-netizen/daily
- 旧地址 `ai-daily-report` 已失效（404），分享一律使用新地址。

## 更新流程（每日 09:00 自动化）

无需手动操作。晨报 automation 执行：

```bash
"C:\Users\32477\.workbuddy\binaries\python\versions\3.13.12\python.exe" "D:\整理\AI × 经济 报告\auto_deploy.py" morning
```

`auto_deploy.py` 四阶段一站式完成：
1. **构建** — 调用 `../build_report.py`（读 content.json + ../template-injectable.html）
2. **同步** — 根产物复制到 `reports/` 与本目录根（archive 同步到 `reports/archive/`）
3. **推送** — git commit + push origin main
4. **验证** — 检查线上 URL 可达性

手动触发同一条命令即可；分步开关：`--skip-build` / `--skip-push` / `--skip-verify`。

## 本地预览

```bash
cd site
python -m http.server 8000
# 访问 http://localhost:8000
```

## 设计理念

- **美观大气**：纸面纹理 + 暖棕主色 + 衬线字体
- **实用可读**：Hero / 今日报告 / 历史索引 三屏式结构
- **涨红跌绿**（中国惯例）、中英双语、术语就近注释

---
最后更新：2026-09-11
