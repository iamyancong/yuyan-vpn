/**
 * 企业配置导入/导出弹窗常量与类型定义
 */

/**
 * 弹窗当前模式
 */
export type ConfigModalMode = 'import' | 'export';

/**
 * 导入导出弹窗模式配置
 */
export const CONFIG_MODAL_TEXTS = {
  importTitle: '导入企业专属配置码',
  exportTitle: '导出当前企业配置码',
  importTip: '请粘贴公司企业微信或内部文档中分享的 VPN 专属配置码，导入后将自动写入本地持久化存储并即时生效。',
  exportTip: '您可以将当前已验证的网关地址、分流路由及技术支持信息打包为配置码，直接发送给同事或沉淀至群公告。',
};
