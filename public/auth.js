/**
 * 月月贷 - 登录/注册页面逻辑
 */
const $ = (id) => document.getElementById(id);

// Toast
function toast(msg) {
  let t = $('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2000);
}

// 获取 URL 参数
function getParam(name) {
  return new URLSearchParams(location.search).get(name) || '';
}

// ============ 发送验证码 ============
let countdownTimer = null;

async function sendCode() {
  const phone = $('phone').value.trim();
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    toast('请输入正确的11位手机号');
    return;
  }

  const btn = $('btnCode');
  btn.disabled = true;

  try {
    const resp = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone })
    });
    const data = await resp.json();

    if (data.ok) {
      if (data.simulated) {
        toast('⚠ 短信服务未配置，请联系管理员');
        btn.disabled = false;
      } else {
        toast('验证码已发送');
        startCountdown(60);
      }
    } else {
      toast(data.msg || '发送失败，请重试');
      btn.disabled = false;
    }
  } catch (e) {
    toast('网络异常，请重试');
    btn.disabled = false;
  }
}

function startCountdown(seconds) {
  const btn = $('btnCode');
  btn.classList.add('counting');
  let sec = seconds;
  btn.textContent = sec + 's后重发';

  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    sec--;
    if (sec <= 0) {
      clearInterval(countdownTimer);
      btn.classList.remove('counting');
      btn.textContent = '获取验证码';
      btn.disabled = false;
      countdownTimer = null;
    } else {
      btn.textContent = sec + 's后重发';
    }
  }, 1000);
}

// ============ 登录/注册 ============
async function doLogin() {
  const phone = $('phone').value.trim();
  const code = $('code').value.trim();
  const token = getParam('token');

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    toast('请输入正确的手机号');
    return;
  }
  if (!code || code.length !== 6) {
    toast('请输入6位验证码');
    return;
  }
  if (!token) {
    toast('二维码已过期，请重新扫码');
    return;
  }

  const btn = $('btnSubmit');
  btn.disabled = true;
  btn.textContent = '验证中...';

  try {
    const resp = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, code: code, token: token })
    });
    const data = await resp.json();

    if (data.ok) {
      // 登录/注册成功，跳转到首页
      const homeUrl = `/home.html?token=${encodeURIComponent(token)}&session=${encodeURIComponent(data.session)}`;
      toast('验证成功，正在跳转...');
      setTimeout(() => {
        location.href = homeUrl;
      }, 500);
    } else {
      toast(data.msg || '验证码错误或已过期');
      btn.disabled = false;
      btn.textContent = '登录 / 注册';
    }
  } catch (e) {
    toast('网络异常，请重试');
    btn.disabled = false;
    btn.textContent = '登录 / 注册';
  }
}

// ============ 键盘回车提交 ============
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const active = document.activeElement;
    if (active && (active.id === 'phone' || active.id === 'code')) {
      doLogin();
    }
  }
});

// ============ 自动 focus 手机输入框 ============
const phoneInput = $('phone');
if (phoneInput) {
  setTimeout(() => phoneInput.focus(), 300);
}
