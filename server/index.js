/**
 * 个人网站服务器（Express）
 * - 提供档案馆文件存储 API（磁盘存储 + JSON 元数据）
 * - 生产环境同时托管前端 dist 静态文件
 *
 * 启动：node server/index.js   （需先 npm run build）
 * 端口：环境变量 PORT，默认 3001
 */
import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 数据目录：默认在 server/ 下（开发模式）；生产部署可设环境变量 DATA_DIR
// 指向独立挂载目录（如宿主机 /opt/my-site-data），这样更新代码时
// 覆盖 dist/ 或 server/ 里的代码文件，永远不会影响上传的图片与数据。
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : __dirname;
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 3001;

// 管理员密码（部署时必须通过环境变量设置！）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '6';
// token 签名密钥
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

// ---------- 管理员鉴权（HMAC 签名 token） ----------
function issueToken() {
  const payload = JSON.stringify({ role: 'admin', exp: Date.now() + TOKEN_TTL });
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

function verifyToken(token) {
  try {
    const [payloadB64, sig] = String(token || '').split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    if (sig !== expected) return false;
    const data = JSON.parse(payload);
    return data.role === 'admin' && data.exp > Date.now();
  } catch {
    return false;
  }
}

// 管理操作中间件：需要 Authorization: Bearer <token>
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!verifyToken(token)) {
    return res.status(401).json({ error: '需要管理员权限' });
  }
  next();
}

// 单文件大小上限：500MB（大视频/大文件也能存）
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// 确保目录存在
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- 元数据存储（data.json） ----------
function readMeta() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeMeta(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

// ---------- 文件分类（前端上传时指定，后端做合法性校验） ----------
// 分类体系与简历页「荣誉奖项」完全同步：
//   honor(荣誉称号) / scholarship(奖学金) / competition(竞赛奖项)
//   degree(学位学历) / appointment(聘书) / certificate(技能证书)
//   service(实习) / other(其他)
const VALID_CATEGORIES = ['honor', 'scholarship', 'competition', 'degree', 'appointment', 'certificate', 'service', 'other'];

// 旧分类（档案馆早期版本）→ 新分类的兼容映射
const LEGACY_CATEGORY_MAP = {
  cert: 'honor',
  award: 'competition',
  activity: 'other'
};

function normalizeCategory(value) {
  if (VALID_CATEGORIES.includes(value)) return value;
  return LEGACY_CATEGORY_MAP[value] || 'other';
}

function getCategory(value) {
  return normalizeCategory(value);
}

// 扩展名 → MIME 兜底推断（Blob 上传可能缺失 mimetype）
const EXT_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function inferMime(mimetype, name) {
  if (mimetype && mimetype !== 'application/octet-stream') return mimetype;
  const ext = path.extname(name).toLowerCase();
  return EXT_MIME[ext] || 'application/octet-stream';
}

// ---------- multer 上传（磁盘存储，文件名用随机 ID，避免冲突与路径注入） ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, _file, cb) => cb(null, crypto.randomUUID())
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
});

// 偏好图片存储目录（关于我页）
const ABOUT_UPLOAD_DIR = path.join(DATA_DIR, 'about-uploads');
fs.mkdirSync(ABOUT_UPLOAD_DIR, { recursive: true });

// 偏好图片上传专用（存 about-uploads/）
const aboutUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ABOUT_UPLOAD_DIR),
    filename: (_req, _file, cb) => cb(null, crypto.randomUUID())
  }),
  limits: { fileSize: MAX_FILE_SIZE }
});

const app = express();
app.use(express.json({ limit: '2mb' }));

// 登录：POST { password } → { token }
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: '请输入密码' });
  }
  if (password === ADMIN_PASSWORD) {
    return res.json({ token: issueToken(), expiresIn: TOKEN_TTL });
  }
  res.status(401).json({ error: '密码错误' });
});

// 校验 token：GET /api/auth/verify
app.get('/api/auth/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  res.json({ ok: verifyToken(token) });
});

