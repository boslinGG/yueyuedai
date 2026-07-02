/**
 * 月月贷 - 四步资料填写（含身份证OCR自动识别）
 */
const $ = (id) => document.getElementById(id);

// ============ 工具 ============
function safeText(id, text) { const el = $(id); if (el) el.textContent = text; }
function safeStep(id, action, cls) {
  const el = $(id); if (!el) return;
  if (cls) el.classList.add(cls);
  if (action) { const icon = el.querySelector('.rs-icon'); if (icon) icon.textContent = action; }
}
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tid); t._tid = setTimeout(() => t.classList.remove('show'), 1800);
}
function showConfirm(msg, onOk) {
  const overlay = $('confirmOverlay'), msgEl = $('confirmMsg'), okBtn = $('confirmOk'), cancelBtn = $('confirmCancel');
  if (!overlay || !msgEl || !okBtn || !cancelBtn) { if (confirm(msg)) onOk(); return; }
  msgEl.textContent = msg; overlay.classList.add('on');
  const cleanup = () => { overlay.classList.remove('on'); okBtn.removeEventListener('click', handleOk); cancelBtn.removeEventListener('click', handleCancel); };
  function handleOk() { cleanup(); onOk(); }
  function handleCancel() { cleanup(); }
  okBtn.addEventListener('click', handleOk); cancelBtn.addEventListener('click', handleCancel);
}

// ============ 单选框 ============
function initRtags() {
  document.querySelectorAll('.rtags').forEach(group => {
    group.addEventListener('click', (e) => {
      const tag = e.target.closest('.rtag');
      if (!tag) return;
      group.querySelectorAll('.rtag').forEach(t => t.classList.remove('sel'));
      tag.classList.add('sel');
    });
  });
}
function getRadio(groupId) {
  const el = $(groupId).querySelector('.rtag.sel');
  return el ? el.dataset.val : '';
}

// ============ 步骤导航 ============
let currentStep = 1;

