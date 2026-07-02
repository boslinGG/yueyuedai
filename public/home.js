/**
 * 月月贷 - 首页 额度展示
 */
const $ = id => document.getElementById(id);

function toast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2000);
}

function getParam(name) {
  return new URLSearchParams(location.search).get(name) || '';
}

// ============ 初始化 ============
async function init() {
  const token = getParam('token');
  const session = getParam('session');

  if (!token || !session) {
    toast('链接无效，请重新扫码');
    return;
  }

  try {
    const resp = await fetch(`/api/user-limit?session=${encodeURIComponent(session)}`);
    const data = await resp.json();

    if (!data.ok) {
      toast(data.msg || '获取信息失败');
      return;
    }

    renderPage(data);
  } catch (e) {
    toast('网络异常，请重试');
  }
}

// ============ 渲染页面 ============
function renderPage(data) {
  const { phone, hasSubmitted, amount, approved, info } = data;

  // 显示手机号（脱敏）
  const masked = phone.substring(0, 3) + '****' + phone.slice(-4);
  $('phoneShow').textContent = masked;

  // 问候语
  const hour = new Date().getHours();
  let greet = '👋 ';
  if (hour < 9) greet += '早上好';
  else if (hour < 12) greet += '上午好';
  else if (hour < 14) greet += '中午好';
  else if (hour < 18) greet += '下午好';
  else greet += '晚上好';
  $('greeting').textContent = greet;

  // 额度卡片
  const card = $('amountCard');

  if (hasSubmitted && approved) {
    // 已提交且审核通过 → 显示上次测试的额度
    card.innerHTML = `
      <div class="amount-label"><span class="dia">&#9671;</span> 你的可借额度（元）<span class="dia">&#9671;</span></div>
      <div class="amount-wrap">
        <span class="amount-num">${amount.toLocaleString()}</span><span class="amount-unit">元</span>
      </div>
      <button class="amount-btn" onclick="goTest()">重新测试额度</button>
      <div class="rate-info">年化利率(单利) <b>7.2%</b>~<b>18%</b><span class="rate-tag">限时优惠</span></div>
    `;
    // 更新提示
    $('tipsText').textContent = '额度有效期30天，到期后可重新测试。';
  } else if (hasSubmitted && !approved) {
    // 已提交但未通过 → 显示最高额度，可重新测试
    card.innerHTML = `
      <div class="amount-label"><span class="dia">&#9671;</span> 最高可借额度（元）<span class="dia">&#9671;</span></div>
      <div class="amount-wrap">
        <span class="amount-num">1,000,000</span><span class="amount-unit">元</span>
      </div>
      <div class="amount-status pending">⏳ 上次未通过审核</div>
      <button class="amount-btn" onclick="goTest()">重新测试额度</button>
      <div class="rate-info">年化利率(单利) <b>7.2%</b>~<b>18%</b><span class="rate-tag">限时优惠</span></div>
    `;
    $('tipsText').textContent = '请核对资料后重新提交测试。';
  } else {
    // 未提交过资料 → 显示最高额度，引导测试
    card.innerHTML = `
      <div class="amount-label"><span class="dia">&#9671;</span> 最高可借额度（元）<span class="dia">&#9671;</span></div>
      <div class="amount-wrap">
        <span class="amount-num">1,000,000</span><span class="amount-unit">元</span>
      </div>
      <div class="amount-status pending">📝 填写资料获取专属额度</div>
      <button class="amount-btn" onclick="goTest()">测试额度</button>
      <div class="rate-info">年化利率(单利) <b>7.2%</b>~<b>18%</b><span class="rate-tag">限时优惠</span></div>
    `;
    $('tipsText').textContent = '填写完整资料可获得更高额度评估。';
  }

  // 用户资料卡片
  if (info && hasSubmitted) {
    const infoCard = $('infoCard');
    infoCard.style.display = 'block';
    $('infoContent').innerHTML = `
      <div class="info-row"><span class="k">姓名</span><span class="v">${esc(info.name)}</span></div>
      <div class="info-divider"></div>
      <div class="info-row"><span class="k">身份证号</span><span class="v">${maskId(info.idCard)}</span></div>
      <div class="info-divider"></div>
      <div class="info-row"><span class="k">单位</span><span class="v">${esc(info.company)}</span></div>
      <div class="info-divider"></div>
      <div class="info-row"><span class="k">提交时间</span><span class="v">${new Date(info.createdAt).toLocaleString('zh-CN', { hour12: false })}</span></div>
    `;
  }
}

// ============ 跳转测试额度 ============
function goTest() {
  const token = getParam('token');
  const session = getParam('session');
  location.href = `/form.html?token=${encodeURIComponent(token)}&session=${encodeURIComponent(session)}`;
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function maskId(id) {
  return id ? id.substring(0, 3) + '****' + id.slice(-4) : '';
}

// 启动
init();