// 上传（浏览器用）：支持多文件，字段名 file（需要管理员）
app.post('/api/files', requireAdmin, upload.array('file', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有收到文件' });
  }

  const meta = readMeta();
  const now = new Date().toISOString().slice(0, 10);
  const category = getCategory(req.body?.category);
  // 新上传文件 order 取当前最大值 + 1（排在最前）
  let nextOrder = meta.reduce((max, f) => Math.max(max, f.order || 0), 0) + 1;
  const created = [];

  for (const file of req.files) {
    const id = crypto.randomUUID();
    const storedPath = path.join(UPLOAD_DIR, file.filename);

    // 用文件扩展名重命名磁盘文件（便于 Content-Type 正确返回）
    const ext = path.extname(file.originalname);
    const finalName = `${id}${ext}`;
    fs.renameSync(storedPath, path.join(UPLOAD_DIR, finalName));

    const item = {
      id,
      name: file.originalname,
      type: inferMime(file.mimetype, file.originalname),
      category,
      size: file.size,
      diskName: finalName,
      date: now,
      order: nextOrder++
    };
    meta.unshift(item);
    created.push({ id: item.id, name: item.name, category: item.category, size: item.size, date: item.date, order: item.order });
  }

  writeMeta(meta);
  res.status(201).json({ files: created });
});

