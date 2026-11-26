# CGLab

Artichoke 的图形学与技术写作博客，使用 [Mizuki](https://github.com/Yang-Junjie/Mizuki) 构建。站点地址为 [blog.cglab.top](https://blog.cglab.top/)。

- `content/posts/` 存放 Markdown 文章，元数据使用 `+++` 包裹的 TOML。
- `content/pages/about.md` 是博客关于页。
- `content/profile/` 是独立个人主页，发布路径为 `/profile/`。
- `content/images/` 存放文章图片，`themes/cglab/` 存放博客主题。
- `mizuki.toml` 定义站点地址、导航和构建配置。

## 本地预览

安装 [Mizuki 的最新稳定版](https://github.com/Yang-Junjie/Mizuki/releases/latest)，在仓库根目录运行：

```sh
mizuki serve
```

打开 [本地预览](http://127.0.0.1:3939/)。

## 构建和发布

```sh
mizuki build
```

`dist/` 是构建产物。

GitHub Actions 每次构建时检出并编译 Mizuki `main`，构建日志记录所用的源码提交。`mizuki-blog` 和 `main` 都会触发构建，只有 CGLab 的 `main` 会发布到 GitHub Pages。工作流使用 Pages 配置返回的发布地址。
