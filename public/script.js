/**
 * 扫码填表审核 - 手机端逻辑
 * ================================
 * 流程：填写表单 → 校验 → 审核中(10s) → 结果弹窗
 */

// ============ 工具 ============
const $ = (id) => document.getElementById(id);

// 安全设置文本（元素不存在时静默忽略）
function safeText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}
// 安全操作步骤项
function safeStep(id, action, cls) {
  const el = $(id);
  if (!el) return;
  if (cls) el.classList.add(cls);
  if (action) {
    const icon = el.querySelector('.rs-icon');
    if (icon) icon.textContent = action;
  }
}

// Toast
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 1800);
}

// 自定义确认弹窗（替代 confirm，避免 WebView 兼容问题）
function showConfirm(msg, onOk) {
  const overlay = $('confirmOverlay');
  const msgEl = $('confirmMsg');
  const okBtn = $('confirmOk');
  const cancelBtn = $('confirmCancel');
  if (!overlay || !msgEl || !okBtn || !cancelBtn) {
    // 降级使用原生 confirm
    if (confirm(msg)) onOk();
    return;
  }
  msgEl.textContent = msg;
  overlay.classList.add('on');
  // 绑定确认/取消
  const cleanup = () => {
    overlay.classList.remove('on');
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  function handleOk() { cleanup(); onOk(); }
  function handleCancel() { cleanup(); }
  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);
}

// ============ 单选标签组初始化 ============
document.querySelectorAll('.rtags').forEach(group => {
  group.addEventListener('click', (e) => {
    const tag = e.target.closest('.rtag');
    if (!tag) return;
    group.querySelectorAll('.rtag').forEach(t => t.classList.remove('sel'));
    tag.classList.add('sel');
  });
});

// 获取选中值
function getRadio(groupId) {
  const el = $(groupId).querySelector('.rtag.sel');
  return el ? el.dataset.val : '';
}

// ============ 民族下拉 ============
const NATIONS = [
  '汉族','蒙古族','回族','藏族','维吾尔族','苗族','彝族','壮族',
  '布依族','朝鲜族','满族','侗族','瑶族','白族','土家族',
  '哈尼族','哈萨克族','傣族','黎族','傈僳族','佤族','畲族',
  '高山族','拉祜族','水族','东乡族','纳西族','景颇族',
  '柯尔克孜族','土族','达斡尔族','仫佬族','羌族','布朗族',
  '撒拉族','毛南族','仡佬族','锡伯族','阿昌族','普米族',
  '塔吉克族','怒族','乌孜别克族','俄罗斯族','鄂温克族',
  '德昂族','保安族','裕固族','京族','塔塔尔族','独龙族',
  '鄂伦春族','赫哲族','门巴族','珞巴族','基诺族'
];
buildDrop('nationList', NATIONS, 'nation', 'nationWrap');

// 民族下拉展开/收起
$('nationWrap').addEventListener('click', (e) => {
  e.stopPropagation();
  $('nationList').classList.toggle('show');
});

// ============ 省市区数据（从 region.json 加载） ============
let REGION = {};
let regionReady = false;

fetch('region.json')
  .then(res => res.json())
  .then(data => {
    REGION = data;
    regionReady = true;
    buildProvince();
  })
  .catch(err => {
    console.error('加载地区数据失败:', err);
    toast('加载地区数据失败，请刷新重试');
  });

// 构建省下拉
function buildProvince() {
  const list = Object.keys(REGION);
  if (!list.length) return;
  buildDrop('provinceList', list, 'province', 'pWrap', () => {
    $('city').value = ''; $('district').value = '';
    $('cityList').innerHTML = ''; $('districtList').innerHTML = '';
  });
}

// 点击省市下拉
document.getElementById('pWrap').addEventListener('click', (e) => {
  e.stopPropagation();
  $('provinceList').classList.toggle('show');
});
document.getElementById('cWrap').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!regionReady) { toast('数据加载中，请稍后'); return; }
  const p = $('province').value;
  if (!p) { toast('请先选择省份'); return; }
  const cities = Object.keys(REGION[p]);
  buildDrop('cityList', cities, 'city', 'cWrap', () => {
    $('district').value = ''; $('districtList').innerHTML = '';
  });
  $('cityList').classList.toggle('show');
});
document.getElementById('dWrap').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!regionReady) { toast('数据加载中，请稍后'); return; }
  const p = $('province').value;
  const c = $('city').value;
  if (!c) { toast('请先选择城市'); return; }
  const districts = REGION[p][c] || [];
  buildDrop('districtList', districts, 'district', 'dWrap');
  $('districtList').classList.toggle('show');
});

// 身份证自动填充出生日期与性别
$('idCard').addEventListener('blur', function() {
  const v = this.value.trim();
  if (v.length === 18 && /^\d{17}[\dXx]$/.test(v)) {
    // 提取出生日期: 第7-14位
    const bd = v.substring(6, 10) + '-' + v.substring(10, 12) + '-' + v.substring(12, 14);
    $('birthday').value = bd;
    // 提取性别: 第17位，奇数男偶数女
    const genderDigit = parseInt(v.charAt(16));
    const gender = genderDigit % 2 === 1 ? '男' : '女';
    const tags = $('genderGroup').querySelectorAll('.rtag');
    tags.forEach(t => {
      t.classList.remove('sel');
      if (t.dataset.val === gender) t.classList.add('sel');
    });
  }
});

