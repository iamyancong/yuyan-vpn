<script setup lang="ts">
import UpdateCapsule from '@/components/UpdateCapsule/index.vue';
import { useAppUpdate } from '@/components/UpdateCapsule/hooks/useAppUpdate';
import { useTheme } from '@/hooks/useTheme';
import {
  BgColorsOutlined,
  InfoCircleOutlined,
  CloudDownloadOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue';

defineOptions({ name: 'LayoutHeader' });

defineProps<{
  /** 是否是 Tauri 客户端 */
  isTauriClient: boolean;
}>();

defineEmits<{
  /** 触发打开平台设置抽屉 */
  (e: 'openSettings'): void;
  /** 触发打开关于雨燕弹窗 */
  (e: 'openAbout'): void;
  /** 触发打开联系我们弹窗 */
  (e: 'openContact'): void;
}>();

const { isDark } = useTheme();
const { handleCheckUpdateClick } = useAppUpdate();

/** 退出当前登录/应用逻辑。 */
const handleLogout = async () => {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('exit_app');
  } catch (e) {
    console.error('退出应用失败:', e);
  }
};
</script>

<template>
  <a-layout-header class="yuyan-layout-header" :class="{ 'is-dark': isDark }">
    <div class="yuyan-layout-header-left">
      <!-- 赛博玻璃拟态更新胶囊 -->
      <UpdateCapsule v-if="isTauriClient" />
    </div>

    <div v-if="isTauriClient" class="yuyan-layout-header-drag" data-tauri-drag-region />

    <div class="yuyan-layout-header-right">
      <!-- 平台设置 -->
      <a-tooltip title="平台设置" overlayClassName="header-tooltip">
        <a-button type="text" class="header-action-btn btn-settings" @click="$emit('openSettings')">
          <template #icon>
            <BgColorsOutlined class="action-icon" />
          </template>
        </a-button>
      </a-tooltip>

      <!-- 用户头像下拉菜单 -->
      <div class="user-section">
        <a-dropdown :trigger="['hover']" placement="bottomRight" :overlayClassName="isDark ? 'header-user-dropdown is-dark' : 'header-user-dropdown'">
          <div class="user-dropdown-trigger">
            <div class="user-avatar">
              <img src="@/assets/avatar.png" alt="Avatar" />
            </div>
            <span class="user-name">管理员</span>
          </div>
          <template #overlay>
            <a-menu class="user-dropdown-menu">
              <a-menu-item v-if="isTauriClient" key="check-update" class="c4d-menu-item item-update" @click="handleCheckUpdateClick">
                <template #icon>
                  <div class="menu-icon-capsule icon-update">
                    <CloudDownloadOutlined />
                  </div>
                </template>
                <div class="menu-label-box">
                  <span class="menu-title">检查更新</span>
                  <span class="menu-sub">检测最新客户端版本</span>
                </div>
              </a-menu-item>

              <a-menu-item v-if="isTauriClient" key="about" class="c4d-menu-item item-about" @click="$emit('openAbout')">
                <template #icon>
                  <div class="menu-icon-capsule icon-about">
                    <InfoCircleOutlined />
                  </div>
                </template>
                <div class="menu-label-box">
                  <span class="menu-title">关于平台</span>
                  <span class="menu-sub">软件信息与环境诊断</span>
                </div>
              </a-menu-item>

              <a-menu-divider class="c4d-divider" />

              <a-menu-item key="contact" class="c4d-menu-item item-contact" @click="$emit('openContact')">
                <template #icon>
                  <div class="menu-icon-capsule icon-contact">
                    <CustomerServiceOutlined />
                  </div>
                </template>
                <div class="menu-label-box">
                  <span class="menu-title">联系我们</span>
                  <span class="menu-sub">企业微信极速直达</span>
                </div>
              </a-menu-item>

              <a-menu-divider class="c4d-divider" />

              <a-menu-item key="logout" class="c4d-menu-item item-logout" @click="handleLogout">
                <template #icon>
                  <div class="menu-icon-capsule icon-logout">
                    <LogoutOutlined />
                  </div>
                </template>
                <div class="menu-label-box">
                  <span class="menu-title">退出登录</span>
                  <span class="menu-sub">安全退出程序</span>
                </div>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </a-layout-header>
</template>

<style lang="less">
@import './style.less';
</style>
