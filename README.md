# 循迹 Xunji

以公开同款地点为入口的城市打卡路线 Web 应用。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173/`，后台入口为
`http://localhost:5173/admin`。

## 数据说明

当前 MVP 使用浏览器 `localStorage` 保存地点、爱豆、作品、城市、路线、
收藏、反馈和统计事件。不同浏览器或设备之间的数据不会自动同步。

## GitHub Pages

推送到 `main` 分支后，GitHub Actions 会自动构建并部署。线上使用 Hash
路由，以兼容 GitHub Pages 静态托管。

线上地址：`https://c1290829809-prog.github.io/`

高德地图 Key 通过仓库 Actions Secret `VITE_AMAP_KEY` 注入。DeepSeek
提取接口目前依赖 Vite 本地开发代理，纯静态 GitHub Pages 上不会运行。
