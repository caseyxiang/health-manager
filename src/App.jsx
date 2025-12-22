import { useState, useEffect, useRef } from 'react';
import Icons from './components/icons/Icons';
import { TrendChart, VitalMiniChart, VitalTrendChart, MedicationGantt } from './components/charts';
import VitalsFormModal from './components/modals/VitalsFormModal';
import MemberFormModal from './components/modals/MemberFormModal';
import BackupModal from './components/modals/BackupModal';
import ScanModal from './components/modals/ScanModal';
import TrendModal from './components/modals/TrendModal';
import CheckupModal from './components/modals/CheckupModal';
import MedicalRecordModal from './components/modals/MedicalRecordModal';
import LeanCloud from './services/leancloud';
import { analyzeMedicalImage, getApiKeyFor, saveApiKeyFor, getCurrentApi, setCurrentApi } from './services/ai';
import { getLocalDateStr, getLocalTimeStr, getTimestamp, compareVersions } from './utils';
import { getMedicationMethodString, calculateFlag, cleanIndicatorName, applyDictionaryToLabReport } from './utils/medical';
import {
  VERSION,
  UNITS,
  DOSAGE_FORMS,
  RELATIONS,
  MEMBER_COLORS,
  DEFAULT_MEMBER,
  DEFAULT_MEMBERS,
  TIME_PERIODS,
  CHART_COLORS,
  VITAL_TYPES,
  API_PROVIDERS,
  DEFAULT_MEDS,
  DEFAULT_CATALOG,
  DEFAULT_CHECKUPS,
  DEFAULT_LAB_REPORTS,
  DEFAULT_IMAGING_REPORTS,
  DEFAULT_VITALS,
  MEDICAL_GLOSSARY,
  DEFAULT_MEDICAL_DICTIONARY,
  CHECKUP_TYPES
} from './constants';
import { CURRENT_ENV, LC_CONFIG, needsTestConfig } from './constants/config';

