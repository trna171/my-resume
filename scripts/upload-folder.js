/**
 * 批量上传工具：把本地文件夹中的文件上传到档案馆指定分类
 * 用法：node scripts/upload-folder.js <文件夹路径> <分类>
 * 分类：cert=荣誉证书 award=比赛奖项 activity=活动证明 other=其他
 */
import fs from 'node:fs';
import path from 'node:path';

const [folder, category = 'other'] = process.argv.slice(2);
const API = process.env.API || 'http://localhost:3001';
// 管理员密码（可通过环境变量 ADMIN_PASSWORD 覆盖）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '6';

if (!folder || !fs.existsSync(folder)) {
  console.error('❌ 请传入有效的文件夹路径');
  process.exit(1);
}

// 先登录拿 token
async function getToken() {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD })
  });
  if (!res.ok) {
    console.error('❌ 登录失败：密码错误或服务器未启动');
    process.exit(1);
  }
  const data = await res.json();
  return data.token;
}

const files = fs.readdirSync(folder).filter((f) => fs.statSync(path.join(folder, f)).isFile());
console.log(`📁 发现 ${files.length} 个文件，分类：${category}`);

let ok = 0;
let fail = 0;

for (const name of files) {
  const filePath = path.join(folder, name);
  const buffer = fs.readFileSync(filePath);

  // 用 raw 上传：文件名走 URL query（规避 Node FormData 的中文文件名编码缺陷）
  const url = `${API}/api/raw-upload?name=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${await getToken()}`
      },
      body: buffer
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ok++;
    console.log(`✅ ${name}`);
  } catch (err) {
    fail++;
    console.error(`❌ ${name}：${err.message}`);
  }
}

console.log(`\n完成：成功 ${ok}，失败 ${fail}`);
process.exit(fail ? 1 : 0);