function nextStep(from) {
  if (from === 1) {
    if (!validateStep1()) return;
  } else if (from === 2) {
    if (!validateStep2()) return;
  } else if (from === 3) {
    if (!validateStep3()) return;
  }
  gotoStep(from + 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(from) {
  gotoStep(from - 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function gotoStep(n) {
  currentStep = n;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.step-panel').forEach(p => { if (p.id === 'step' + n) p.classList.add('active'); });
  updateStepIndicator(n);
}

function updateStepIndicator(n) {
  const items = document.querySelectorAll('.step-item');
  const lines = document.querySelectorAll('.step-line');
  items.forEach((item, i) => {
    const s = i + 1;
    item.classList.remove('active', 'done');
    if (s < n) item.classList.add('done');
    else if (s === n) item.classList.add('active');
  });
  lines.forEach((line, i) => {
    line.classList.toggle('done', i + 1 < n);
  });
}

// ============ 验证函数 ============
function validateStep1() {
  const name = $('name').value.trim();
  const idCard = $('idCard').value.trim();
  const gender = getRadio('genderGroup');
  const nation = $('nation').value;
  const birthday = $('birthday').value;

  if (!name) { toast('请填写姓名'); return false; }
  if (!idCard || !/^\d{17}[\dXx]$/.test(idCard)) { toast('请填写正确18位身份证号'); return false; }
  if (!gender) { toast('请选择性别'); return false; }
  if (!nation) { toast('请选择民族'); return false; }
  if (!birthday) { toast('请选择出生日期'); return false; }
  return true;
}

function validateStep2() {
  if (!$('province').value || !$('city').value || !$('district').value) { toast('请选择省/市/区'); return false; }
  if (!$('address').value.trim()) { toast('请填写详细地址'); return false; }
  return true;
}

function validateStep3() {
  if (!$('company').value.trim()) { toast('请填写单位全称'); return false; }
  if (!$('position').value) { toast('请选择职位/职务'); return false; }
  if (!getRadio('incomeGroup')) { toast('请选择税后月收入'); return false; }
  return true;
}

function validateStep4() {
  const cn = $('contactName').value.trim();
  const cp = $('contactPhone').value.trim();
  const rel = getRadio('relationGroup');
  if (!cn) { toast('请填写联系人姓名'); return false; }
  if (!cp || !/^1[3-9]\d{9}$/.test(cp)) { toast('请填写正确联系人手机号'); return false; }
  if (!rel) { toast('请选择与本人关系'); return false; }
  return true;
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
$('nationWrap').addEventListener('click', (e) => { e.stopPropagation(); $('nationList').classList.toggle('show'); });

// ============ 职位下拉（全面） ============
const POSITIONS = [
  '董事长','首席执行官CEO','总裁','副总裁','总经理','副总经理','总监',
  '部门经理','项目经理','主管','组长','厂长','主任','店长',
  '高级工程师','软件工程师','硬件工程师','架构师','算法工程师','数据分析师','测试工程师','运维工程师','前端工程师','后端工程师','全栈工程师','Android工程师','iOS工程师',
  'UI设计师','UX设计师','平面设计师','产品设计师','室内设计师',
  '产品经理','运营经理','运营专员','产品助理',
  '财务总监','财务经理','会计','出纳','审计',
  '人力资源总监','招聘专员','行政经理','行政专员','文员','前台','秘书',
  '市场总监','市场经理','销售总监','销售经理','销售代表','客户经理','商务专员','品牌经理',
  '理财顾问','投资经理','保险代理人','风控专员','信贷员','柜员',
  '主任医师','主治医师','护士长','护士','药剂师',
  '教授','副教授','讲师','助教','教师','幼师',
  '律师','法务','法律顾问',
  '工程师','监理','造价员','施工员','安全员','测量员','材料员',
  '编辑','记者','摄影师','视频剪辑师','公关专员',
  '物流经理','快递员','仓管','采购专员','供应链专员',
  '厨师','服务员','调酒师','理发师','美容师','按摩师',
  '公务员','事业编制人员','社区工作人员','辅警',
  '电工','焊工','机修工','操作工','质检员','普工',
  '货车司机','出租车司机','私家司机','公交车司机',
  '个体工商户','自由职业者','网店店主','自媒体运营','主播',
  '农民','养殖户','园丁',
  '学生','退休','无业','其他'
];
buildDrop('positionList', POSITIONS, 'position', 'positionWrap');
$('positionWrap').addEventListener('click', (e) => { e.stopPropagation(); $('positionList').classList.toggle('show'); });

// ============ 身份证号自动填充性别/生日 ============
$('idCard').addEventListener('blur', function() {
  const v = this.value.trim();
  if (v.length === 18 && /^\d{17}[\dXx]$/.test(v)) {
    const bd = v.substring(6, 10) + '-' + v.substring(10, 12) + '-' + v.substring(12, 14);
    $('birthday').value = bd;
    const g = parseInt(v.charAt(16)) % 2 === 1 ? '男' : '女';
    $('genderGroup').querySelectorAll('.rtag').forEach(t => { t.classList.remove('sel'); if (t.dataset.val === g) t.classList.add('sel'); });
  }
});

// ============ 省市区 ============
let REGION = {}, regionReady = false;
fetch('region.json').then(res => res.json()).then(data => { REGION = data; regionReady = true; buildProvince(); }).catch(() => toast('加载地区数据失败'));
function buildProvince() {
  const list = Object.keys(REGION); if (!list.length) return;
  buildDrop('provinceList', list, 'province', 'pWrap', () => { $('city').value = ''; $('district').value = ''; $('cityList').innerHTML = ''; $('districtList').innerHTML = ''; });
}
$('pWrap').addEventListener('click', (e) => { e.stopPropagation(); $('provinceList').classList.toggle('show'); });
$('cWrap').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!regionReady) { toast('数据加载中'); return; }
  const p = $('province').value; if (!p) { toast('请先选择省份'); return; }
  buildDrop('cityList', Object.keys(REGION[p]), 'city', 'cWrap', () => { $('district').value = ''; $('districtList').innerHTML = ''; });
  $('cityList').classList.toggle('show');
});
$('dWrap').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!regionReady) { toast('数据加载中'); return; }
  const p = $('province').value, c = $('city').value; if (!c) { toast('请先选择城市'); return; }
  buildDrop('districtList', REGION[p][c] || [], 'district', 'dWrap');
  $('districtList').classList.toggle('show');
});

