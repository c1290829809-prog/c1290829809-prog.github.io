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

地点、爱豆、作品、城市、用户反馈和统计事件统一保存到 Supabase 云端；
浏览器 `localStorage` 仅作为读取缓存，以及保存游客自己的收藏、关注和临时路线。
后台没有公开注册入口，只有 Supabase Auth 中已加入 `admin_users` 的账号可以进入。

## Supabase 首次初始化

1. 在 Supabase 的 SQL Editor 中完整执行 `supabase/schema.sql`，关闭匿名内容写入并建立管理员权限。
2. 在 Authentication → Users 中创建一个邮箱密码账号。
3. 把 `supabase/admin-bootstrap.sql` 中的 `YOUR_ADMIN_EMAIL` 改为该邮箱，然后执行脚本。
4. 在 `.env.local` 填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，重新启动本地项目。
5. 打开 `/admin/login` 登录。首次进入数据看板，可选择旧的 `xunji-backup-*.json`，导入后页面会核对云端记录数。

请勿把管理员密码、Service Role Key 或本地备份文件提交到 GitHub。前端只使用可公开的 Publishable/Anon Key，真正的写入限制由 Supabase RLS 执行。

## GitHub Pages

推送到 `main` 分支后，GitHub Actions 会自动构建并部署。线上使用 Hash
路由，以兼容 GitHub Pages 静态托管。

线上地址：`https://c1290829809-prog.github.io/`

高德地图 Key 通过仓库 Actions Secret `VITE_AMAP_KEY` 注入。DeepSeek
提取接口目前依赖 Vite 本地开发代理，纯静态 GitHub Pages 上不会运行。
Supabase 配置通过 Actions Secrets `VITE_SUPABASE_URL` 和
`VITE_SUPABASE_ANON_KEY` 注入。