function App() {
  // 版本检查和登录状态
  const [isVersionChecked, setIsVersionChecked] = useState(false);
  const [mustRelogin, setMustRelogin] = useState(false);
  const [offlineError, setOfflineError] = useState(false);

  // 用户认证状态
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  // 设备管理
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('health_pro_device_id');
    if (!id) {
      id = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('health_pro_device_id', id);
    }
    return id;
  });
  const [isKickedOut, setIsKickedOut] = useState(false);
  const saveToCloudLock = useRef(null);

  // Tab 状态
  const [activeTab, setActiveTab] = useState('vitals');
  const [medSubTab, setMedSubTab] = useState('plan');
  const [examSubTab, setExamSubTab] = useState('appointment');

  // 成员管理
  const [members, setMembers] = useState([]);
  const [currentMemberId, setCurrentMemberId] = useState('default');
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberInput, setMemberInput] = useState({ name: '', relation: '', color: 'indigo' });

  const currentMember = members.find(m => m.id === currentMemberId) || members[0] || null;
  const currentMemberColor = currentMember ? (MEMBER_COLORS.find(c => c.id === currentMember.color) || MEMBER_COLORS[0]) : MEMBER_COLORS[0];

  // 数据状态
  const [allMembersData, setAllMembersData] = useState({});
  const [medicalDictionary, setMedicalDictionary] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 当前成员数据
  const currentMemberData = allMembersData[currentMemberId] || {
    meds: [], catalog: [], checkups: [], labReports: [], imagingReports: [], medicalRecords: [], vitals: []
  };
  const meds = currentMemberData.meds;
  const catalog = currentMemberData.catalog;
  const checkups = currentMemberData.checkups;
  const labReports = currentMemberData.labReports;
  const imagingReports = currentMemberData.imagingReports;
  const medicalRecords = currentMemberData.medicalRecords || [];
  const vitals = currentMemberData.vitals;

  // 表单状态
  const [showMedForm, setShowMedForm] = useState(false);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [medInput, setMedInput] = useState({
    name: '', startTime: getLocalDateStr(new Date()), endTime: '', frequency: '1',
    dosagePerTime: '1', relation: '无关', timePeriods: [], isLongTerm: true,
    cycleEnabled: false, cycleDays: '', cycleRestDays: ''
  });
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [catalogInput, setCatalogInput] = useState({
    name: '', brand: '', dosageForm: '片剂', strength: '', unit: 'mg'
  });
  const [vitalsInput, setVitalsInput] = useState({
    type: 'blood_pressure', date: getLocalDateStr(new Date()), time: getLocalTimeStr(new Date()),
    value1: '', value2: '', note: ''
  });
  const [selectedVitalType, setSelectedVitalType] = useState(null);

  // 编辑成员相关
  const [editingMember, setEditingMember] = useState(null);

  // 备份相关
  const [backupDataStr, setBackupDataStr] = useState('');
  const [backupFileName, setBackupFileName] = useState('');
  const [backupStats, setBackupStats] = useState({ size: 0, meds: 0, catalog: 0, labs: 0, members: 0 });

  // 扫描相关
  const [scanType, setScanType] = useState('lab');
  const [scanEditData, setScanEditData] = useState(null);
  const [expandedReports, setExpandedReports] = useState({});
  const [expandedImaging, setExpandedImaging] = useState({});
  const [labSectionCollapsed, setLabSectionCollapsed] = useState(false);
  const [imagingSectionCollapsed, setImagingSectionCollapsed] = useState(false);
  const [showScanTypeMenu, setShowScanTypeMenu] = useState(false);
  const [selectedLabReports, setSelectedLabReports] = useState([]);
  const [selectedImagingReports, setSelectedImagingReports] = useState([]);
  const [customLabCategories, setCustomLabCategories] = useState([]);
  const [customImagingModalities, setCustomImagingModalities] = useState([]);
  const [customRecordTypes, setCustomRecordTypes] = useState([]);

  // 病历文书相关
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [medicalRecordEditData, setMedicalRecordEditData] = useState(null);
  const [medicalRecordEditingId, setMedicalRecordEditingId] = useState(null);
  const [medicalRecordSectionCollapsed, setMedicalRecordSectionCollapsed] = useState(false);
  const [selectedMedicalRecords, setSelectedMedicalRecords] = useState([]);
  const [expandedMedicalRecord, setExpandedMedicalRecord] = useState({});

  // 趋势分析相关
  const [selectedTrendItems, setSelectedTrendItems] = useState([]);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [trendDateRange, setTrendDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    return { start: getLocalDateStr(start), end: getLocalDateStr(end) };
  });

  // AI 配置相关
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [currentApiProvider, setCurrentApiProvider] = useState(() => getCurrentApi());
  const [apiKeyInput, setApiKeyInput] = useState('');

  // 检查预约相关
  const [showCheckupModal, setShowCheckupModal] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState(null);

  // 辅助函数
  const updateMemberData = (memberId, dataType, newData) => {
    setAllMembersData(prev => ({
      ...prev,
      [memberId]: { ...(prev[memberId] || {}), [dataType]: newData }
    }));
  };
  const setMeds = (newMeds) => updateMemberData(currentMemberId, 'meds', newMeds);
  const setCatalog = (newCatalog) => updateMemberData(currentMemberId, 'catalog', newCatalog);
  const setVitals = (newVitals) => updateMemberData(currentMemberId, 'vitals', newVitals);
  const setLabReports = (newLabReports) => updateMemberData(currentMemberId, 'labReports', newLabReports);
  const setImagingReports = (newImagingReports) => updateMemberData(currentMemberId, 'imagingReports', newImagingReports);
  const setMedicalRecords = (newRecords) => updateMemberData(currentMemberId, 'medicalRecords', newRecords);
  const setCheckups = (newCheckups) => updateMemberData(currentMemberId, 'checkups', newCheckups);

  // 保存检验报告
  const saveLabReport = (report) => {
    if (editingId) {
      setLabReports(labReports.map(r => r.id === editingId ? report : r));
    } else {
      setLabReports([...labReports, report]);
    }
    setShowScanModal(false);
    setEditingId(null);
    setScanEditData(null);
  };

  // 保存影像报告
  const saveImagingReport = (report) => {
    if (editingId) {
      setImagingReports(imagingReports.map(r => r.id === editingId ? report : r));
    } else {
      setImagingReports([...imagingReports, report]);
    }
    setShowScanModal(false);
    setEditingId(null);
    setScanEditData(null);
  };

  // 删除报告
  const deleteReport = (id) => {
    if (scanType === 'lab') {
      setLabReports(labReports.filter(r => r.id !== id));
    } else {
      setImagingReports(imagingReports.filter(r => r.id !== id));
    }
  };

  // 添加自定义报告类别（当AI识别的类型不在预定义列表中时）
  const handleAddCustomCategory = (type, category) => {
    if (type === 'lab') {
      setCustomLabCategories(prev => {
        if (prev.includes(category)) return prev;
        return [...prev, category];
      });
    } else if (type === 'imaging') {
      setCustomImagingModalities(prev => {
        if (prev.includes(category)) return prev;
        return [...prev, category];
      });
    }
  };

  // 添加自定义病历文书类型
  const handleAddCustomRecordType = (recordType) => {
    setCustomRecordTypes(prev => {
      if (prev.includes(recordType)) return prev;
      return [...prev, recordType];
    });
  };

  // 保存病历文书
  const saveMedicalRecord = (record) => {
    if (medicalRecordEditingId) {
      setMedicalRecords(medicalRecords.map(r => r.id === medicalRecordEditingId ? record : r));
    } else {
      setMedicalRecords([...medicalRecords, record]);
    }
    setShowMedicalRecordModal(false);
    setMedicalRecordEditingId(null);
    setMedicalRecordEditData(null);
  };

  // 删除病历文书
  const deleteMedicalRecord = (id) => {
    setMedicalRecords(medicalRecords.filter(r => r.id !== id));
  };

  // 保存检查预约
  const saveCheckup = (checkup) => {
    if (editingCheckup) {
      setCheckups(checkups.map(c => c.id === checkup.id ? checkup : c));
    } else {
      setCheckups([...checkups, checkup]);
    }
    setShowCheckupModal(false);
    setEditingCheckup(null);
  };

  // 删除检查预约
  const deleteCheckup = (id) => {
    setCheckups(checkups.filter(c => c.id !== id));
  };

  // 标记检查预约为已完成
  const completeCheckup = (id) => {
    setCheckups(checkups.map(c => c.id === id ? { ...c, completed: true, completedAt: new Date().toISOString() } : c));
  };

  // 活跃和已结束的用药
  const activeMeds = meds.filter(m => !m.endTime || new Date(m.endTime) >= new Date());
  const endedMeds = meds.filter(m => m.endTime && new Date(m.endTime) < new Date());
  const [isEndedExpanded, setIsEndedExpanded] = useState(false);

  // 获取某类型指标的最新记录
  const getLatestVital = (type) => {
    const filtered = vitals.filter(v => v.type === type).sort((a, b) => {
      const dateA = `${a.date} ${a.time}`;
      const dateB = `${b.date} ${b.time}`;
      return dateB.localeCompare(dateA);
    });
    return filtered[0] || null;
  };

  // 获取某类型指标的历史数据
  const getVitalHistory = (type) => {
    return vitals.filter(v => v.type === type).sort((a, b) => {
      const dateA = `${a.date} ${a.time}`;
      const dateB = `${b.date} ${b.time}`;
      return dateA.localeCompare(dateB);
    });
  };

  // 保存健康指标
  const saveVitals = () => {
    if (!vitalsInput.value1) return;
    const vitalType = VITAL_TYPES.find(t => t.id === vitalsInput.type);
    if (vitalType?.hasTwo && !vitalsInput.value2) return;
    const newItem = { ...vitalsInput, id: editingId || Date.now().toString() };
    if (editingId) {
      setVitals(vitals.map(v => v.id === editingId ? newItem : v));
    } else {
      setVitals([...vitals, newItem]);
    }
    setShowVitalsForm(false);
    setEditingId(null);
    setVitalsInput({ type: 'blood_pressure', date: getLocalDateStr(new Date()), time: getLocalTimeStr(new Date()), value1: '', value2: '', note: '' });
  };

  // 删除健康指标
  const deleteVital = (id) => {
    if (confirm('确定删除这条记录吗？')) {
      setVitals(vitals.filter(v => v.id !== id));
      setShowVitalsForm(false);
      setEditingId(null);
    }
  };

  // 备份数据
  const handleBackup = () => {
    const allMembersDataForBackup = {};
    members.forEach(member => {
      const memberData = allMembersData[member.id] || {};
      allMembersDataForBackup[member.id] = {
        meds: memberData.meds || [],
        catalog: memberData.catalog || [],
        checkups: memberData.checkups || [],
        labReports: memberData.labReports || [],
        imagingReports: memberData.imagingReports || [],
        medicalRecords: memberData.medicalRecords || [],
        vitals: memberData.vitals || []
      };
    });

    const backupData = {
      version: VERSION,
      exportDate: new Date().toISOString(),
      meds, catalog, checkups, labReports, imagingReports, medicalRecords, vitals,
      members, currentMemberId, membersData: allMembersDataForBackup,
      medicalDictionary, customLabCategories, customImagingModalities, customRecordTypes
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    setBackupDataStr(dataStr);
    setBackupFileName(`HealthManager_${getLocalDateStr(new Date())}.json`);

    let totalMeds = 0, totalLabs = 0;
    Object.values(allMembersDataForBackup).forEach(data => {
      totalMeds += data.meds?.length || 0;
      totalLabs += data.labReports?.length || 0;
    });

    setBackupStats({ size: Math.round(dataStr.length / 1024), meds: totalMeds, labs: totalLabs, members: members.length });
    setShowBackupModal(true);
  };

  // 下载备份文件
  const handleDownloadBackup = () => {
    const blob = new Blob([backupDataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 复制备份数据
  const handleCopyBackup = async () => {
    try {
      await navigator.clipboard.writeText(backupDataStr);
      alert('数据已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制');
    }
  };

  // 恢复备份数据
  const handleRestoreBackup = (data) => {
    try {
      // 恢复成员数据
      if (data.members?.length > 0) {
        setMembers(data.members);
      } else {
        setMembers([{ id: 'default', name: '我', relation: '本人', color: 'indigo' }]);
      }

      // 恢复成员数据 - 优先使用 membersData，兼容旧版格式
      if (data.membersData) {
        setAllMembersData(data.membersData);
      } else {
        // 兼容旧版本单用户格式
        const defaultData = {
          meds: data.meds || [],
          catalog: data.catalog || [],
          checkups: data.checkups || [],
          labReports: data.labReports || [],
          imagingReports: data.imagingReports || [],
          medicalRecords: data.medicalRecords || [],
          vitals: data.vitals || []
        };
        setAllMembersData({ default: defaultData });
      }

      // 恢复当前成员ID
      setCurrentMemberId(data.currentMemberId || 'default');

      // 恢复医学词典
      if (data.medicalDictionary) {
        setMedicalDictionary(data.medicalDictionary);
      }

      // 恢复自定义类别
      if (data.customLabCategories) {
        setCustomLabCategories(data.customLabCategories);
      }
      if (data.customImagingModalities) {
        setCustomImagingModalities(data.customImagingModalities);
      }
      if (data.customRecordTypes) {
        setCustomRecordTypes(data.customRecordTypes);
      }

      setShowBackupModal(false);
      alert('数据恢复成功！');

      // 如果已登录，触发云同步
      if (currentUser && sessionToken) {
        setTimeout(() => saveToCloud(), 1000);
      }
    } catch (err) {
      console.error('恢复数据失败:', err);
      alert('恢复数据失败: ' + err.message);
    }
  };

  // 成员管理函数
  const saveMember = () => {
    if (!memberInput.name.trim()) return;
    if (editingMember) {
      // 更新成员
      setMembers(members.map(m => m.id === editingMember.id ? {
        ...m, name: memberInput.name.trim(), relation: memberInput.relation.trim() || m.relation, color: memberInput.color
      } : m));
    } else {
      // 添加成员
      const newMember = {
        id: Date.now().toString(), name: memberInput.name.trim(),
        relation: memberInput.relation.trim() || '家人', color: memberInput.color
      };
      setMembers([...members, newMember]);
      setAllMembersData(prev => ({
        ...prev, [newMember.id]: { meds: [], catalog: [], checkups: [], labReports: [], imagingReports: [], vitals: [] }
      }));
      setCurrentMemberId(newMember.id);
    }
    setEditingMember(null);
    setMemberInput({ name: '', relation: '', color: 'indigo' });
    setShowMemberForm(false);
    setShowMemberMenu(false);
  };

  const deleteMember = (memberId) => {
    if (members.length <= 1) { alert('至少保留一个成员'); return; }
    if (!confirm('确定删除该成员及其所有数据吗？')) return;
    if (memberId === currentMemberId) {
      const otherMember = members.find(m => m.id !== memberId);
      if (otherMember) setCurrentMemberId(otherMember.id);
    }
    setMembers(members.filter(m => m.id !== memberId));
    setAllMembersData(prev => { const newData = {...prev}; delete newData[memberId]; return newData; });
    setShowMemberForm(false);
    setEditingMember(null);
  };

  // 云同步函数
  const saveToCloud = async (userId = currentUser?.objectId, token = sessionToken, showAlert = false, updateDeviceId = false) => {
    if (!userId || !token || !isOnline) return;

    if (saveToCloudLock.current && !updateDeviceId) return;

    let releaseLock;
    saveToCloudLock.current = new Promise(resolve => { releaseLock = resolve; });

    console.log('🔄 [saveToCloud] 开始同步...');
    setSyncStatus('syncing');

    try {
      const syncData = updateDeviceId ? {
        deviceId, lastActiveTime: new Date().toISOString()
      } : {
        members, currentMemberId, memberData: allMembersData,
        medicalDictionary, customLabCategories, customImagingModalities, customRecordTypes,
        lastUpdated: new Date().toISOString()
      };

      await LeanCloud.saveUserData(userId, token, syncData);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      if (showAlert) alert('✅ 同步成功');
    } catch (e) {
      console.error('❌ 同步失败:', e);
      setSyncStatus('error');
      if (showAlert) alert('❌ 同步失败: ' + e.message);
    } finally {
      releaseLock();
      saveToCloudLock.current = null;
    }
  };

  const applyCloudData = async (cloudData) => {
    if (cloudData.members?.length > 0) {
      setMembers(cloudData.members);
    } else {
      setMembers(DEFAULT_MEMBERS);
    }
    setAllMembersData(cloudData.memberData || {});
    setCurrentMemberId(cloudData.currentMemberId || 'default');
    if (cloudData.medicalDictionary) {
      setMedicalDictionary(cloudData.medicalDictionary);
    }
    if (cloudData.customLabCategories) {
      setCustomLabCategories(cloudData.customLabCategories);
    }
    if (cloudData.customImagingModalities) {
      setCustomImagingModalities(cloudData.customImagingModalities);
    }
    if (cloudData.customRecordTypes) {
      setCustomRecordTypes(cloudData.customRecordTypes);
    }
    setDataLoaded(true);
    setSyncStatus('synced');
    setLastSyncTime(new Date());
  };

  const loadFromCloud = async (userId, token) => {
    if (!isOnline) throw new Error('网络未连接');
    setSyncStatus('syncing');
    try {
      const cloudData = await LeanCloud.loadUserData(userId, token);
      if (cloudData) {
        await applyCloudData(cloudData);
      } else {
        await applyCloudData({
          members: DEFAULT_MEMBERS,
          currentMemberId: 'default',
          memberData: {},
          medicalDictionary: DEFAULT_MEDICAL_DICTIONARY
        });
        await saveToCloud(userId, token);
      }
      setLoginLoading(false);
    } catch (e) {
      setSyncStatus('error');
      setLoginLoading(false);
      throw e;
    }
  };

  const performLogout = () => {
    localStorage.removeItem('health_pro_user');
    localStorage.removeItem('health_pro_session');
    setCurrentUser(null);
    setSessionToken(null);
    setMembers([]);
    setAllMembersData({});
    setCurrentMemberId('default');
    setDataLoaded(false);
    setSyncStatus('');
  };

  // 登录处理
  const handleLogin = async () => {
    if (!navigator.onLine) { setLoginError('网络未连接'); return; }
    if (!loginForm.username.trim() || !loginForm.password) { setLoginError('请输入用户名和密码'); return; }
    setLoginLoading(true);
    setLoginError('');
    try {
      const user = await LeanCloud.login(loginForm.username.trim(), loginForm.password);
      setIsLoadingUserData(true);
      setDataLoaded(true);
      setShowLoginModal(false);
      setCurrentUser(user);
      setSessionToken(user.sessionToken);
      localStorage.setItem('health_pro_user', JSON.stringify(user));
      localStorage.setItem('health_pro_session', user.sessionToken);
      await loadFromCloud(user.objectId, user.sessionToken);
      await saveToCloud(user.objectId, user.sessionToken, false, true);
      setIsLoadingUserData(false);
      setLoginForm({ username: '', password: '', confirmPassword: '' });
    } catch (e) {
      localStorage.removeItem('health_pro_user');
      localStorage.removeItem('health_pro_session');
      setCurrentUser(null);
      setSessionToken(null);
      setDataLoaded(false);
      setLoginError(e.message || '登录失败');
      setLoginLoading(false);
      setIsLoadingUserData(false);
      setShowLoginModal(true);
    }
  };

  const handleSignUp = async () => {
    if (!navigator.onLine) { setLoginError('网络未连接'); return; }
    if (!loginForm.username.trim() || !loginForm.password) { setLoginError('请输入用户名和密码'); return; }
    if (loginForm.password.length < 6) { setLoginError('密码至少6位'); return; }
    if (loginForm.password !== loginForm.confirmPassword) { setLoginError('两次密码不一致'); return; }
    setLoginLoading(true);
    setLoginError('');
    try {
      const user = await LeanCloud.signUp(loginForm.username.trim(), loginForm.password);
      setIsRegistering(true);
      setIsLoadingUserData(true);
      setDataLoaded(true);
      setShowLoginModal(false);
      setCurrentUser(user);
      setSessionToken(user.sessionToken);
      localStorage.setItem('health_pro_user', JSON.stringify(user));
      localStorage.setItem('health_pro_session', user.sessionToken);

      await LeanCloud.saveUserData(user.objectId, user.sessionToken, {
        members: DEFAULT_MEMBERS, currentMemberId: 'default',
        memberData: { 'default': { meds: [], catalog: [], checkups: [], labReports: [], imagingReports: [], vitals: [] } },
        medicalDictionary: DEFAULT_MEDICAL_DICTIONARY, deviceId, lastUpdated: new Date().toISOString()
      });
      await loadFromCloud(user.objectId, user.sessionToken);
      setIsLoadingUserData(false);
      setIsRegistering(false);
      setLoginForm({ username: '', password: '', confirmPassword: '' });
    } catch (e) {
      setLoginError(e.message || '注册失败');
      setLoginLoading(false);
      setIsLoadingUserData(false);
      setIsRegistering(false);
      setDataLoaded(false);
    }
  };

  // 启动时版本检查
  useEffect(() => {
    if (!navigator.onLine) { setOfflineError(true); setIsVersionChecked(true); return; }

    const savedVersion = localStorage.getItem('health_pro_app_version');
    if (savedVersion && savedVersion !== VERSION) {
      const cmp = compareVersions(VERSION, savedVersion);
      if (cmp > 0) {
        localStorage.setItem('health_pro_app_version', VERSION);
        localStorage.removeItem('health_pro_user');
        localStorage.removeItem('health_pro_session');
        setMustRelogin(true);
      }
    } else {
      localStorage.setItem('health_pro_app_version', VERSION);
    }

    const savedUser = localStorage.getItem('health_pro_user');
    const savedToken = localStorage.getItem('health_pro_session');
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setSessionToken(savedToken);
      } catch (e) {
        localStorage.removeItem('health_pro_user');
        localStorage.removeItem('health_pro_session');
      }
    }
    setIsVersionChecked(true);
  }, []);

  // 自动同步
  useEffect(() => {
    if (!currentUser || !sessionToken || !isOnline || !dataLoaded) return;
    const timer = setTimeout(() => saveToCloud(), 3000);
    return () => clearTimeout(timer);
  }, [allMembersData, members, medicalDictionary, customLabCategories, customImagingModalities, currentUser, sessionToken, isOnline, dataLoaded]);

  // 登录后加载数据
  useEffect(() => {
    if (currentUser && sessionToken && !dataLoaded && !isLoadingUserData && isVersionChecked) {
      setIsLoadingUserData(true);
      loadFromCloud(currentUser.objectId, sessionToken)
        .then(() => setIsLoadingUserData(false))
        .catch(() => {
          setIsLoadingUserData(false);
          performLogout();
        });
    }
  }, [currentUser, sessionToken, dataLoaded, isVersionChecked]);

  // 离线错误界面
  if (offlineError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <Icons.CloudOff size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">网络未连接</h2>
          <p className="text-gray-600 mb-6">本应用需要网络连接才能使用</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 版本升级重新登录
  if (mustRelogin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <Icons.RefreshCw size={64} className="mx-auto text-indigo-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">版本已更新</h2>
          <p className="text-gray-600 mb-6">请重新登录以确保数据同步</p>
          <button onClick={() => { setMustRelogin(false); setShowLoginModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
            重新登录
          </button>
        </div>
      </div>
    );
  }

  // 加载中
  if (!isVersionChecked || isLoadingUserData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Icons.Loader size={48} className="mx-auto text-indigo-500 animate-spin mb-4" />
          <p className="text-white">{isLoadingUserData ? '加载数据中...' : '初始化中...'}</p>
        </div>
      </div>
    );
  }

  // 未登录 - 显示登录界面
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💊</div>
            <h1 className="text-2xl font-bold text-white mb-2">健康管家 Pro</h1>
            <p className="text-indigo-200">{VERSION}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="flex mb-6">
              <button onClick={() => setIsLoginMode(true)} className={`flex-1 py-2 text-center font-bold rounded-l-xl ${isLoginMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                登录
              </button>
              <button onClick={() => setIsLoginMode(false)} className={`flex-1 py-2 text-center font-bold rounded-r-xl ${!isLoginMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                注册
              </button>
            </div>

            {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{loginError}</div>}

            <div className="space-y-4">
              <input type="text" placeholder="用户名" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="password" placeholder="密码" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              {!isLoginMode && (
                <input type="password" placeholder="确认密码" value={loginForm.confirmPassword} onChange={e => setLoginForm({ ...loginForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              )}
              <button onClick={isLoginMode ? handleLogin : handleSignUp} disabled={loginLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loginLoading ? <><Icons.Loader size={20} className="animate-spin" /> 处理中...</> : (isLoginMode ? '登录' : '注册')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col w-full max-w-lg mx-auto relative overflow-hidden" style={{ height: '100dvh' }}>
      {/* 顶部导航栏 */}
      <div className={`${currentMemberColor.bg} text-white px-4 py-3 flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMemberMenu(!showMemberMenu)} className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
            <span className="font-bold">{currentMember?.name || '我'}</span>
            <Icons.ChevronDown size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">{VERSION}</span>
          {syncStatus === 'synced' && <Icons.Cloud size={16} className="text-green-300" />}
          {syncStatus === 'syncing' && <Icons.Loader size={16} className="animate-spin" />}
          {syncStatus === 'error' && <Icons.CloudOff size={16} className="text-red-300" />}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 健康指标 Tab */}
        {activeTab === 'vitals' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">健康指标</h2>
              {selectedVitalType && (
                <button onClick={() => setSelectedVitalType(null)} className="text-sm text-indigo-600 flex items-center gap-1">
                  <Icons.ChevronLeft size={16}/> 返回
                </button>
              )}
            </div>

            {/* 指标概览 */}
            {!selectedVitalType && (
              <div className="grid grid-cols-2 gap-3">
                {VITAL_TYPES.map(type => {
                  const latest = getLatestVital(type.id);
                  const history = getVitalHistory(type.id);
                  return (
                    <div key={type.id} onClick={() => setSelectedVitalType(type.id)}
                      className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                          {Icons[type.icon] && Icons[type.icon]({ size: 18, style: { color: type.color } })}
                        </div>
                        <span className="font-bold text-gray-700">{type.name}</span>
                      </div>
                      {latest ? (
                        <>
                          <div className="text-2xl font-bold" style={{ color: type.color }}>
                            {type.hasTwo ? `${latest.value1}/${latest.value2}` : latest.value1}
                            <span className="text-sm font-normal text-gray-400 ml-1">{type.unit}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{latest.date} {latest.time}</div>
                          {/* 迷你趋势图 */}
                          {history.length > 1 && (
                            <div className="mt-2">
                              <VitalMiniChart data={history} type={type} />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm py-2">点击添加首条记录</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 某个指标的详细视图 */}
            {selectedVitalType && (
              <div>
                {(() => {
                  const type = VITAL_TYPES.find(t => t.id === selectedVitalType);
                  const history = getVitalHistory(selectedVitalType);
                  return (
                    <>
                      {/* 标题卡片 */}
                      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                            {Icons[type.icon] && Icons[type.icon]({ size: 24, style: { color: type.color } })}
                          </div>
                          <div>
                            <div className="font-bold text-lg text-gray-800">{type.name}</div>
                            <div className="text-sm text-gray-500">参考: {type.normalRange} {type.unit}</div>
                          </div>
                        </div>
                      </div>

                      {/* 趋势图 */}
                      {history.length > 1 && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-3">趋势图</div>
                          <VitalTrendChart data={history} type={type} />
                        </div>
                      )}

                      {/* 历史记录列表 */}
                      <div className="space-y-2">
                        {history.slice().reverse().map(record => (
                          <div key={record.id} onClick={() => {
                            setEditingId(record.id);
                            setVitalsInput({ ...record });
                            setShowVitalsForm(true);
                          }} className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xl font-bold" style={{ color: type.color }}>
                                  {type.hasTwo ? `${record.value1}/${record.value2}` : record.value1}
                                  <span className="text-sm font-normal text-gray-400 ml-1">{type.unit}</span>
                                </div>
                                {record.note && <div className="text-xs text-gray-500 mt-1">{record.note}</div>}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">{record.date}</div>
                                <div className="text-xs text-gray-400">{record.time}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {history.length === 0 && (
                          <div className="text-center text-gray-400 py-8">
                            <Icons.Activity size={48} className="mx-auto mb-2 opacity-20" />
                            <p>暂无记录，点击右下角添加</p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* 底部占位 */}
            <div className="h-20"></div>
          </div>
        )}

        {/* 用药管理 Tab */}
        {activeTab === 'meds' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {medSubTab === 'plan' ? '用药计划' : '药品目录'}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setMedSubTab('plan')} className={`px-3 py-1 rounded-full text-sm ${medSubTab === 'plan' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>计划</button>
                <button onClick={() => setMedSubTab('catalog')} className={`px-3 py-1 rounded-full text-sm ${medSubTab === 'catalog' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>目录</button>
              </div>
            </div>

            {medSubTab === 'plan' && (
              <>
                {activeMeds.map(m => {
                  // 计算进度信息
                  const now = new Date();
                  const startDate = new Date(m.startTime);
                  const daysSinceStart = Math.floor((now - startDate) / 86400000);

                  let progressInfo = null;

                  // 循环用药进度
                  if (m.cycleEnabled && m.cycleDays && m.cycleRestDays) {
                    const cycleDays = parseInt(m.cycleDays);
                    const restDays = parseInt(m.cycleRestDays);
                    const totalCycleDays = cycleDays + restDays;
                    const currentCycleDay = daysSinceStart % totalCycleDays;
                    const cycleNumber = Math.floor(daysSinceStart / totalCycleDays) + 1;
                    const isInMedicationPhase = currentCycleDay < cycleDays;

                    if (isInMedicationPhase) {
                      progressInfo = {
                        type: 'cycle-med',
                        progress: ((currentCycleDay + 1) / cycleDays) * 100,
                        label: `第${cycleNumber}周期 服药第${currentCycleDay + 1}/${cycleDays}天`,
                        color: 'bg-green-500'
                      };
                    } else {
                      const restDay = currentCycleDay - cycleDays + 1;
                      progressInfo = {
                        type: 'cycle-rest',
                        progress: (restDay / restDays) * 100,
                        label: `第${cycleNumber}周期 停药第${restDay}/${restDays}天`,
                        color: 'bg-amber-500'
                      };
                    }
                  }
                  // 短期用药进度（有结束日期）
                  else if (m.endTime) {
                    const endDate = new Date(m.endTime);
                    const totalDays = Math.ceil((endDate - startDate) / 86400000);
                    const elapsedDays = Math.min(daysSinceStart, totalDays);
                    const remainingDays = Math.max(0, Math.ceil((endDate - now) / 86400000));

                    progressInfo = {
                      type: 'short-term',
                      progress: Math.min(100, (elapsedDays / totalDays) * 100),
                      label: `已服${elapsedDays}天 / 共${totalDays}天`,
                      color: 'bg-indigo-500'
                    };
                  }

                  return (
                    <div key={m.id} onClick={() => { setMedInput({...m}); setEditingId(m.id); setShowMedForm(true); }} className="bg-white p-4 rounded-xl shadow-sm border mb-3 cursor-pointer hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-lg mb-1">{m.name}</div>
                          <div className="text-sm text-gray-500">{m.startTime} 开始 | {m.relation}</div>
                          {/* 显示服用方法 */}
                          <div className="text-xs text-indigo-600 mt-1">
                            {getMedicationMethodString(m)}
                          </div>
                          {/* 显示循环用药标签 */}
                          {m.cycleEnabled && m.cycleDays && m.cycleRestDays && (
                            <div className="flex items-center gap-1 mt-2">
                              <Icons.Repeat size={12} className="text-green-600" />
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                循环: 服{m.cycleDays}天停{m.cycleRestDays}天
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${m.endTime ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {m.endTime ? <Icons.Clock size={12}/> : <Icons.Infinity size={12}/>}
                            {m.endTime ? `剩${Math.max(0, Math.ceil((new Date(m.endTime)-new Date())/86400000))}天` : '长期'}
                          </span>
                        </div>
                      </div>
                      {/* 进度条 */}
                      {progressInfo && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">{progressInfo.label}</span>
                            <span className="text-xs font-medium text-gray-600">{Math.round(progressInfo.progress)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressInfo.color} rounded-full transition-all duration-300`}
                              style={{ width: `${progressInfo.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {endedMeds.length > 0 && (
                  <div className="mt-6">
                    <div onClick={() => setIsEndedExpanded(!isEndedExpanded)} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-3 cursor-pointer">
                      {isEndedExpanded ? <Icons.ChevronDown size={14}/> : <Icons.ChevronRight size={14}/>} 已结束 ({endedMeds.length})
                    </div>
                    {isEndedExpanded && endedMeds.map(m => (
                      <div
                        key={m.id}
                        onClick={() => { setMedInput({...m}); setEditingId(m.id); setShowMedForm(true); }}
                        className="bg-gray-50 p-3 rounded-xl border mb-2 opacity-70 cursor-pointer hover:opacity-100 hover:shadow-sm transition-all"
                      >
                        <div className="font-medium text-gray-700">{m.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{m.startTime} - {m.endTime}</div>
                      </div>
                    ))}
                  </div>
                )}
                {meds.length === 0 && (
                  <div className="text-center text-gray-400 mt-16">
                    <Icons.Clock size={48} className="mx-auto mb-2 opacity-20" />
                    <p>暂无服药计划</p>
                  </div>
                )}
              </>
            )}

            {medSubTab === 'catalog' && (
              <div className="grid grid-cols-2 gap-3">
                {catalog.map(i => (
                  <div
                    key={i.id}
                    onClick={() => { setCatalogInput({...i}); setEditingId(i.id); setShowCatalogForm(true); }}
                    className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="font-bold text-base mb-1">{i.name}</div>
                    {i.brand && <div className="text-xs text-indigo-600 mb-1">{i.brand}</div>}
                    <div className="text-sm text-gray-500">{i.dosageForm} {i.strength}{i.unit}</div>
                  </div>
                ))}
                {catalog.length === 0 && (
                  <div className="col-span-2 text-center text-gray-400 mt-16">
                    <Icons.Library size={48} className="mx-auto mb-2 opacity-20" />
                    <p>暂无药品</p>
                  </div>
                )}
              </div>
            )}

            {/* 底部占位 */}
            <div className="h-20"></div>
          </div>
        )}

        {/* 检查报告 Tab */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {examSubTab === 'appointment' ? '检查预约' : '检查报告'}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setExamSubTab('appointment')} className={`px-3 py-1 rounded-full text-sm ${examSubTab === 'appointment' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>预约</button>
                <button onClick={() => setExamSubTab('report')} className={`px-3 py-1 rounded-full text-sm ${examSubTab === 'report' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>报告</button>
              </div>
            </div>

            {/* 检查预约 */}
            {examSubTab === 'appointment' && (
              <div className="space-y-4">
                {/* 即将到来的预约 */}
                {(() => {
                  const today = getLocalDateStr(new Date());
                  const upcomingCheckups = checkups
                    .filter(c => !c.completed && c.date >= today)
                    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
                  const pastCheckups = checkups
                    .filter(c => !c.completed && c.date < today)
                    .sort((a, b) => b.date.localeCompare(a.date));
                  const completedCheckups = checkups
                    .filter(c => c.completed)
                    .sort((a, b) => (b.completedAt || b.date).localeCompare(a.completedAt || a.date));

                  return (
                    <>
                      {/* 即将到来 */}
                      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 flex justify-between items-center">
                          <h3 className="font-bold text-white flex items-center gap-2">
                            <Icons.CalendarClock size={18} />
                            即将到来 ({upcomingCheckups.length})
                          </h3>
                          <button
                            onClick={() => { setEditingCheckup(null); setShowCheckupModal(true); }}
                            className="text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                          >
                            <Icons.Plus size={16} /> 新建预约
                          </button>
                        </div>
                        <div className="divide-y">
                          {upcomingCheckups.map(checkup => {
                            const typeInfo = CHECKUP_TYPES.find(t => t.id === checkup.type) || CHECKUP_TYPES[0];
                            const IconComponent = Icons[typeInfo.icon];
                            const daysUntil = Math.ceil((new Date(checkup.date) - new Date(today)) / (1000 * 60 * 60 * 24));
                            const isToday = checkup.date === today;
                            const isTomorrow = daysUntil === 1;

                            return (
                              <div key={checkup.id} className="px-4 py-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: typeInfo.color + '20' }}>
                                      {IconComponent && <IconComponent size={20} style={{ color: typeInfo.color }} />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-bold text-gray-800">{checkup.name}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {checkup.hospital && <span>{checkup.hospital}</span>}
                                        {checkup.department && <span> · {checkup.department}</span>}
                                        {checkup.doctor && <span> · {checkup.doctor}</span>}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{typeInfo.name}</span>
                                        {checkup.notes && (
                                          <span className="text-xs text-gray-400 truncate max-w-[150px]">{checkup.notes}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-1">
                                    <div className={`text-sm font-bold ${isToday ? 'text-red-600' : isTomorrow ? 'text-orange-500' : 'text-indigo-600'}`}>
                                      {isToday ? '今天' : isTomorrow ? '明天' : `${daysUntil}天后`}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {checkup.date} {checkup.time && checkup.time}
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={() => completeCheckup(checkup.id)}
                                        className="text-green-600 hover:bg-green-50 p-1 rounded"
                                        title="标记完成"
                                      >
                                        <Icons.Check size={16} />
                                      </button>
                                      <button
                                        onClick={() => { setEditingCheckup(checkup); setShowCheckupModal(true); }}
                                        className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                                        title="编辑"
                                      >
                                        <Icons.Edit size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {upcomingCheckups.length === 0 && (
                            <div className="text-center text-gray-400 py-8">
                              <Icons.CalendarPlus size={32} className="mx-auto mb-2 opacity-20" />
                              <p className="text-sm">暂无预约</p>
                              <button
                                onClick={() => { setEditingCheckup(null); setShowCheckupModal(true); }}
                                className="mt-2 text-indigo-600 text-sm"
                              >
                                点击新建预约
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 已过期未完成 */}
                      {pastCheckups.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                          <div className="px-4 py-3 bg-orange-50 flex justify-between items-center border-b">
                            <h3 className="font-bold text-orange-700 flex items-center gap-2">
                              <Icons.AlertTriangle size={18} />
                              已过期 ({pastCheckups.length})
                            </h3>
                          </div>
                          <div className="divide-y">
                            {pastCheckups.map(checkup => {
                              const typeInfo = CHECKUP_TYPES.find(t => t.id === checkup.type) || CHECKUP_TYPES[0];
                              const IconComponent = Icons[typeInfo.icon];
                              return (
                                <div key={checkup.id} className="px-4 py-3 bg-orange-50/30">
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-3 items-center">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-100">
                                        {IconComponent && <IconComponent size={16} className="text-orange-600" />}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-700">{checkup.name}</div>
                                        <div className="text-xs text-gray-500">{checkup.date} {checkup.time}</div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => completeCheckup(checkup.id)}
                                        className="text-green-600 hover:bg-green-50 p-1.5 rounded text-xs flex items-center gap-1"
                                      >
                                        <Icons.Check size={14} /> 完成
                                      </button>
                                      <button
                                        onClick={() => { setEditingCheckup(checkup); setShowCheckupModal(true); }}
                                        className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded"
                                      >
                                        <Icons.Edit size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 已完成 */}
                      {completedCheckups.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 flex justify-between items-center border-b">
                            <h3 className="font-bold text-gray-600 flex items-center gap-2">
                              <Icons.CheckCircle size={18} className="text-green-500" />
                              已完成 ({completedCheckups.length})
                            </h3>
                          </div>
                          <div className="divide-y">
                            {completedCheckups.slice(0, 5).map(checkup => {
                              const typeInfo = CHECKUP_TYPES.find(t => t.id === checkup.type) || CHECKUP_TYPES[0];
                              return (
                                <div key={checkup.id} className="px-4 py-2 flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <Icons.Check size={14} className="text-green-500" />
                                    <span className="text-gray-600">{checkup.name}</span>
                                    <span className="text-xs text-gray-400">{typeInfo.name}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">{checkup.date}</span>
                                </div>
                              );
                            })}
                            {completedCheckups.length > 5 && (
                              <div className="px-4 py-2 text-center text-xs text-gray-400">
                                还有 {completedCheckups.length - 5} 条已完成记录
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* 检查报告 */}
            {examSubTab === 'report' && (
              <div className="space-y-4">
            {/* 顶部AI扫描按钮 */}
            <div className="flex justify-end relative">
              <button
                onClick={() => setShowScanTypeMenu(!showScanTypeMenu)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Icons.ScanLine size={18} />
                AI扫描
                <Icons.ChevronDown size={16} className={`transition-transform ${showScanTypeMenu ? 'rotate-180' : ''}`} />
              </button>
              {showScanTypeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowScanTypeMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border z-50 overflow-hidden min-w-[160px]">
                    <button
                      onClick={() => {
                        setScanType('lab');
                        setScanEditData(null);
                        setEditingId(null);
                        setShowScanModal(true);
                        setShowScanTypeMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors text-left"
                    >
                      <Icons.FileSpreadsheet size={20} className="text-indigo-600" />
                      <span className="font-medium text-gray-700">检验报告</span>
                    </button>
                    <button
                      onClick={() => {
                        setScanType('imaging');
                        setScanEditData(null);
                        setEditingId(null);
                        setShowScanModal(true);
                        setShowScanTypeMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-t"
                    >
                      <Icons.FileImage size={20} className="text-blue-600" />
                      <span className="font-medium text-gray-700">影像报告</span>
                    </button>
                    <button
                      onClick={() => {
                        setMedicalRecordEditData(null);
                        setMedicalRecordEditingId(null);
                        setShowMedicalRecordModal(true);
                        setShowScanTypeMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left border-t"
                    >
                      <Icons.ClipboardList size={20} className="text-emerald-600" />
                      <span className="font-medium text-gray-700">病历文书</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 检验报告 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div
                className="px-4 py-3 bg-gray-50 flex justify-between items-center border-b cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setLabSectionCollapsed(!labSectionCollapsed)}
              >
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <Icons.FileSpreadsheet size={18} className="text-indigo-600"/>
                  检验报告 ({labReports.length})
                  <span className="text-gray-400">
                    {labSectionCollapsed ? <Icons.ChevronDown size={16}/> : <Icons.ChevronUp size={16}/>}
                  </span>
                </h3>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {/* 批量删除按钮 */}
                  {selectedLabReports.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(`确定要删除选中的 ${selectedLabReports.length} 份检验报告吗？`)) {
                          setLabReports(labReports.filter(r => !selectedLabReports.includes(r.id)));
                          setSelectedLabReports([]);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                    >
                      <Icons.Trash2 size={14} />
                      删除({selectedLabReports.length})
                    </button>
                  )}
                  {/* 趋势分析按钮 */}
                  <button
                    onClick={() => setShowTrendModal(true)}
                    className={`relative p-1.5 rounded-lg flex items-center gap-1 ${selectedTrendItems.length > 0 ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Icons.TrendingUp size={18}/>
                    {selectedTrendItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {selectedTrendItems.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              {!labSectionCollapsed && <div className="divide-y">
                {[...labReports].sort((a, b) => b.date.localeCompare(a.date)).map(report => {
                  const isExpanded = expandedReports[report.id];
                  const abnormalCount = (report.items || []).filter(i => i.flag !== 'Normal').length;
                  const isReportSelected = selectedLabReports.includes(report.id);
                  return (
                    <div key={report.id}>
                      <div onClick={() => setExpandedReports(p => ({...p, [report.id]: !p[report.id]}))} className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                        <div className="flex items-center gap-3 flex-1">
                          {/* 多选复选框 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isReportSelected) {
                                setSelectedLabReports(selectedLabReports.filter(id => id !== report.id));
                              } else {
                                setSelectedLabReports([...selectedLabReports, report.id]);
                              }
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isReportSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 hover:border-red-400'}`}
                          >
                            {isReportSelected && <Icons.Check size={12} />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-sm">{report.date}</span>
                              {report.category && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{report.category}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{report.hospital || '未知医院'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {abnormalCount > 0 ? (
                            <div className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded flex items-center gap-1">
                              <Icons.AlertTriangle size={12}/>{abnormalCount}项异常
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                              <Icons.Check size={12}/>正常
                            </div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setScanType('lab'); setScanEditData(report); setEditingId(report.id); setShowScanModal(true); }} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg">
                            <Icons.Edit size={14}/>
                          </button>
                          <div className="text-gray-400">
                            {isExpanded ? <Icons.ChevronUp size={16}/> : <Icons.ChevronDown size={16}/>}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-3 border-t bg-slate-50">
                          {/* 原始报告图片 */}
                          {report.images && report.images.length > 0 && (
                            <div className="py-2 border-b">
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {report.images.map((img, imgIdx) => (
                                  <img
                                    key={imgIdx}
                                    src={img}
                                    alt={`报告图片 ${imgIdx + 1}`}
                                    className="h-12 w-auto rounded border cursor-pointer hover:opacity-80"
                                    onClick={(e) => { e.stopPropagation(); setScanType('lab'); setScanEditData(report); setEditingId(report.id); setShowScanModal(true); }}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">点击图片查看原始报告</div>
                            </div>
                          )}
                          {(report.items || []).map((item, idx) => {
                            const flagColor = item.flag === 'High' ? 'text-rose-600' : item.flag === 'Low' ? 'text-orange-500' : 'text-gray-700';
                            // 使用名称+单位(小写)作为唯一标识，确保同名不同单位的指标分开选择，忽略大小写
                            const itemKey = `${item.name}||${(item.unit || '').toLowerCase()}`;
                            const isSelected = selectedTrendItems.includes(itemKey);
                            return (
                              <div key={idx} className="flex justify-between items-center py-2 text-sm border-b last:border-0">
                                <div className="flex items-center gap-2">
                                  {/* 趋势选择复选框 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        setSelectedTrendItems(selectedTrendItems.filter(i => i !== itemKey));
                                      } else {
                                        setSelectedTrendItems([...selectedTrendItems, itemKey]);
                                      }
                                    }}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 hover:border-teal-400'}`}
                                  >
                                    {isSelected && <Icons.Check size={12} />}
                                  </button>
                                  <span className={`font-medium ${item.flag !== 'Normal' ? flagColor : ''}`}>{item.name}</span>
                                  <span className="text-xs text-gray-400">{item.refRange} {item.unit}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`font-bold ${flagColor}`}>{item.result}</span>
                                  {item.flag === 'High' && <span className="text-rose-600 text-xs font-bold">↑</span>}
                                  {item.flag === 'Low' && <span className="text-orange-500 text-xs font-bold">↓</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {labReports.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Icons.FileSpreadsheet size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">暂无检验报告</p>
                    <p className="text-xs mt-1">点击右上角AI扫描添加</p>
                  </div>
                )}
              </div>}
            </div>

            {/* 影像报告 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div
                className="px-4 py-3 bg-gray-50 flex justify-between items-center border-b cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setImagingSectionCollapsed(!imagingSectionCollapsed)}
              >
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <Icons.FileImage size={18} className="text-blue-600"/>
                  影像报告 ({imagingReports.length})
                  <span className="text-gray-400">
                    {imagingSectionCollapsed ? <Icons.ChevronDown size={16}/> : <Icons.ChevronUp size={16}/>}
                  </span>
                </h3>
                {/* 批量删除按钮 */}
                {selectedImagingReports.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除选中的 ${selectedImagingReports.length} 份影像报告吗？`)) {
                        setImagingReports(imagingReports.filter(r => !selectedImagingReports.includes(r.id)));
                        setSelectedImagingReports([]);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                  >
                    <Icons.Trash2 size={14} />
                    删除({selectedImagingReports.length})
                  </button>
                )}
              </div>
              {!imagingSectionCollapsed && <div className="divide-y">
                {[...imagingReports].sort((a, b) => b.date.localeCompare(a.date)).map(report => {
                  const isExpanded = expandedImaging[report.id];
                  const isReportSelected = selectedImagingReports.includes(report.id);
                  return (
                    <div key={report.id}>
                      <div onClick={() => setExpandedImaging(p => ({...p, [report.id]: !p[report.id]}))} className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                        <div className="flex items-center gap-3 flex-1">
                          {/* 多选复选框 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isReportSelected) {
                                setSelectedImagingReports(selectedImagingReports.filter(id => id !== report.id));
                              } else {
                                setSelectedImagingReports([...selectedImagingReports, report.id]);
                              }
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isReportSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 hover:border-red-400'}`}
                          >
                            {isReportSelected && <Icons.Check size={12} />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{report.modality}</span>
                              <span className="font-bold text-sm">{report.region}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{report.date} • {report.hospital || '未知医院'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setScanType('imaging'); setScanEditData(report); setEditingId(report.id); setShowScanModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg">
                            <Icons.Edit size={14}/>
                          </button>
                          <div className="text-gray-400">
                            {isExpanded ? <Icons.ChevronUp size={16}/> : <Icons.ChevronDown size={16}/>}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-3 border-t bg-slate-50 text-sm">
                          {/* 原始报告图片 */}
                          {report.images && report.images.length > 0 && (
                            <div className="py-2 border-b mb-2">
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {report.images.map((img, imgIdx) => (
                                  <img
                                    key={imgIdx}
                                    src={img}
                                    alt={`报告图片 ${imgIdx + 1}`}
                                    className="h-12 w-auto rounded border cursor-pointer hover:opacity-80"
                                    onClick={(e) => { e.stopPropagation(); setScanType('imaging'); setScanEditData(report); setEditingId(report.id); setShowScanModal(true); }}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">点击图片查看原始报告</div>
                            </div>
                          )}
                          {report.findings && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">影像所见:</div>
                              <div className="text-gray-700">{report.findings}</div>
                            </div>
                          )}
                          {report.impression && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">诊断印象:</div>
                              <div className="text-gray-700 font-medium">{report.impression}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {imagingReports.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Icons.FileImage size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">暂无影像报告</p>
                    <p className="text-xs mt-1">点击右上角AI扫描添加</p>
                  </div>
                )}
              </div>}
            </div>

            {/* 病历文书 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div
                className="px-4 py-3 bg-gray-50 flex justify-between items-center border-b cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setMedicalRecordSectionCollapsed(!medicalRecordSectionCollapsed)}
              >
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <Icons.FileText size={18} className="text-emerald-600"/>
                  病历文书 ({medicalRecords.length})
                  <span className="text-gray-400">
                    {medicalRecordSectionCollapsed ? <Icons.ChevronDown size={16}/> : <Icons.ChevronUp size={16}/>}
                  </span>
                </h3>
                {/* 批量删除按钮 */}
                {selectedMedicalRecords.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除选中的 ${selectedMedicalRecords.length} 份病历文书吗？`)) {
                        setMedicalRecords(medicalRecords.filter(r => !selectedMedicalRecords.includes(r.id)));
                        setSelectedMedicalRecords([]);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                  >
                    <Icons.Trash2 size={14} />
                    删除({selectedMedicalRecords.length})
                  </button>
                )}
              </div>
              {!medicalRecordSectionCollapsed && <div className="divide-y">
                {[...medicalRecords].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(record => {
                  const isExpanded = expandedMedicalRecord[record.id];
                  const isRecordSelected = selectedMedicalRecords.includes(record.id);
                  return (
                    <div key={record.id}>
                      <div onClick={() => setExpandedMedicalRecord(p => ({...p, [record.id]: !p[record.id]}))} className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                        <div className="flex items-center gap-3 flex-1">
                          {/* 多选复选框 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isRecordSelected) {
                                setSelectedMedicalRecords(selectedMedicalRecords.filter(id => id !== record.id));
                              } else {
                                setSelectedMedicalRecords([...selectedMedicalRecords, record.id]);
                              }
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isRecordSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 hover:border-red-400'}`}
                          >
                            {isRecordSelected && <Icons.Check size={12} />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{record.recordType || '病历'}</span>
                              <span className="font-bold text-sm">{record.hospital || '未知医院'}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{record.date || '日期未知'} {record.department && `• ${record.department}`}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setMedicalRecordEditData(record); setMedicalRecordEditingId(record.id); setShowMedicalRecordModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg">
                            <Icons.Edit size={14}/>
                          </button>
                          <div className="text-gray-400">
                            {isExpanded ? <Icons.ChevronUp size={16}/> : <Icons.ChevronDown size={16}/>}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-3 border-t bg-slate-50 text-sm space-y-2">
                          {/* 原始文书图片 */}
                          {record.images && record.images.length > 0 && (
                            <div className="py-2 border-b">
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {record.images.map((img, imgIdx) => (
                                  <img
                                    key={imgIdx}
                                    src={img}
                                    alt={`文书图片 ${imgIdx + 1}`}
                                    className="h-12 w-auto rounded border cursor-pointer hover:opacity-80"
                                    onClick={(e) => { e.stopPropagation(); setMedicalRecordEditData(record); setMedicalRecordEditingId(record.id); setShowMedicalRecordModal(true); }}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">点击图片查看原始文书</div>
                            </div>
                          )}
                          {record.diagnosis && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">诊断:</div>
                              <div className="text-gray-700 font-medium">{record.diagnosis}</div>
                            </div>
                          )}
                          {record.treatmentSummary && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">治疗经过:</div>
                              <div className="text-gray-700">{record.treatmentSummary}</div>
                            </div>
                          )}
                          {record.dischargeMeds && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">出院用药:</div>
                              <div className="text-gray-700">{record.dischargeMeds}</div>
                            </div>
                          )}
                          {record.followupAdvice && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">随访建议:</div>
                              <div className="text-gray-700">{record.followupAdvice}</div>
                            </div>
                          )}
                          {record.notes && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">其他信息:</div>
                              <div className="text-gray-700">{record.notes}</div>
                            </div>
                          )}
                          {(record.admissionDate || record.dischargeDate) && (
                            <div className="text-xs text-gray-400 pt-1 border-t">
                              {record.admissionDate && <span>入院: {record.admissionDate}</span>}
                              {record.admissionDate && record.dischargeDate && <span className="mx-2">→</span>}
                              {record.dischargeDate && <span>出院: {record.dischargeDate}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {medicalRecords.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Icons.FileText size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">暂无病历文书</p>
                    <p className="text-xs mt-1">点击右上角AI扫描添加</p>
                  </div>
                )}
              </div>}
            </div>

            {/* 底部占位 */}
            <div className="h-4"></div>
              </div>
            )}
          </div>
        )}

        {/* 设置 Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* 用户信息卡片 */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${currentMemberColor.bg} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {currentMember?.name?.[0] || '我'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base">{currentUser?.username}</div>
                  <div className="text-xs text-gray-500">
                    {syncStatus === 'synced' && lastSyncTime && <span className="text-green-600">● 已同步</span>}
                    {syncStatus === 'syncing' && <span className="text-indigo-600">● 同步中...</span>}
                    {syncStatus === 'error' && <span className="text-red-600">● 同步失败</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{VERSION}</div>
              </div>
            </div>

            {/* 成员管理 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">成员管理</div>
              <button onClick={() => setShowMemberMenu(true)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icons.Users size={18} className="text-gray-600"/>
                  <span>管理家庭成员</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{members.length} 人</span>
                  <Icons.ChevronRight size={16} className="text-gray-400"/>
                </div>
              </button>
            </div>

            {/* 数据与同步 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">数据与同步</div>
              <button onClick={() => saveToCloud(currentUser.objectId, sessionToken, true)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <Icons.Cloud size={18} className="text-gray-600"/>
                  <span>同步到云端</span>
                </div>
                <Icons.ChevronRight size={16} className="text-gray-400"/>
              </button>
              <button onClick={handleBackup} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icons.Download size={18} className="text-gray-600"/>
                  <span>备份数据</span>
                </div>
                <Icons.ChevronRight size={16} className="text-gray-400"/>
              </button>
            </div>

            {/* AI 配置 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">AI 识别配置</div>
              <button
                onClick={() => {
                  setApiKeyInput(getApiKeyFor(currentApiProvider) || '');
                  setShowAiConfig(!showAiConfig);
                }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Icons.ScanLine size={18} className="text-gray-600"/>
                  <span>配置AI识别服务</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {API_PROVIDERS.find(p => p.id === currentApiProvider)?.name || '未选择'}
                  </span>
                  <Icons.ChevronDown size={16} className={`text-gray-400 transition-transform ${showAiConfig ? 'rotate-180' : ''}`}/>
                </div>
              </button>

              {showAiConfig && (
                <div className="px-4 py-3 border-t bg-gray-50 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">AI 服务提供商</label>
                    <select
                      value={currentApiProvider}
                      onChange={e => {
                        const newProvider = e.target.value;
                        setCurrentApiProvider(newProvider);
                        setCurrentApi(newProvider);
                        setApiKeyInput(getApiKeyFor(newProvider) || '');
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    >
                      {API_PROVIDERS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        placeholder={API_PROVIDERS.find(p => p.id === currentApiProvider)?.placeholder || '输入API Key'}
                        className="flex-1 px-3 py-2 border rounded-xl text-sm"
                      />
                      <button
                        onClick={() => {
                          saveApiKeyFor(currentApiProvider, apiKeyInput);
                          alert('API Key 已保存');
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium"
                      >
                        保存
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentApiProvider === 'qwen' && '通义千问提供免费额度，可直接使用'}
                      {currentApiProvider === 'gemini' && '可在 Google AI Studio 获取免费 API Key'}
                      {currentApiProvider === 'openai' && '需要 OpenAI 付费账户'}
                      {currentApiProvider === 'claude' && '需要 Anthropic 付费账户'}
                      {currentApiProvider === 'siliconflow' && '硅基流动提供多种模型选择'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 数据统计 */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-xs font-medium text-gray-500 uppercase mb-3">当前成员数据统计</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{meds.length}</div>
                  <div className="text-xs text-gray-500">用药计划</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{vitals.length}</div>
                  <div className="text-xs text-gray-500">健康记录</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{labReports.length}</div>
                  <div className="text-xs text-gray-500">检验报告</div>
                </div>
              </div>
            </div>

            {/* 账号 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">账号</div>
              <button onClick={() => { if(confirm('确定要退出登录吗？')) performLogout(); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center justify-between text-red-600">
                <div className="flex items-center gap-3">
                  <Icons.LogOut size={18}/>
                  <span>退出登录</span>
                </div>
                <Icons.ChevronRight size={16} className="text-gray-400"/>
              </button>
            </div>

            {/* 底部占位 */}
            <div className="h-4"></div>
          </div>
        )}
      </div>

      {/* 浮动添加按钮 - 仅在指标和用药页面显示 */}
      {(activeTab === 'vitals' || activeTab === 'meds') && (
        <div className="absolute bottom-16 right-4 z-10">
          <button onClick={() => {
            if (activeTab === 'vitals') {
              setEditingId(null);
              setVitalsInput({
                type: selectedVitalType || 'blood_pressure',
                date: getLocalDateStr(new Date()),
                time: getLocalTimeStr(new Date()),
                value1: '', value2: '', note: ''
              });
              setShowVitalsForm(true);
            } else {
              setEditingId(null);
              setMedInput({name:'',startTime:getLocalDateStr(new Date()),endTime:'',frequency:'1',dosagePerTime:'1',relation:'无关',timePeriods:[],isLongTerm:true,cycleEnabled:false,cycleDays:'',cycleRestDays:''});
              setShowMedForm(true);
            }
          }} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center">
            <Icons.Plus size={24}/>
          </button>
        </div>
      )}

      {/* 底部导航栏 */}
      <div className="bg-white border-t flex justify-around py-2 shrink-0">
        {[
          { id: 'vitals', icon: 'Activity', label: '指标' },
          { id: 'meds', icon: 'Clock', label: '用药' },
          { id: 'exams', icon: 'FileSpreadsheet', label: '报告' },
          { id: 'settings', icon: 'Settings', label: '设置' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center py-1 px-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`}>
            {Icons[tab.icon] && Icons[tab.icon]({ size: 22 })}
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 成员菜单 */}
      {showMemberMenu && (
        <div className="absolute inset-0 z-50" onClick={() => setShowMemberMenu(false)}>
          <div className="absolute top-14 left-4 bg-white rounded-xl shadow-xl border p-2 min-w-48" onClick={e => e.stopPropagation()}>
            {members.map(m => (
              <div key={m.id} className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 ${m.id === currentMemberId ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                <button onClick={() => { setCurrentMemberId(m.id); setShowMemberMenu(false); }} className="flex-1 flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${MEMBER_COLORS.find(c => c.id === m.color)?.bg || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold`}>
                    {m.name[0]}
                  </div>
                  <span className={`font-medium ${m.id === currentMemberId ? 'text-indigo-600' : ''}`}>{m.name}</span>
                </button>
                <button onClick={() => { setEditingMember(m); setMemberInput({ name: m.name, relation: m.relation, color: m.color }); setShowMemberForm(true); }} className="p-1 hover:bg-gray-200 rounded">
                  <Icons.Edit size={14} className="text-gray-400"/>
                </button>
              </div>
            ))}
            <div className="border-t mt-2 pt-2">
              <button onClick={() => { setEditingMember(null); setMemberInput({ name: '', relation: '', color: 'indigo' }); setShowMemberForm(true); }} className="w-full px-3 py-2 text-left rounded-lg flex items-center gap-2 text-indigo-600 hover:bg-indigo-50">
                <Icons.UserPlus size={16}/>
                <span className="font-medium">添加成员</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用药表单弹窗 */}
      {showMedForm && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{editingId ? '编辑用药' : '添加用药'}</h3>
              <button onClick={() => setShowMedForm(false)}><Icons.X size={24} className="text-gray-400"/></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">药品名称</label>
                {catalog.length > 0 ? (
                  <div className="mt-1 relative">
                    <select
                      value={medInput.name}
                      onChange={e => setMedInput({...medInput, name: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl appearance-none bg-white pr-10"
                    >
                      <option value="">选择药品</option>
                      {catalog.map(c => (
                        <option key={c.id} value={c.name}>{c.name}{c.strength ? ` (${c.strength}${c.unit || ''})` : ''}</option>
                      ))}
                    </select>
                    <Icons.ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <div className="mt-1 p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-2">暂无药品，请先添加药品到目录</p>
                    <button
                      onClick={() => { setShowMedForm(false); setMedSubTab('catalog'); }}
                      className="text-indigo-600 text-sm font-medium"
                    >
                      前往药品目录 →
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">开始日期</label>
                  <input type="date" value={medInput.startTime} onChange={e => setMedInput({...medInput, startTime: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl"/>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">结束日期 (可选)</label>
                  <input type="date" value={medInput.endTime} onChange={e => setMedInput({...medInput, endTime: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">每日次数</label>
                  <select value={medInput.frequency} onChange={e => setMedInput({...medInput, frequency: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl">
                    {['1','2','3','4'].map(n => <option key={n} value={n}>{n}次</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">每次剂量</label>
                  <input type="text" value={medInput.dosagePerTime} onChange={e => setMedInput({...medInput, dosagePerTime: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl"/>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">用餐关系</label>
                <div className="flex gap-2 mt-2">
                  {RELATIONS.map(r => (
                    <button key={r} onClick={() => setMedInput({...medInput, relation: r})} className={`px-4 py-2 rounded-xl ${medInput.relation === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{r}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">服药时段</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {TIME_PERIODS.map(p => (
                    <button key={p} onClick={() => {
                      const periods = medInput.timePeriods || [];
                      setMedInput({...medInput, timePeriods: periods.includes(p) ? periods.filter(x => x !== p) : [...periods, p]});
                    }} className={`px-4 py-2 rounded-xl ${(medInput.timePeriods || []).includes(p) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{p}</button>
                  ))}
                </div>
              </div>

              {/* 循环用药 */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">循环用药 (可选)</span>
                  <button onClick={() => setMedInput({...medInput, cycleEnabled: !medInput.cycleEnabled})} className={`w-12 h-6 rounded-full transition-colors ${medInput.cycleEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${medInput.cycleEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}/>
                  </button>
                </div>
                {medInput.cycleEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">服</span>
                    <input type="number" value={medInput.cycleDays} onChange={e => setMedInput({...medInput, cycleDays: e.target.value})} className="w-16 px-2 py-1 border rounded-lg text-center" placeholder="7"/>
                    <span className="text-sm text-gray-600">天, 停</span>
                    <input type="number" value={medInput.cycleRestDays} onChange={e => setMedInput({...medInput, cycleRestDays: e.target.value})} className="w-16 px-2 py-1 border rounded-lg text-center" placeholder="7"/>
                    <span className="text-sm text-gray-600">天</span>
                  </div>
                )}
              </div>

              {/* 删除按钮 - 仅编辑模式显示 */}
              {editingId && (
                <button
                  onClick={() => {
                    if (confirm('确定要删除这个用药计划吗？')) {
                      setMeds(meds.filter(m => m.id !== editingId));
                      setShowMedForm(false);
                    }
                  }}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100"
                >
                  <Icons.Trash2 size={18} /> 删除此用药计划
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowMedForm(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">取消</button>
                <button onClick={() => {
                  if (!medInput.name.trim()) { alert('请输入药品名称'); return; }
                  const newMed = { ...medInput, id: editingId || Date.now().toString() };
                  if (editingId) {
                    setMeds(meds.map(m => m.id === editingId ? newMed : m));
                  } else {
                    setMeds([...meds, newMed]);
                  }
                  setShowMedForm(false);
                }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 药品目录表单弹窗 */}
      {showCatalogForm && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{editingId ? '编辑药品' : '添加药品'}</h3>
              <button onClick={() => setShowCatalogForm(false)}><Icons.X size={24} className="text-gray-400"/></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">药品名称</label>
                <input type="text" value={catalogInput.name} onChange={e => setCatalogInput({...catalogInput, name: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl" placeholder="输入药品名称"/>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">品牌 (可选)</label>
                <input type="text" value={catalogInput.brand || ''} onChange={e => setCatalogInput({...catalogInput, brand: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl" placeholder="如：辉瑞、拜耳"/>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">剂型</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {DOSAGE_FORMS.map(f => (
                    <button key={f} onClick={() => setCatalogInput({...catalogInput, dosageForm: f})} className={`px-3 py-1.5 rounded-lg text-sm ${catalogInput.dosageForm === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{f}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">规格</label>
                  <input type="text" value={catalogInput.strength || ''} onChange={e => setCatalogInput({...catalogInput, strength: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl" placeholder="如：500"/>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">单位</label>
                  <select value={catalogInput.unit || 'mg'} onChange={e => setCatalogInput({...catalogInput, unit: e.target.value})} className="w-full mt-1 px-4 py-3 border rounded-xl">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* 删除按钮 - 仅编辑模式显示 */}
              {editingId && (
                <button
                  onClick={() => {
                    if (confirm('确定要删除这个药品吗？')) {
                      setCatalog(catalog.filter(c => c.id !== editingId));
                      setShowCatalogForm(false);
                    }
                  }}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100"
                >
                  <Icons.Trash2 size={18} /> 删除此药品
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCatalogForm(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">取消</button>
                <button onClick={() => {
                  if (!catalogInput.name.trim()) { alert('请输入药品名称'); return; }
                  const newItem = { ...catalogInput, id: editingId || Date.now().toString() };
                  if (editingId) {
                    setCatalog(catalog.map(c => c.id === editingId ? newItem : c));
                  } else {
                    setCatalog([...catalog, newItem]);
                  }
                  setShowCatalogForm(false);
                }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 健康指标表单弹窗 */}
      <VitalsFormModal
        show={showVitalsForm}
        onClose={() => { setShowVitalsForm(false); setEditingId(null); }}
        editingId={editingId}
        vitalsInput={vitalsInput}
        setVitalsInput={setVitalsInput}
        onSave={saveVitals}
        onDelete={deleteVital}
      />

      {/* 成员管理表单弹窗 */}
      <MemberFormModal
        show={showMemberForm}
        onClose={() => { setShowMemberForm(false); setEditingMember(null); }}
        editingMember={editingMember}
        memberInput={memberInput}
        setMemberInput={setMemberInput}
        onSave={saveMember}
        onDelete={deleteMember}
      />

      {/* 备份弹窗 */}
      <BackupModal
        show={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        backupDataStr={backupDataStr}
        backupFileName={backupFileName}
        backupStats={backupStats}
        onDownload={handleDownloadBackup}
        onCopy={handleCopyBackup}
        onRestore={handleRestoreBackup}
      />

      {/* 扫描识别弹窗 */}
      <ScanModal
        show={showScanModal}
        onClose={() => { setShowScanModal(false); setEditingId(null); setScanEditData(null); }}
        scanType={scanType}
        editingId={editingId}
        scanEditData={scanEditData}
        onSave={scanType === 'lab' ? saveLabReport : saveImagingReport}
        onDelete={deleteReport}
        customLabCategories={customLabCategories}
        customImagingModalities={customImagingModalities}
        onAddCustomCategory={handleAddCustomCategory}
      />

      {/* 趋势分析弹窗 */}
      <TrendModal
        show={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        selectedItems={selectedTrendItems}
        labReports={labReports}
        meds={meds}
        dateRange={trendDateRange}
        setDateRange={setTrendDateRange}
        onClearSelection={() => setSelectedTrendItems([])}
        memberName={currentMember?.name || ''}
      />

      {/* 检查预约弹窗 */}
      <CheckupModal
        show={showCheckupModal}
        onClose={() => { setShowCheckupModal(false); setEditingCheckup(null); }}
        editingCheckup={editingCheckup}
        onSave={saveCheckup}
        onDelete={deleteCheckup}
      />

      {/* 病历文书弹窗 */}
      <MedicalRecordModal
        show={showMedicalRecordModal}
        onClose={() => { setShowMedicalRecordModal(false); setMedicalRecordEditingId(null); setMedicalRecordEditData(null); }}
        editingId={medicalRecordEditingId}
        editData={medicalRecordEditData}
        onSave={saveMedicalRecord}
        onDelete={deleteMedicalRecord}
        customRecordTypes={customRecordTypes}
        onAddCustomType={handleAddCustomRecordType}
      />
    </div>
  );
}

export default App;