// ============ 通用下拉构建 ============
function buildDrop(containerId, items, inputId, wrapId, cb) {
  const container = $(containerId);
  container.innerHTML = items.map(item => `<div class="sel-opt" data-val="${item}">${item}</div>`).join('');
  container.querySelectorAll('.sel-opt').forEach(opt => {
    opt.addEventListener('click', (e) => { e.stopPropagation(); $(inputId).value = opt.dataset.val; container.classList.remove('show'); if (cb) cb(opt.dataset.val); });
  });
}
document.addEventListener('click', () => { document.querySelectorAll('.sel-drop.show').forEach(d => d.classList.remove('show')); });

// ============ 备注计数 ============
$('remark').addEventListener('input', function() { $('remarkLen').textContent = this.value.length; });

// ============ 身份证照片上传 + 自动OCR ============
let frontFile = null, backFile = null, isScanning = false;

function setupIdUpload(boxId, inputId, previewId, placeholderId) {
  const box = $(boxId);
  const input = $(inputId);
  const preview = $(previewId);
  const placeholder = $(placeholderId);

  // 点击整个区域触发文件选择
  box.addEventListener('click', (e) => {
    if (e.target === input) return;
    input.click();
  });

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    if (inputId === 'frontInput') frontFile = file;
    else backFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      box.classList.add('uploaded');
    };
    reader.readAsDataURL(file);

    // 自动触发OCR
    tryAutoScan();
  });
}

function tryAutoScan() {
  if (isScanning) return;
  if (!frontFile) return;  // 只需正面照即可开始识别

  isScanning = true;
  const status = $('scanStatus');
  status.textContent = '⏳ 正在自动识别身份证信息...';
  status.className = 'scan-status';

  doOcr();
}

