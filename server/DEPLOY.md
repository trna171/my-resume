# 部署到 Linux 服务器（档案馆服务器存储版）

后端为 Express 服务器（`server/index.js`），同时托管前端构建产物与档案馆 API。
文件存储在服务器磁盘：`server/uploads/`，元数据在 `server/data.json`。

## 一、本地准备

```bash
npm install
npm run build        # 生成 dist/
```

## 二、上传到服务器

```bash
# 示例：scp 上传整个项目（排除 node_modules 更小，在服务器上再 npm install）
scp -r dist server package.json package-lock.json user@your-server:/var/www/my-site/
```

## 三、服务器上安装依赖并启动

```bash
cd /var/www/my-site
npm install --omit=dev        # 只装生产依赖（含 express、multer）
# 单文件上限默认 500MB；如需调整改 server/index.js 的 MAX_FILE_SIZE
node server/index.js          # 监听 3001 端口
```

验证：`curl http://localhost:3001/` 应返回页面，`curl http://localhost:3001/api/files` 应返回 `[]`。

## 四、systemd 常驻服务（推荐）

`/etc/systemd/system/my-site.service`：

```ini
[Unit]
Description=My Site Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/my-site
ExecStart=/usr/bin/node server/index.js
Environment=PORT=3001
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now my-site
sudo systemctl status my-site
```

## 五、（可选）nginx 反向代理 + 域名

```nginx
server {
    listen 80;
    server_name example.com;

    # 上传大文件需放宽限制
    client_max_body_size 500m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 六、数据备份

档案馆文件在 `server/uploads/`，元数据在 `server/data.json`，备份这两个即可：

```bash
tar -czf my-site-archive-backup.tar.gz /var/www/my-site/server/uploads /var/www/my-site/server/data.json
```
