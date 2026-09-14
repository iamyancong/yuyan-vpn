import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { invoke } from '@tauri-apps/api/core';
import type { VpnSettingsForm } from '@/views/Settings/constant';
import {
  type EnterpriseVpnProfile,
  generateProfileCode,
  parseProfileCode,
  setStoredEnterpriseProfile,
  PROFILE_CODE_PREFIX,
} from '@/utils/configProfile';
import { CONTACT_CONFIG } from '@/components/ContactModal/constant';
import type { ConfigModalMode } from '../constant';

/**
 * 企业配置导入/导出业务逻辑 Hook
 *
 * @param {object} options - 初始化参数
 * @param {Function} [options.onSuccess] - 导入成功后的全局刷新回调
 * @returns 导入导出状态与核心操作方法
 */
export const useConfigProfile = (options?: { onSuccess?: () => Promise<void> | void }) => {
  const mode = ref<ConfigModalMode>('import');
  const codeText = ref('');
  const parsedPreview = ref<EnterpriseVpnProfile | null>(null);
  const parseError = ref('');
  const isSubmitting = ref(false);

  /**
   * 解析输入框中的配置码内容
   */
  const handleValidateCode = () => {
    if (!codeText.value.trim()) {
      parsedPreview.value = null;
      parseError.value = '';
      return;
    }

    try {
      const profile = parseProfileCode(codeText.value);
      parsedPreview.value = profile;
      parseError.value = '';
    } catch (err: unknown) {
      parsedPreview.value = null;
      parseError.value = err instanceof Error ? err.message : String(err);
    }
  };

  /**
   * 尝试从剪贴板快速粘贴
   */
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.includes(PROFILE_CODE_PREFIX)) {
        codeText.value = text.trim();
        handleValidateCode();
        message.success('已自动从剪贴板读取企业配置码');
      } else {
        message.info('剪贴板中未找到企业配置码，请直接按 ⌘V / Ctrl+V 粘贴');
      }
    } catch {
      message.info('请在输入框中直接按 ⌘V / Ctrl+V 粘贴配置码');
    }
  };

  /**
   * 执行配置码导入
   */
  const executeImport = async (): Promise<boolean> => {
    if (!codeText.value.trim()) {
      message.warning('请先输入或粘贴企业配置码');
      return false;
    }

    handleValidateCode();
    if (!parsedPreview.value) {
      message.error(parseError.value || '配置码格式不合法');
      return false;
    }

    const profile = parsedPreview.value;
    isSubmitting.value = true;

    try {
      const settingsPayload = {
        fortinet: {
          enabled: true,
          host: profile.fortinet.host,
          port: profile.fortinet.port,
          username: profile.fortinet.username,
          password: '',
          savePassword: true,
          customRoutes: profile.fortinet.routes,
        },
        atrust: {
          enabled: true,
          host: profile.atrust.host,
          port: profile.atrust.port,
          username: profile.atrust.username,
          password: '',
          savePassword: true,
          customRoutes: (profile.atrust.routes || '')
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean),
        },
      };

      // 1. 持久化至 Rust 后端底层的 vpn_config.json
      await invoke('save_vpn_config', { settings: settingsPayload });

      // 2. 缓存企业元数据（包含技术支持人名片等）
      setStoredEnterpriseProfile(profile);

      message.success(`【${profile.company}】专属配置已成功导入并持久化生效！`, 3);

      if (options?.onSuccess) {
        await options.onSuccess();
      }
      return true;
    } catch (err: unknown) {
      console.error('导入企业配置失败:', err);
      message.error(`导入配置失败: ${String(err)}`);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * 生成当前表单的配置码并复制到剪贴板
   *
   * @param {VpnSettingsForm} currentForm - 当前设置页表单数据
   */
  const executeExport = async (currentForm: VpnSettingsForm): Promise<string> => {
    const profile: EnterpriseVpnProfile = {
      version: 1,
      company: CONTACT_CONFIG.company || '企业专属',
      remark: `${CONTACT_CONFIG.company || '企业'}官方 VPN 研发与内网办公专线`,
      contact: {
        name: CONTACT_CONFIG.name,
        workNo: CONTACT_CONFIG.workNo,
        email: CONTACT_CONFIG.email,
        cardUrl: CONTACT_CONFIG.cardUrl,
      },
      fortinet: {
        host: currentForm.fortinetHost,
        port: currentForm.fortinetPort,
        username: currentForm.fortinetUsername,
        routes: currentForm.fortinetRoutes,
      },
      atrust: {
        host: currentForm.atrustHost,
        port: currentForm.atrustPort,
        username: currentForm.atrustUsername,
        routes: currentForm.atrustRoutes,
      },
    };

    const code = generateProfileCode(profile);
    codeText.value = code;
    parsedPreview.value = profile;

    try {
      await navigator.clipboard.writeText(code);
      message.success('企业配置码已生成并成功复制到剪贴板，可直接发送给同事！', 3);
    } catch (err) {
      console.error('复制配置码失败:', err);
      message.info('配置码已生成，请在文本框中全选复制');
    }

    return code;
  };

  /** 监听输入内容变化实时校验 */
  watch(codeText, () => {
    if (mode.value === 'import') {
      handleValidateCode();
    }
  });

  return {
    mode,
    codeText,
    parsedPreview,
    parseError,
    isSubmitting,
    pasteFromClipboard,
    executeImport,
    executeExport,
  };
};