async function doOcr() {
  const status = $('scanStatus');
  try {
    const formData = new FormData();
    if (frontFile) formData.append('front', frontFile);
    if (backFile)  formData.append('back', backFile);

    status.textContent = '⏳ 正在识别身份证信息...';
    status.className = 'scan-status';

    // 8秒超时，确保5秒内完成识别
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch('/api/ocr-idcard', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await resp.json();

    if (data.ok) {
      fillFormFromOcr(data);
      status.textContent = '✅ 识别成功，请核对修改信息';
      status.className = 'scan-status ok';
      isScanning = false;
      return;
    }

    // 服务端未配置百度OCR
    if (data.code === 'NO_CONFIG') {
      status.textContent = '⚠ 管理员未配置OCR服务，请手动填写（管理员可设置腾讯云OCR环境变量）';
      status.className = 'scan-status err';
      isScanning = false;
      return;
    }

    throw new Error(data.msg || '识别失败');
  } catch (e) {
    console.error('OCR error:', e);
    if (e.name === 'AbortError') {
      status.textContent = '⚠ 识别超时（8秒），请手动填写身份信息';
    } else {
      status.textContent = '⚠ ' + (e.message || '识别失败，请手动填写身份信息');
    }
    status.className = 'scan-status err';
    isScanning = false;
  }
}

function fillFormFromOcr(data) {
  if (data.name) $('name').value = data.name;
  if (data.idCard) $('idCard').value = data.idCard;
  if (data.gender) {
    $('genderGroup').querySelectorAll('.rtag').forEach(t => t.classList.toggle('sel', t.dataset.val === data.gender));
  }
  if (data.nation) $('nation').value = data.nation;
  if (data.birthday) $('birthday').value = data.birthday;
  if (data.validity) $('idValid').value = data.validity;
  if (data.authority) $('idAuth').value = data.authority;
  if (data.hukouAddr) $('hukouAddr').value = data.hukouAddr;
  if (data.idCard) $('idCard').dispatchEvent(new Event('blur'));
}

setupIdUpload('frontUpload', 'frontInput', 'frontPreview', 'frontPlaceholder');
setupIdUpload('backUpload', 'backInput', 'backPreview', 'backPlaceholder');

// ============ 提交 ============
function submit() {
  if (!validateStep4()) return;

  const data = {
    name: $('name').value.trim(),
    idCard: $('idCard').value.trim(),
    gender: getRadio('genderGroup'),
    nation: $('nation').value,
    birthday: $('birthday').value,
    idValid: $('idValid').value.trim(),
    company: $('company').value.trim(),
    creditCode: $('creditCode').value.trim(),
    position: $('position').value,
    income: getRadio('incomeGroup'),
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

  showConfirm('确认提交？提交后将进入审核。', () => { startReview(data); });
}

// ============ 审核流程 ============
function startReview(data) {
  const overlay = $('reviewOverlay');
  if (!overlay) { toast('页面异常'); return; }
  overlay.classList.add('on');

  const ring = $('ringFg');
  if (!ring) return;
  const CIRCLE = 2 * Math.PI * 80;
  ring.style.stroke = '#22D3EE';
  ring.style.strokeDashoffset = '0';
  safeText('rNum', '10');
  safeText('rIcon', '⏳');
  safeText('rTitle', '审核中');
  safeText('rDesc', '系统正在核验您的资料...');
  ['rs1','rs2','rs3','rs4'].forEach(id => safeStep(id, '⏳'));
  overlay.scrollTop = 0;

  let sec = 0;
  const timer = setInterval(() => {
    sec++; const remain = 10 - sec;
    safeText('rNum', String(remain));
    ring.style.strokeDashoffset = CIRCLE * (sec / 10);

    if (sec === 1) { safeStep('rs1', '✅', 'done'); safeText('rDesc', '正在核验身份信息...'); }
    if (sec === 3) { safeStep('rs2', '✅', 'done'); safeText('rDesc', '正在核验单位信息...'); }
    if (sec === 5) { safeStep('rs3', '✅', 'done'); }
    if (sec === 7) { safeStep('rs4', '✅', 'done'); }
    if (sec === 8) { ring.style.stroke = '#EAB308'; }

    if (sec >= 10) { clearInterval(timer); ring.style.strokeDashoffset = CIRCLE; safeText('rNum', '0'); submitToServer(data); }
  }, 1000);
}

async function submitToServer(data) {
  const ring = $('ringFg');
  const session = new URLSearchParams(location.search).get('session') || '';
  if (!session) { toast('会话已过期，请重新扫码'); return; }

  try {
    const resp = await fetch('/api/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, data })
    });
    const result = await resp.json();
    if (!result.ok) { toast(result.msg || '提交失败'); $('reviewOverlay').classList.remove('on'); return; }

    if (result.passed) {
      ring.style.stroke = '#10B981';
      safeText('rIcon', '✅'); safeText('rTitle', '审核通过'); safeText('rDesc', '您的资料已审核通过');
      ['rs1','rs2','rs3','rs4'].forEach(id => safeStep(id, '✅', 'done'));
    } else {
      ring.style.stroke = '#EF4444';
      safeText('rIcon', '❌'); safeText('rTitle', '审核未通过'); safeText('rDesc', '身份信息核验异常');
      safeStep('rs1', '❌', 'fail');
    }
    setTimeout(() => showResult(data, result.passed, result.amount), 600);
  } catch (e) {
    toast('网络异常，审核失败'); $('reviewOverlay').classList.remove('on');
  }
}

function showResult(data, passed, amount) {
  const bg = $('resultModal'), box = $('modalBox');
  if (!bg || !box) return;
  const now = new Date().toLocaleString('zh-CN', { hour12: false });

  if (passed) {
    const amt = amount || 100;
    box.innerHTML = `
      <div class="loan-page">
        <div class="loan-blue-bg">
          <div class="loan-card">
            <div class="loan-label"><span class="ll-dia">&#9671;</span> 可借额度 (万元) <span class="ll-dia">&#9671;</span></div>
            <div class="loan-amount">${amt.toLocaleString()}</div>
            <button class="loan-btn" onclick="goHome()">返回首页</button>
            <div class="loan-rate">年化利率(单利) <b>7.2%</b>~<b>18%</b><span class="rate-tag">限时优惠</span></div>
          </div>
        </div>
        <div class="loan-info">
          <div class="li-row"><span class="li-l">姓名</span><span class="li-v">${esc(data.name)}</span></div>
          <div class="li-row"><span class="li-l">身份证号</span><span class="li-v">${maskId(data.idCard)}</span></div>
          <div class="li-row"><span class="li-l">单位</span><span class="li-v">${esc(data.company)}</span></div>
          <div class="li-row"><span class="li-l">审核时间</span><span class="li-v">${now}</span></div>
        </div>
      </div>`;
    bg.classList.add('loan-mode');
  } else {
    bg.classList.remove('loan-mode');
    box.innerHTML = `
      <div class="modal-fail-head"><div class="modal-fail-icon">❌</div><div class="modal-fail-title">审核未通过</div></div>
      <div class="modal-body">
        <div class="modal-item"><span class="mi-l">原因</span><span class="mi-v" style="color:#EF4444">身份信息不一致</span></div>
        <div class="modal-item"><span class="mi-l">建议</span><span class="mi-v">请核对身份证信息后重新提交</span></div>
      </div>
      <div class="modal-footer"><button class="modal-btn primary" onclick="reset()">重新填写</button></div>`;
  }
  bg.classList.add('on');
}

function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function maskId(id) { return id ? id.substring(0, 3) + '****' + id.slice(-4) : ''; }

window.goHome = function() {
  const token = new URLSearchParams(location.search).get('token') || '';
  const session = new URLSearchParams(location.search).get('session') || '';
  location.href = `/home.html?token=${encodeURIComponent(token)}&session=${encodeURIComponent(session)}&v=2`;
};

window.reset = function() {
  const rm = $('resultModal'), ro = $('reviewOverlay');
  if (rm) rm.classList.remove('on');
  if (ro) ro.classList.remove('on');
  document.querySelectorAll('.finp').forEach(el => el.value = '');
  document.querySelectorAll('.ftarea').forEach(el => el.value = '');
  document.querySelectorAll('.rtag.sel').forEach(el => el.classList.remove('sel'));
  const rl = $('remarkLen'); if (rl) rl.textContent = '0';
  const cl = $('cityList'); if (cl) cl.innerHTML = '';
  const dl = $('districtList'); if (dl) dl.innerHTML = '';
  // 重置身份证照片
  frontFile = null; backFile = null; isScanning = false;
  document.querySelectorAll('.idcard-preview').forEach(p => { p.style.display = 'none'; p.src = ''; });
  document.querySelectorAll('.idcard-placeholder').forEach(p => p.style.display = 'flex');
  document.querySelectorAll('.idcard-box').forEach(b => b.classList.remove('uploaded'));
  document.querySelectorAll('.idcard-file').forEach(f => f.value = '');
  const ss = $('scanStatus'); if (ss) { ss.textContent = ''; ss.className = 'scan-status'; }
  buildProvince();
  gotoStep(1);
  window.scrollTo(0, 0);
};

// ============ 初始化 ============
initRtags();