// ============ 通用：构建下拉列表 ============
function buildDrop(containerId, items, inputId, wrapId, cb) {
  const container = $(containerId);
  container.innerHTML = items.map(item =>
    `<div class="sel-opt" data-val="${item}">${item}</div>`
  ).join('');
  container.querySelectorAll('.sel-opt').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      $(inputId).value = opt.dataset.val;
      container.classList.remove('show');
      if (cb) cb(opt.dataset.val);
    });
  });
}

// 全局点击关闭下拉
document.addEventListener('click', () => {
  document.querySelectorAll('.sel-drop.show').forEach(d => d.classList.remove('show'));
});

// ============ 备注计数 ============
$('remark').addEventListener('input', function() {
  $('remarkLen').textContent = this.value.length;
});

// ============ DOMReady 后初始化 ============
function initApp() {
  // 提交按钮
  $('btnSubmit').addEventListener('click', submit);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function submit() {
  // 收集数据
  const data = {
    name: $('name').value.trim(),
    idCard: $('idCard').value.trim(),
    gender: getRadio('genderGroup'),
    nation: $('nation').value,
    birthday: $('birthday').value,
    idValid: getRadio('idValidGroup'),
    company: $('company').value.trim(),
    creditCode: $('creditCode').value.trim(),
    position: $('position').value.trim(),
    jobNumber: $('jobNumber').value.trim(),
    companyPhone: $('companyPhone').value.trim(),
    province: $('province').value,
    city: $('city').value,
    district: $('district').value,
    address: $('address').value.trim(),
    liveType: getRadio('liveTypeGroup'),
    contactName: $('contactName').value.trim(),
    contactPhone: $('contactPhone').value.trim(),
    relation: getRadio('relationGroup'),
    remark: $('remark').value.trim()
  };

  // ==== 校验 ====
  if (!data.name) { toast('请填写姓名'); return; }
  if (!data.idCard || !/^\d{17}[\dXx]$/.test(data.idCard)) { toast('请填写正确18位身份证号'); return; }
  if (!data.gender) { toast('请选择性别'); return; }
  if (!data.nation) { toast('请选择民族'); return; }
  if (!data.birthday) { toast('请选择出生日期'); return; }
  if (!data.company) { toast('请填写单位全称'); return; }
  if (!data.position) { toast('请填写职位/职务'); return; }
  if (!data.province || !data.city || !data.district) { toast('请选择省/市/区'); return; }
  if (!data.address) { toast('请填写详细地址'); return; }
  if (!data.contactName) { toast('请填写联系人姓名'); return; }
  if (!data.contactPhone || !/^1[3-9]\d{9}$/.test(data.contactPhone)) { toast('请填写正确联系人手机号'); return; }
  if (!data.relation) { toast('请选择与本人关系'); return; }

  // 二次确认（自定义弹窗，避免 WebView 兼容问题）
  showConfirm('确认提交？提交后将进入审核。', () => {
    startReview(data);
  });
}

// ============ 审核流程（10秒后提交后端）============
function startReview(data) {
  const overlay = $('reviewOverlay');
  if (!overlay) { toast('页面异常，请刷新后重试'); return; }
  overlay.classList.add('on');

  // 重置
  const ring = $('ringFg');
  if (!ring) return;
  const CIRCLE = 2 * Math.PI * 80;
  ring.style.stroke = '#22D3EE';
  ring.style.strokeDashoffset = '0';
  safeText('rNum', '10');
  safeText('rIcon', '⏳');
  safeText('rTitle', '审核中');
  safeText('rDesc', '系统正在核验您的资料...');
  ['rs1','rs2','rs3','rs4'].forEach(id => {
    safeStep(id, '⏳');
  });

  overlay.scrollTop = 0;

  let sec = 0;
  const timer = setInterval(() => {
    sec++;
    const remain = 10 - sec;
    safeText('rNum', String(remain));
    ring.style.strokeDashoffset = CIRCLE * (sec / 10);

    if (sec === 1) { safeStep('rs1', '✅', 'done'); safeText('rDesc', '正在核验身份信息...'); }
    if (sec === 3) { safeStep('rs2', '✅', 'done'); safeText('rDesc', '正在核验单位信息...'); }
    if (sec === 4) { safeText('rDesc', '正在进行交叉比对...'); }
    if (sec === 5) { safeStep('rs3', '✅', 'done'); }
    if (sec === 6) { safeText('rDesc', '正在进行综合评估...'); }
    if (sec === 7) { safeStep('rs4', '✅', 'done'); }
    if (sec === 8) { ring.style.stroke = '#EAB308'; }

    if (sec >= 10) {
      clearInterval(timer);
      ring.style.strokeDashoffset = CIRCLE;
      safeText('rNum', '0');

      // 提交到后端进行审核
      submitToServer(data);
    }
  }, 1000);
}

// ============ 提交表单到后端 ============
async function submitToServer(data) {
  const ring = $('ringFg');

  // 从 URL 获取 session
  const session = new URLSearchParams(location.search).get('session') || '';
  const token = new URLSearchParams(location.search).get('token') || '';

  if (!session) {
    toast('会话已过期，请重新扫码');
    return;
  }

  try {
    const resp = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, data })
    });
    const result = await resp.json();

    if (!result.ok) {
      toast(result.msg || '提交失败，请重试');
      $('reviewOverlay').classList.remove('on');
      return;
    }

    if (result.passed) {
      ring.style.stroke = '#10B981';
      safeText('rIcon', '✅');
      safeText('rTitle', '审核通过');
      safeText('rDesc', '您的资料已审核通过');
      ['rs1','rs2','rs3','rs4'].forEach(id => safeStep(id, '✅', 'done'));
    } else {
      ring.style.stroke = '#EF4444';
      safeText('rIcon', '❌');
      safeText('rTitle', '审核未通过');
      safeText('rDesc', '身份信息核验异常');
      safeStep('rs1', '❌', 'fail');
    }

    setTimeout(() => showResult(data, result.passed, result.amount), 600);
  } catch (e) {
    toast('网络异常，审核失败');
    $('reviewOverlay').classList.remove('on');
  }
}