// 上传（脚本/命令行用，避免 multipart 文件名编码问题）：
//   POST /api/raw-upload?name=<URL编码文件名>&category=<分类>（需要管理员）
//   body = 文件二进制（Content-Type: application/octet-stream）
app.post('/api/raw-upload', requireAdmin, express.raw({ type: '*/*', limit: MAX_FILE_SIZE }), (req, res) => {
  const name = req.query.name || 'unnamed';
  const category = getCategory(req.query.category);

  // 只保留文件名部分，防止路径注入
  const base = path.basename(name);
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ error: '没有收到文件内容' });
  }

  const id = crypto.randomUUID();
  const ext = path.extname(base);
  const finalName = `${id}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, finalName), req.body);

  const meta = readMeta();
  const now = new Date().toISOString().slice(0, 10);
  // 新上传文件 order 取当前最大值 + 1（排在最前）
  const nextOrder = meta.reduce((max, f) => Math.max(max, f.order || 0), 0) + 1;
  const item = {
    id,
    name: base,
    type: inferMime('application/octet-stream', base),
    category,
    size: req.body.length,
    diskName: finalName,
    date: now,
    order: nextOrder
  };
  meta.unshift(item);
  writeMeta(meta);

  res.status(201).json({ files: [{ id: item.id, name: item.name, type: item.type, category: item.category, size: item.size, date: item.date, order: item.order }] });
});

// 自定义排序（拖拽后保存顺序，需要管理员）：
//   POST /api/files/reorder   body: { ids: [id1, id2, ...] }
app.post('/api/files/reorder', requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) return res.status(400).json({ error: '缺少 ids' });

  const meta = readMeta();
  // 只更新提供的 id 的顺序，其余保持原 order
  const byId = new Map(meta.map((f) => [f.id, f]));
  let ok = 0;
  ids.forEach((id, index) => {
    const f = byId.get(id);
    if (f) {
      f.order = index + 1;
      ok++;
    }
  });
  if (ok === 0) return res.status(404).json({ error: '没有匹配的文件' });

  writeMeta(meta);
  res.json({ ok: true, updated: ok });
});

// 列表（按自定义顺序 order 升序；旧数据无 order 时按日期倒序兜底）
app.get('/api/files', (_req, res) => {
  const meta = readMeta();
  const sorted = meta
    .map((f) => ({ ...f, category: normalizeCategory(f.category), order: f.order ?? Date.parse(f.date || '') }))
    .sort((a, b) => a.order - b.order);
  // 不返回 diskName，避免暴露服务器文件名
  const safe = sorted.map(({ diskName, ...item }) => item);
  res.json(safe);
});

// 修改文件分类（管理员）：PATCH /api/files/:id/category  body: { category }
app.patch('/api/files/:id/category', requireAdmin, (req, res) => {
  const category = getCategory(req.body?.category);
  const meta = readMeta();
  const item = meta.find((f) => f.id === req.params.id);
  if (!item) return res.status(404).json({ error: '文件不存在' });
  item.category = category;
  writeMeta(meta);
  res.json({ ok: true, id: item.id, name: item.name, category });
});

// 修改文件名（管理员）：PATCH /api/files/:id/name  body: { name }
// 只更新元数据中的展示名，磁盘文件（diskName）保持不变
app.patch('/api/files/:id/name', requireAdmin, (req, res) => {
  const rawName = String(req.body?.name ?? '').trim();
  if (!rawName) return res.status(400).json({ error: '文件名不能为空' });
  if (rawName.length > 200) return res.status(400).json({ error: '文件名过长（最多 200 字符）' });
  // 禁止路径分隔符与控制字符，避免路径穿越/换行
  if (/[\\/:*?"<>|\u0000-\u001f]/.test(rawName)) {
    return res.status(400).json({ error: '文件名包含非法字符' });
  }
  const meta = readMeta();
  const item = meta.find((f) => f.id === req.params.id);
  if (!item) return res.status(404).json({ error: '文件不存在' });
  item.name = rawName;
  writeMeta(meta);
  res.json({ ok: true, id: item.id, name: item.name });
});

// 内联展示（图片预览/播放）
app.get('/api/files/:id', (req, res) => {
  const meta = readMeta();
  const item = meta.find((f) => f.id === req.params.id);
  if (!item) return res.status(404).json({ error: '文件不存在' });

  const filePath = path.join(UPLOAD_DIR, item.diskName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件已丢失' });

  res.setHeader('Content-Type', item.type);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  fs.createReadStream(filePath).pipe(res);
});

// 下载
app.get('/api/files/:id/download', (req, res) => {
  const meta = readMeta();
  const item = meta.find((f) => f.id === req.params.id);
  if (!item) return res.status(404).json({ error: '文件不存在' });

  const filePath = path.join(UPLOAD_DIR, item.diskName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件已丢失' });

  res.download(filePath, item.name);
});

// 删除单个（需要管理员）
app.delete('/api/files/:id', requireAdmin, (req, res) => {
  const meta = readMeta();
  const idx = meta.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '文件不存在' });

  const [removed] = meta.splice(idx, 1);
  writeMeta(meta);

  const filePath = path.join(UPLOAD_DIR, removed.diskName);
  fs.rm(filePath, { force: true }, () => {});
  res.json({ ok: true });
});

// 清空（需要管理员）
app.delete('/api/files', requireAdmin, (_req, res) => {
  writeMeta([]);
  fs.rm(UPLOAD_DIR, { recursive: true, force: true }, () => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  });
  res.json({ ok: true });
});

// ---------- 关于我页「我的相册」+「我的偏好」（图文相册格式，管理员可编辑内容/图片/顺序） ----------
const ABOUT_DATA_FILE = path.join(DATA_DIR, 'about-preferences.json');
const ABOUT_ALBUM_FILE = path.join(DATA_DIR, 'about-album.json');
const ABOUT_INTRO_FILE = path.join(DATA_DIR, 'about-intro.json');

// 关于我页简介默认数据
const DEFAULT_ABOUT_INTRO = {
  photo: '',
  hello: '你好，我是刘念。',
  lead: '一个热爱实验、认真做事，也愿意记录生活的本科生。',
  body: '我的兴趣不只停留在课题本身，也包括把事情说清楚、做成有结构的表达。这个网站希望成为一个比简历更有温度的载体：不只是展示成绩，而是把我的思考、成长与项目都慢慢放进去。'
};

// 读取/保存图文区块数据（album 与 preferences 共用清洗逻辑）
function readAboutData(file, fallback) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function cleanAboutItems(data) {
  return data
    .map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      title: String(item.title || '').trim().slice(0, 50),
      meta: String(item.meta || '').trim().slice(0, 100),
      image: String(item.image || '').trim().slice(0, 300),
      tone: String(item.tone || '#e8e0c8').slice(0, 30),
      story: String(item.story || '').trim().slice(0, 500)
    }))
    .filter((item) => item.title);
}
const DEFAULT_PREFERENCES = [
  {
    id: 'mbti',
    title: 'MBTI',
    meta: 'INTJ · 建筑师型人格',
    image: '',
    tone: '#e8e0c8',
    story: '理性规划、独立专注，喜欢把复杂的事情拆解成清晰的步骤。'
  },
  {
    id: 'books',
    title: '喜欢的书',
    meta: '近期在读',
    image: '',
    tone: '#c8d8c8',
    story: '《活着》《三体》《平凡的世界》，喜欢有厚度的故事和那些能让人安静下来的文字。'
  },
  {
    id: 'movies',
    title: '喜欢的电影',
    meta: '值得反复看的',
    image: '',
    tone: '#c8d0e0',
    story: '《星际穿越》《肖申克的救赎》，好的电影像一面镜子，看完总会留下点什么。'
  }
];

// 我的相册默认数据（与前端 aboutAlbum 同构）
const DEFAULT_ABOUT_ALBUM = [
  { id: 'childhood', title: '小时候的我', meta: '2004 · 江西赣州', image: '', tone: '#e8c9a0', story: '出生在赣州，在一个普通但温暖的小家庭里长大。记忆里是外婆家的老院子、夏天的蝉鸣，还有一群从小玩到大的邻居伙伴。' },
  { id: 'parents', title: '和爸爸妈妈', meta: '家人的日常', image: '', tone: '#b8cfae', story: '爸妈不爱说太多，但每次回家总有一桌子我爱吃的菜。长大后慢慢明白，那些不说的关心，其实都在日复一日的细节里。' },
  { id: 'friends', title: '和朋友们', meta: '一起长大的伙伴', image: '', tone: '#a8c4d8', story: '从小学到现在，身边总有那么几个能一起疯、也能一起安静坐着的朋友。他们是我生活里很重要的一部分。' },
  { id: 'college', title: '大学时光', meta: '2022 · 福建农林大学', image: '', tone: '#d8c0b8', story: '进了生物科学专业，开始泡实验室。从第一次握移液枪手抖，到能独立完成一轮完整的实验，成长就藏在这些细碎的日常里。' },
  { id: 'future', title: '现在 · 未来', meta: '2026 · 继续向前', image: '', tone: '#c9bcd8', story: '即将进入西北大学攻读硕士。想把喜欢的事一直做下去，也把这个网站当作记录自己成长的一本相册。' }
];

// 读取偏好（公开）：文件不存在时返回默认
app.get('/api/about-preferences', (_req, res) => {
  res.json(readAboutData(ABOUT_DATA_FILE, DEFAULT_PREFERENCES));
});

// 读取相册（公开）：文件不存在时返回默认
app.get('/api/about-album', (_req, res) => {
  res.json(readAboutData(ABOUT_ALBUM_FILE, DEFAULT_ABOUT_ALBUM));
});

// 保存偏好（管理员）：整体保存（内容 + 图片 + 顺序），并做基本清洗
app.put('/api/about-preferences', requireAdmin, (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: '数据格式错误' });
  }
  const clean = cleanAboutItems(data);
  fs.writeFileSync(ABOUT_DATA_FILE, JSON.stringify(clean, null, 2), 'utf8');
  res.json(clean);
});

// 保存相册（管理员）：与偏好同构
app.put('/api/about-album', requireAdmin, (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: '数据格式错误' });
  }
  const clean = cleanAboutItems(data);
  fs.writeFileSync(ABOUT_ALBUM_FILE, JSON.stringify(clean, null, 2), 'utf8');
  res.json(clean);
});

// 读取简介（公开）：文件不存在时返回默认
app.get('/api/about-intro', (_req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(ABOUT_INTRO_FILE, 'utf8'));
    return res.json({ ...DEFAULT_ABOUT_INTRO, ...data });
  } catch {
    return res.json(DEFAULT_ABOUT_INTRO);
  }
});

// 保存简介（管理员）：清洗后整体保存
app.put('/api/about-intro', requireAdmin, (req, res) => {
  const data = req.body || {};
  const clean = {
    photo: String(data.photo || '').trim().slice(0, 300),
    hello: String(data.hello || '').trim().slice(0, 100),
    lead: String(data.lead || '').trim().slice(0, 200),
    body: String(data.body || '').trim().slice(0, 1000)
  };
  fs.writeFileSync(ABOUT_INTRO_FILE, JSON.stringify(clean, null, 2), 'utf8');
  res.json(clean);
});

// 偏好图片上传（管理员）：单张图片，存 about-uploads/，返回可访问 URL
app.post('/api/about-preferences/upload', requireAdmin, aboutUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有收到文件' });
  }
  const diskName = req.file.filename;
  const ext = path.extname(req.file.originalname || '').toLowerCase();
  // 统一补上扩展名（原始文件无扩展名时）
  let finalName = diskName;
  if (ext && !path.extname(diskName)) {
    finalName = `${diskName}${ext}`;
    fs.renameSync(path.join(ABOUT_UPLOAD_DIR, diskName), path.join(ABOUT_UPLOAD_DIR, finalName));
  }
  res.json({ url: `/api/about-uploads/${finalName}` });
});

// 偏好图片静态服务
app.use('/api/about-uploads', express.static(ABOUT_UPLOAD_DIR, { maxAge: '7d' }));

// 生产环境：托管前端构建产物
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA 路由回退
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ my-site 服务器已启动：http://localhost:${PORT}`);
  console.log(`   📁 文件存储目录：${UPLOAD_DIR}`);
  console.log(`   📄 元数据文件：${DATA_FILE}`);
  if (process.env.DATA_DIR) {
    console.log(`   🗂  数据目录（独立于代码，更新代码不影响数据）：${DATA_DIR}`);
  }
});
