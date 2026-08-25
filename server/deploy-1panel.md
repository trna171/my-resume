# 部署到 VPS + 1Panel（反向代理方案）

> 架构：VPS 上的 Node 进程（Express）同时托管前端静态文件（`dist/`）与所有 `/api` 接口，
> 1Panel 自带的 Nginx 将域名反向代理到本机 3001 端口。
> **本机（开发电脑）部署完成后无需保持开机。**

## 数据流

```
用户浏览器 → 域名:443(HTTPS) → 1Panel Nginx → http://127.0.0.1:3001 → Express
                                                    ├── 静态文件 dist/
                                                    ├── /api/*（档案馆、关于我、鉴权）
                                                    └── server/uploads/、data.json 等
```

## 一、VPS 前期准备

1. **装好 1Panel**（官方一键脚本），自带 Nginx/OpenResty
2. **安装 Node.js ≥ 18**：
   - 方式 A：1Panel「应用商店」→ 搜索安装 Node 运行环境
   - 方式 B：服务器上 `curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs`
   - 验证：`node -v`（≥ 18 即可，Express 5 依赖）
3. **解析域名**：把域名 A 记录指向 VPS 公网 IP（等待生效）
4. **防火墙**：放行 80、443（1Panel 安装后通常已配置）

## 二、本机打包并上传

在开发电脑上（本项目目录）：

```bash
npm install
npm run build        # 生成 dist/
```

上传到 VPS（示例，也可用 WinSCP / git / rsync）：

```bash
scp -r dist server package.json package-lock.json user@你的VPS-IP:/opt/my-site/
```

> 不需要上传 `node_modules`、`src`、`public` 等源码文件，VPS 上重新装依赖。
> 若后续改了源码，重新 `npm run build` 后只覆盖上传 `dist/` 即可。

## 三、VPS 上安装依赖

```bash
cd /opt/my-site
npm install --omit=dev
```

## 四、进程守护（让 Node 常驻 + 开机自启）

### 方式 A：1Panel「进程守护」（推荐，面板可视化）

1. 1Panel → 应用商店 → 安装 **Supervisor（进程守护）**
2. 新建守护进程：
   - 名称：`my-site`
   - 启动目录：`/opt/my-site`
   - 启动命令：`node server/index.js`
   - **环境变量**：
     ```
     PORT=3001
     ADMIN_PASSWORD=你的强密码      # 必须改！默认是 6，太危险
     TOKEN_SECRET=一串随机长字符串   # 固定后重启不丢登录
     DATA_DIR=/opt/my-site-data     # ★ 强烈建议：把数据目录从代码目录分离（见第八节）
     ```
3. 保存并启动，观察日志确认 `✅ my-site 服务器已启动：http://localhost:3001`

### 方式 B：systemd（无面板依赖）

`/etc/systemd/system/my-site.service`：

```ini
[Unit]
Description=My Site Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/my-site
Environment=PORT=3001
Environment=ADMIN_PASSWORD=你的强密码
Environment=TOKEN_SECRET=一串随机长字符串
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now my-site
systemctl status my-site
```

## 五、1Panel 创建反向代理网站

1. 1Panel → 网站 → 创建网站 → 选「**反向代理**」
2. 填写：
   - 域名：`你的域名`（如 `example.com`）
   - 代理地址：`http://127.0.0.1:3001`
3. 创建后自动生成 Nginx 配置 + 可一键申请 **Let's Encrypt SSL 证书**（自动续期）

### 必须调整：上传大小限制

Nginx 默认 `client_max_body_size 1m`，不放开则档案馆/相册传图会 413。
在网站「配置」→ 配置文件里，`server { }` 块内加一行：

```nginx
client_max_body_size 100m;   # 与后端 MAX_FILE_SIZE(500MB) 按需取一致
```

改完保存，1Panel 自动 reload Nginx。

## 六、验证

```bash
curl http://127.0.0.1:3001/            # 应返回首页 HTML
curl http://127.0.0.1:3001/api/files   # 应返回 []（空档案馆）
curl https://你的域名/api/files        # 走域名 + HTTPS 同样可用
```

浏览器打开 `https://你的域名`，确认首页 / 关于我 / 档案馆等页面正常。

