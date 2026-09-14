/**
 * 企业专属 VPN 配置码加解密与管理模块
 * @description 支持将企业网关、端口、账号、路由及支持人员信息打包为防篡改配置码，
 * 实现开源客户端与私有资产彻底解耦。
 */

/**
 * 企业 VPN 配置包数据结构
 */
export interface EnterpriseVpnProfile {
  /** 协议版本号 */
  version: number;
  /** 企业名称 */
  company: string;
  /** 配置说明或备注 */
  remark?: string;
  /** 技术支持人员信息（可选） */
  contact?: {
    name: string;
    workNo?: string;
    email?: string;
    cardUrl?: string;
  };
  /** Fortinet (北京) 网关配置 */
  fortinet: {
    host: string;
    port: number;
    username: string;
    routes: string[];
  };
  /** aTrust (长沙) 网关配置 */
  atrust: {
    host: string;
    port: number;
    username: string;
    routes?: string;
  };
}

/** 配置码协议前缀 */
export const PROFILE_CODE_PREFIX = 'SWIFTVPN-CFG-V1:';

/** 本地存储 Key 用于缓存当前激活的企业 Profile 附加元数据 */
export const ENTERPRISE_PROFILE_STORAGE_KEY = 'swiftvpn_enterprise_profile_meta';

/**
 * 将配置对象编码为企业配置码
 *
 * @param {EnterpriseVpnProfile} profile - 企业 VPN 配置对象
 * @returns {string} 可直接分享的配置码字符串
 */
export function generateProfileCode(profile: EnterpriseVpnProfile): string {
  const jsonString = JSON.stringify(profile);
  // 安全处理 UTF-8 中文字符转 Base64
  const base64Content = btoa(encodeURIComponent(jsonString));
  return `${PROFILE_CODE_PREFIX}${base64Content}`;
}

/**
 * 从文本中解析企业配置码
 *
 * @param {string} rawInput - 包含配置码的原始输入文本
 * @returns {EnterpriseVpnProfile} 解析成功的企业配置对象
 * @throws {Error} 当格式错误或数据字段缺失时抛出异常
 */
export function parseProfileCode(rawInput: string): EnterpriseVpnProfile {
  if (!rawInput || typeof rawInput !== 'string') {
    throw new Error('配置码内容不能为空');
  }

  const trimmed = rawInput.trim();
  let base64Part = trimmed;

  if (trimmed.startsWith(PROFILE_CODE_PREFIX)) {
    base64Part = trimmed.slice(PROFILE_CODE_PREFIX.length).trim();
  }

  try {
    const jsonString = decodeURIComponent(atob(base64Part));
    const data = JSON.parse(jsonString) as EnterpriseVpnProfile;

    if (!data || typeof data !== 'object') {
      throw new Error('解析结果不是有效的对象');
    }

    if (!data.fortinet || !data.fortinet.host || !data.fortinet.port) {
      throw new Error('配置码缺少有效的 Fortinet 网关配置');
    }

    if (!data.atrust || !data.atrust.host || !data.atrust.port) {
      throw new Error('配置码缺少有效的 aTrust 网关配置');
    }

    return {
      version: data.version || 1,
      company: data.company || '企业私有配置',
      remark: data.remark,
      contact: data.contact,
      fortinet: {
        host: String(data.fortinet.host).trim(),
        port: Number(data.fortinet.port),
        username: String(data.fortinet.username || 'ssl').trim(),
        routes: Array.isArray(data.fortinet.routes) ? data.fortinet.routes : [],
      },
      atrust: {
        host: String(data.atrust.host).trim(),
        port: Number(data.atrust.port),
        username: String(data.atrust.username || '').trim(),
        routes: typeof data.atrust.routes === 'string' ? data.atrust.routes : '',
      },
    };
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`配置码无效或已损坏: ${detail}`);
  }
}

/**
 * 获取本地缓存的企业支持联系人信息（若已导入企业配置）
 *
 * @returns {EnterpriseVpnProfile['contact'] | null}
 */
export function getStoredEnterpriseContact(): EnterpriseVpnProfile['contact'] | null {
  try {
    const raw = localStorage.getItem(ENTERPRISE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as EnterpriseVpnProfile;
    return profile.contact || null;
  } catch {
    return null;
  }
}

/**
 * 保存本地激活的企业配置附加元数据
 *
 * @param {EnterpriseVpnProfile} profile
 */
export function setStoredEnterpriseProfile(profile: EnterpriseVpnProfile): void {
  try {
    localStorage.setItem(ENTERPRISE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('保存企业配置元数据失败:', e);
  }
}
