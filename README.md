# whyjustus101

[打开网站 →](https://whyjustus101.github.io/)

一个从海面开始的个人作品站：半在海上、半在海下的全屏场景，起伏的水线、跟随鼠标的粒子，以及深海背景中的作品与笔记。

新版使用原生 HTML、CSS 和 JavaScript，没有浏览器运行时框架、Ruby、Jekyll 或 Docker。笔记在构建时从 Markdown 生成完整 HTML；解析器随仓库附带，无需 `npm install`。页面资源和字体均自托管。

## 改哪里

| 文件 | 用途 |
| --- | --- |
| `site/index.html` | 文案、导航、项目和笔记链接 |
| `site/material.css` | 全站海洋配色、字体、导航与交互状态 |
| `site/styles.css` | 首页布局、项目卡片、海洋开屏与手机适配 |
| `site/main.js` | 滚动、导航、动效开关 |
| `site/ocean.js` | 原生全屏视频播放、暂停、后台休眠与下潜取景 |
| `site/particles.js` | 独立的 Canvas 鼠标粒子动效 |
| `site/assets/` | 1080p / 720p 高清视频、静态预览、字体和图标 |
| `content/notes/` | Markdown 笔记原文与列表元数据 |
| `site/notes.css`、`site/notes.js` | 笔记列表、搜索、目录、阅读进度与代码复制 |
| `scripts/templates/` | 笔记列表和文章阅读页模板 |

鼠标移过海面时，粒子环会带着惯性跟随，经过的粒子逐渐回归。触屏和“减少动态效果”模式使用静态点阵；暂停开关同时控制视频与粒子。视频尚未加载、系统减少动态或播放失败时显示静态海洋预览。

首页播放 30 fps、18.2 秒循环的高清背景：电脑默认 1920 × 1080；小屏、触屏、省流量或慢速网络使用 1280 × 720。每次打开页面只选取一档，旋转或调整窗口时保持播放。海面、水下和起伏的水线来自同一个连续的半水下实拍镜头，拍摄地点为意大利 Tuscany 的 Marina di Massa 海岸。截取 4K 源片的 02:59.65–03:08.75，以 0.5 倍速度保留原 60 fps 的每一帧，做整幅深蓝调色并等比例缩小。画面中的波浪、折射和水下光影均来自相机拍摄。暂停按钮同时控制视频与粒子，页面进入后台时停止播放；向下滚动时逐渐放大视频下半部，背景继续播放。桌面粒子更新和绘制上限为 60 fps。影像作者与许可见 [鸣谢页](https://whyjustus101.github.io/credits/) 和 `site/ASSETS.md`。

项目区、笔记列表和文章延续深蓝背景。界面使用自托管 Manrope，中文跟随系统字体；Bebas Neue 用于开屏标题。所有效果使用原生视频、CSS 和 Canvas，不需要运行时组件库或联网字体服务。

## 本地预览

在仓库目录运行：

```sh
node scripts/build-site.mjs
python3 -m http.server 4173 --directory dist
```

打开 `http://localhost:4173`，笔记列表位于 `/notes/`。修改源文件后重新构建并刷新。

## 添加笔记

1. 在 `content/notes/` 新建 `文章标识.md`，使用 Markdown 编写标题、段落、代码块等内容。
2. 在同目录的 `index.json` 添加 `slug`、`title`、`date`、`description` 和 `tags`。`slug` 与 Markdown 文件名相同，只用小写字母、数字和连字符；日期格式为 `YYYY-MM-DD`。
3. 运行构建命令，笔记列表和 `/notes/文章标识/` 阅读页会自动生成。按下一节发布。

## 构建与发布

使用 Node.js 22 或更新版本构建，无需 `npm install`：

```sh
node scripts/build-site.mjs
```

发布通过 GitHub CLI 和 Git 完成，目标是本仓库的 `gh-pages` 分支：

```sh
node scripts/publish-site.mjs --dry-run
node scripts/publish-site.mjs --publish
```

GitHub Pages 会从 `gh-pages` 发布。源分支提交不会自动发布网站。发布脚本保留固定版本的旧文章链接，详细行为见 [构建与发布说明](docs/site-build.md)。

## 原模板与素材

原 al-folio 源码完整保存在 [`archive/al-folio-20261011`](https://github.com/whyjustus101/whyjustus101.github.io/tree/archive/al-folio-20261011) 分支，Git 历史保留；活动源码已移除模板、演示内容和旧构建工作流。

素材来源与许可见 [site/ASSETS.md](site/ASSETS.md)。代码许可见 [LICENSE](LICENSE)。
