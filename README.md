# whyjustus101 的博客

[打开博客 →](https://whyjustus101.github.io/)

一个以海洋实拍开场的个人博客。首页展示最新文章，完整文章列表支持搜索，每篇文章都有独立阅读页、目录、阅读进度和代码复制。

使用原生 HTML、CSS、JavaScript 和 Markdown，没有浏览器运行时框架。构建只需 Node.js 22 或更新版本，无需 `npm install`。免费托管于 GitHub Pages。

## 发一篇博客

1. 在 `content/notes/` 新建 `my-new-post.md`，用 Markdown 写正文。文章标题放在下一步的元数据中，正文从 `##` 二级标题开始。
2. 在 `content/notes/index.json` 数组中增加一项：

```json
{
  "slug": "my-new-post",
  "title": "新文章的标题",
  "date": "2026-10-13",
  "description": "简短介绍这篇文章。",
  "tags": ["随想"]
}
```

`slug` 与 Markdown 文件名相同，只用小写字母、数字和连字符。元数据中列出的文章都会发布。

3. 构建并预览：

```sh
node scripts/build-site.mjs
python3 -m http.server 4173 --directory dist
```

打开 `http://localhost:4173`。首页自动显示最新 5 篇，`/notes/` 显示全部文章，均按日期倒序排列，无需手改首页链接。

4. 确认后发布：

```sh
node scripts/publish-site.mjs --publish
```

发布命令通过已经登录的 GitHub CLI 推送到 `gh-pages`；源文件请另行提交保存。详细说明见 [构建与发布说明](docs/site-build.md)。

## 文件位置

| 文件 | 用途 |
| --- | --- |
| `content/notes/` | Markdown 正文和文章元数据 |
| `site/index.html` | 博客首页模板与导航 |
| `site/styles.css`、`site/material.css` | 海洋开屏、文章列表、配色和系统字体 |
| `site/main.js`、`site/ocean.js`、`site/particles.js` | 海洋视频、滚动与鼠标粒子 |
| `site/notes.css`、`site/notes.js` | 文章搜索、目录和阅读交互 |
| `scripts/templates/` | 全部文章列表与正文模板 |
| `scripts/render-notes.mjs` | 从 Markdown 生成首页文章摘要、列表和正文 |

保留同一段半水下实拍海洋视频：电脑 1080p，手机或慢速网络 720p。首屏离开视野或切到后台时暂停；系统要求减少动态时使用静态预览。影像作者与许可见 [鸣谢页](https://whyjustus101.github.io/credits/) 和 [素材说明](site/ASSETS.md)。

原 al-folio 源码与旧版本保存在 `archive/al-folio-20261011` 分支及 Git 历史中；发布产物仅包含当前博客，旧模板演示和项目介绍不再发布。代码许可见 [LICENSE](LICENSE)。
