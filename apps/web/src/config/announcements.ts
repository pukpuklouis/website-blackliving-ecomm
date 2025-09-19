// Announcement configuration
// This file centralizes all announcement settings for easy management

export interface AnnouncementConfig {
  id: string;
  message: string;
  publishDate: string; // ISO date string
  endDate: string; // ISO date string
  type?: 'info' | 'warning' | 'success' | 'promotion';
  url?: string;
  buttonText?: string;
  dismissible?: boolean;
  enabled?: boolean; // Manual override to disable announcement
}

// Current active announcement configuration
export const currentAnnouncement: AnnouncementConfig = {
  id: 'example-announcement-2025',
  message: '🎉 新品上市！Simmons Black Label 限量款床墊現正熱銷中',
  publishDate: '2025-08-25T00:00:00+08:00',
  endDate: '2025-09-30T23:59:59+08:00',
  type: 'promotion',
  url: '/products/simmons-black',
  buttonText: '立即查看',
  dismissible: true,
  enabled: true,
};

// Utility functions for announcement visibility
export function isAnnouncementVisible(config: AnnouncementConfig): boolean {
  if (!config.enabled) return false;

  const now = new Date();
  const publishDate = new Date(config.publishDate);
  const endDate = new Date(config.endDate);

  return now >= publishDate && now <= endDate;
}

export function isDismissed(announcementId: string): boolean {
  if (typeof window !== 'undefined') {
    const dismissed = localStorage.getItem(`announcement-dismissed-${announcementId}`);
    return dismissed === 'true';
  }
  return false;
}

// CSS classes for different announcement types
export const typeClasses = {
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-600 text-white',
  success: 'bg-green-600 text-white',
  promotion: 'bg-gradient-to-r from-red-600 to-orange-600 text-white',
} as const;

// Historical announcements for reference
export const pastAnnouncements: AnnouncementConfig[] = [
  {
    id: 'grand-opening-2024',
    message: '🏪 Black Living 新店開幕！全館商品限時優惠',
    publishDate: '2024-01-01T00:00:00+08:00',
    endDate: '2024-01-31T23:59:59+08:00',
    type: 'promotion',
    url: '/stores',
    buttonText: '查看門市',
    dismissible: true,
    enabled: false,
  },
  {
    id: 'maintenance-notice-2024',
    message: '⚠️ 系統維護通知：2024年3月15日 02:00-06:00 網站暫停服務',
    publishDate: '2024-03-10T00:00:00+08:00',
    endDate: '2024-03-15T06:00:00+08:00',
    type: 'warning',
    dismissible: false,
    enabled: false,
  },
];

// Example configurations for different scenarios
export const exampleAnnouncements = {
  // Sale/Promotion
  blackFriday: {
    id: 'black-friday-2024',
    message: '🔥 Black Friday 限時特惠！全館床墊最低5折起',
    type: 'promotion' as const,
    buttonText: '立即搶購',
  },

  // New Product Launch
  newProduct: {
    id: 'new-product-launch',
    message: '✨ 全新系列登場！美國原裝進口頂級床墊現已上市',
    type: 'success' as const,
    buttonText: '搶先體驗',
  },

  // Store Information
  storeUpdate: {
    id: 'store-update',
    message: '📍 台北旗艦店重新開幕！歡迎蒞臨體驗',
    type: 'info' as const,
    buttonText: '查看門市',
  },

  // System Maintenance
  maintenance: {
    id: 'maintenance-notice',
    message: '⚠️ 系統維護通知：預計維護時間 2小時',
    type: 'warning' as const,
    dismissible: false,
  },
};
