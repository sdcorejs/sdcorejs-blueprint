// Tiện ích dùng chung phía trình duyệt.
export const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** Bỏ dấu tiếng Việt để tìm kiếm: "Phân quyền" → "phan quyen". */
export const fold = value => String(value ?? '')
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase();

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Bộ nhớ bị chặn: vẫn chạy, chỉ không nhớ lựa chọn.
    }
  },
};

export function announce(message) {
  const live = document.getElementById('live');
  if (!live) return;
  live.textContent = '';
  window.setTimeout(() => { live.textContent = message; }, 30);
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Phím ← → không đổi bước khi người dùng đang gõ hoặc điều khiển widget có phím mũi tên riêng. */
export function arrowsBelongToFocus(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest('input, textarea, select, [contenteditable="true"], [role="tree"], [role="tablist"]')) return true;
  return false;
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  } finally {
    area.remove();
  }
}
