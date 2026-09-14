<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  CloseOutlined,
  ImportOutlined,
  ExportOutlined,
  SnippetsOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue';
import type { VpnSettingsForm } from '@/views/Settings/constant';
import { CONFIG_MODAL_TEXTS, type ConfigModalMode } from './constant';
import { useConfigProfile } from './hooks/useConfigProfile';

defineOptions({ name: 'ConfigProfileModal' });

const props = defineProps<{
  open: boolean;
  mode?: ConfigModalMode;
  currentForm?: VpnSettingsForm;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'success'): void;
}>();

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const {
  mode,
  codeText,
  parsedPreview,
  parseError,
  isSubmitting,
  pasteFromClipboard,
  executeImport,
  executeExport,
} = useConfigProfile({
  onSuccess: () => {
    emit('success');
    visible.value = false;
  },
});

const textareaRef = ref<HTMLTextAreaElement | null>(null);

/** 监听传入的 mode */
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      mode.value = props.mode || 'import';
      if (mode.value === 'export' && props.currentForm) {
        void executeExport(props.currentForm);
      } else {
        codeText.value = '';
        setTimeout(() => textareaRef.value?.focus(), 150);
      }
    }
  }
);

/** 执行确认操作 */
const handleConfirm = async () => {
  if (mode.value === 'import') {
    await executeImport();
  } else {
    visible.value = false;
  }
};

/** 点击联系我获取配置码，关闭当前弹窗并呼出联系我们弹窗 */
const handleContactAuthor = () => {
  visible.value = false;
  window.dispatchEvent(new CustomEvent('show-contact-modal'));
};
</script>

<template>
  <a-modal
    v-model:open="visible"
    :footer="null"
    :width="420"
    :destroyOnClose="true"
    :maskClosable="true"
    :closable="false"
    centered
    wrapClassName="yuyan-config-profile-modal-wrap"
  >
    <div class="profile-modal-container">
      <div class="modal-close-btn" title="关闭" @click="visible = false">
        <CloseOutlined />
      </div>

      <div class="profile-modal-header">
        <div class="header-icon-capsule" :class="{ 'is-export': mode === 'export' }">
          <ExportOutlined v-if="mode === 'export'" />
          <ImportOutlined v-else />
        </div>
        <div class="header-text-box">
          <div class="modal-title">
            {{ mode === 'export' ? CONFIG_MODAL_TEXTS.exportTitle : CONFIG_MODAL_TEXTS.importTitle }}
          </div>
          <div class="modal-subtitle">SwiftVPN 企业资产隔离与安全同步</div>
        </div>
      </div>

      <!-- 提示文案与联系我快速入口 -->
      <div class="modal-tip-banner">
        <template v-if="mode === 'export'">
          {{ CONFIG_MODAL_TEXTS.exportTip }}
        </template>
        <template v-else>
          <span>请粘贴内部文档或企微群分享的专属配置码（导入即时生效）。您也可关闭弹窗手动配置网关，或</span>
          <a class="contact-author-link" @click="handleContactAuthor">联系我获取配置码 💬</a>
        </template>
      </div>

      <div class="code-textarea-wrapper">
        <textarea
          ref="textareaRef"
          v-model="codeText"
          class="code-textarea"
          :placeholder="mode === 'export' ? '生成中的企业配置码...' : '按 ⌘V / Ctrl+V 直接粘贴企业配置码...'"
          :readonly="mode === 'export'"
        />
        <div v-if="mode === 'import'" class="quick-paste-btn" @click="pasteFromClipboard">
          <SnippetsOutlined />
          <span>从剪贴板粘贴</span>
        </div>
      </div>

      <!-- 校验通过预览卡片 -->
      <div v-if="parsedPreview" class="preview-card">
        <div class="preview-header">
          <span>所属企业: {{ parsedPreview.company }}</span>
          <span class="badge-success"><CheckCircleOutlined /> 配置码有效</span>
        </div>
        <div class="preview-details">
          <div class="detail-tag">北京: {{ parsedPreview.fortinet.host }}:{{ parsedPreview.fortinet.port }}</div>
          <div class="detail-tag">长沙: {{ parsedPreview.atrust.host }}:{{ parsedPreview.atrust.port }}</div>
          <div v-if="parsedPreview.contact" class="detail-tag">支持人: {{ parsedPreview.contact.name }}</div>
          <div class="detail-tag">内置路由: {{ parsedPreview.fortinet.routes.length }} 条</div>
        </div>
      </div>

      <div v-else-if="parseError && mode === 'import'" class="error-banner">
        {{ parseError }}
      </div>

      <div class="modal-actions">
        <a-button class="btn-cancel" @click="visible = false">取消</a-button>
        <a-button type="primary" class="btn-submit" :loading="isSubmitting" @click="handleConfirm">
          {{ mode === 'export' ? '复制并关闭' : '确认导入' }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style scoped lang="less">
@import './style.less';
</style>