// ============ 结果弹窗 ============
function showResult(data, passed, amount) {
  const bg = $('resultModal');
  const box = $('modalBox');
  if (!bg || !box) { toast('页面异常，请刷新后重试'); return; }
  const now = new Date().toLocaleString('zh-CN', { hour12: false });

  if (passed) {
    const amt = amount || 1000000;
    box.innerHTML = `
      <div class="loan-page">
        <!-- 蓝色背景区 -->
        <div class="loan-blue-bg">
          <!-- 白色卡片 -->
          <div class="loan-card">
            <!-- 额度标签 -->
            <div class="loan-label"><span class="ll-dia">&#9671;</span> 可借额度 (元) <span class="ll-dia">&#9671;</span></div>
            <!-- 大金额数字 -->
            <div class="loan-amount">${amt.toLocaleString()}</div>
            <!-- 蓝色按钮 -->
            <button class="loan-btn" onclick="goHome()">返回首页</button>
            <!-- 利率说明 -->
            <div class="loan-rate">年化利率(单利) <b>7.2%</b>~<b>18%</b><span class="rate-tag">限时优惠</span></div>
          </div>
        </div>
        <!-- 底部信息摘要 -->
        <div class="loan-info">
          <div class="li-row"><span class="li-l">姓名</span><span class="li-v">${esc(data.name)}</span></div>
          <div class="li-row"><span class="li-l">身份证号</span><span class="li-v">${maskId(data.idCard)}</span></div>
          <div class="li-row"><span class="li-l">单位</span><span class="li-v">${esc(data.company)}</span></div>
          <div class="li-row"><span class="li-l">审核时间</span><span class="li-v">${now}</span></div>
        </div>
      </div>
    `;
    bg.classList.add('loan-mode');
  } else {
    bg.classList.remove('loan-mode');
    box.innerHTML = `
      <div class="modal-fail-head">
        <div class="modal-fail-icon">❌</div>
        <div class="modal-fail-title">审核未通过</div>
      </div>
      <div class="modal-body">
        <div class="modal-item"><span class="mi-l">原因</span><span class="mi-v" style="color:#EF4444">身份信息不一致</span></div>
        <div class="modal-item"><span class="mi-l">建议</span><span class="mi-v">请核对身份证信息后重新提交</span></div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn primary" onclick="reset()">重新填写</button>
      </div>
    `;
  }

  bg.classList.add('on');
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

// 返回首页
window.goHome = function() {
  const token = new URLSearchParams(location.search).get('token') || '';
  const session = new URLSearchParams(location.search).get('session') || '';
  location.href = `/home.html?token=${encodeURIComponent(token)}&session=${encodeURIComponent(session)}&v=2`;
};

// 重置
window.reset = function() {
  const rm = $('resultModal');
  const ro = $('reviewOverlay');
  if (rm) rm.classList.remove('on');
  if (ro) ro.classList.remove('on');
  // 清空表单
  document.querySelectorAll('.finp').forEach(el => el.value = '');
  document.querySelectorAll('.ftarea').forEach(el => el.value = '');
  document.querySelectorAll('.rtag.sel').forEach(el => el.classList.remove('sel'));
  const rl = $('remarkLen'); if (rl) rl.textContent = '0';
  const cl = $('cityList'); if (cl) cl.innerHTML = '';
  const dl = $('districtList'); if (dl) dl.innerHTML = '';
  buildProvince();
  window.scrollTo(0, 0);
};

// ============ 禁止下拉刷新（可选） ============
document.addEventListener('touchmove', function(e) {
  if (e.target.closest('.sel-drop')) return;
}, { passive: true });
