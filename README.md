# whyjustus101

[打开网站 →](https://whyjustus101.github.io/)

一个从海面开始的个人作品站：全屏动态海洋、滚动过渡、开源项目与学习笔记。

新版使用原生 HTML、CSS 和 JavaScript。没有运行时框架、npm 依赖、Ruby、Jekyll 或 Docker；页面资源和字体均自托管。

## 改哪里

| 文件 | 用途 |
| --- | --- |
| `site/index.html` | 文案、导航、项目和笔记链接 |
| `site/styles.css` | 排版、颜色、手机适配 |
| `site/main.js` | 滚动、导航、动效开关 |
| `site/ocean.js` | 独立的 WebGL 海面动效 |
| `site/assets/` | 图片、字体和图标 |
| `content/notes/` | 个人笔记原文 |

动效会跟随系统的“减少动态效果”设置，也可以手动暂停。浏览器不支持 WebGL 时自动显示海洋壁纸。

## 本地预览

在仓库目录运行：

```sh
python3 -m http.server 4173 --directory site
```

打开 `http://localhost:4173`。修改源文件后刷新即可。

## 构建与发布

构建脚本仅使用 Node.js 内置模块，无需 `npm install`：

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