## 七、数据备份（重要）

需要备份的文件（都在 `/opt/my-site/server/` 下）：

```
server/uploads/            # 档案馆上传的文件
server/about-uploads/      # 关于我上传的图片
server/data.json           # 档案馆元数据
server/about-intro.json    # 关于我简介
server/about-preferences.json
server/about-album.json
```

1Panel「计划任务」→ 新建备份任务（Shell 脚本 + 本地/OSS/腾讯云存储均可）：

```bash
tar -czf /root/backup/my-site-$(date +%F).tar.gz \
  /opt/my-site/server/uploads \
  /opt/my-site/server/about-uploads \
  /opt/my-site/server/data.json \
  /opt/my-site/server/about-intro.json \
  /opt/my-site/server/about-preferences.json \
  /opt/my-site/server/about-album.json
```

建议每日备份 + 保留最近 N 份。

## 八、后续更新代码（★ 关键：只更新代码，不碰数据）

### 先分清两类文件

| 类型 | 文件/目录 | 更新时 |
| --- | --- | --- |
| **代码**（可以覆盖） | `dist/`、`server/index.js`、`package.json`、`package-lock.json` | 每次更新都重新上传 |
| **数据**（绝不能覆盖） | `server/uploads/`、`server/about-uploads/`、`server/data.json`、`server/about-intro.json`、`server/about-preferences.json`、`server/about-album.json` | **永远不要上传本地同名文件覆盖它！** |

> ⚠️ **最大坑**：本地开发时 `server/` 目录里也有 `uploads/`、`data.json`、`about-*.json`（本地测试数据）。
> 如果按初版命令 `scp -r dist server package.json ...` 把整个 `server/` 目录传上去，
> **本地这些文件会把 VPS 上的真实上传图片/数据整个覆盖掉**！
> 正确做法：上传时**只传 `dist/` 与 `server/index.js`**，绝不传 `server/uploads`、`server/data.json`、`server/about-*`。

### 方案 A（推荐）：DATA_DIR 数据目录分离，一劳永逸

新版 `server/index.js` 支持环境变量 `DATA_DIR`，把全部数据（uploads、data.json、about-*.json）放到独立目录，
之后更新代码时随便覆盖 `dist/`、`server/`，数据永远安全。

1. 先把 VPS 现有数据**移动**到独立目录（只需做一次）：

   ```bash
   # VPS 上执行
   mkdir -p /opt/my-site-data
   cp -r /opt/my-site/server/uploads       /opt/my-site-data/
   cp -r /opt/my-site/server/about-uploads /opt/my-site-data/
   cp    /opt/my-site/server/data.json     /opt/my-site-data/
   cp    /opt/my-site/server/about-intro.json /opt/my-site-data/
   cp    /opt/my-site/server/about-preferences.json /opt/my-site-data/
   cp    /opt/my-site/server/about-album.json /opt/my-site-data/
   ```

2. 容器/进程环境变量加 `DATA_DIR=/opt/my-site-data`（1Panel 若用容器，需把宿主机 `/opt/my-site-data` 挂载进容器同路径），重启。

3. 以后每次更新代码（本机执行）：

   ```bash
   npm run build
   scp -r dist server/index.js package.json package-lock.json user@你的VPS-IP:/opt/my-site/
   ```

   再在 1Panel / systemd 重启进程即可。`server/uploads`、`data.json` 等数据文件根本不在传输列表里，不可能被覆盖。

### 方案 B（不改代码）：只传 dist，绝不传 server 数据

```bash
# 本机
npm run build
scp -r dist server/index.js user@你的VPS-IP:/opt/my-site/

# VPS（Supervisor 方式在面板里点「重启」，systemd 方式执行）
systemctl restart my-site
```

> `scp -r dist` 是合并式拷贝，只新增/覆盖同名文件，**不会删除** VPS 上已有的 `server/uploads/` 等数据；
> 前提是你**没有**把本地 `server/data.json`、`server/uploads` 等一起传上去。

### 万一数据已被覆盖怎么办

用第七节的备份（1Panel 计划任务每日备份）恢复：把备份里的 `server/uploads`、`data.json`、`about-*` 拷回原位即可。
