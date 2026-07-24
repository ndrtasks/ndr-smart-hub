(() => {
  'use strict';

  const CHAT_KEY = 'ndr_ka_chat';
  const USER_KEY = 'ndr_ka_user';
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const nativeRemove = Storage.prototype.removeItem;

  function currentUserId(storage) {
    try {
      const raw = nativeGet.call(storage, USER_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.id ? String(parsed.id) : 'guest';
    } catch {
      return 'guest';
    }
  }

  function scopedChatKey(storage) {
    return `${CHAT_KEY}:${currentUserId(storage)}`;
  }

  // The old key was shared by every demo employee. Remove it rather than risk exposing another employee's history.
  try { nativeRemove.call(localStorage, CHAT_KEY); } catch {}

  Storage.prototype.getItem = function(key) {
    if (key === CHAT_KEY) return nativeGet.call(this, scopedChatKey(this));
    return nativeGet.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    if (key === CHAT_KEY) return nativeSet.call(this, scopedChatKey(this), value);
    return nativeSet.call(this, key, value);
  };

  Storage.prototype.removeItem = function(key) {
    if (key === CHAT_KEY) return nativeRemove.call(this, scopedChatKey(this));
    return nativeRemove.call(this, key);
  };

  function chatContainer() {
    return document.querySelector('.messages');
  }

  function scrollChatToBottom() {
    const el = chatContainer();
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }

  function clearCurrentEmployeeChat() {
    nativeRemove.call(localStorage, scopedChatKey(localStorage));
    // A reload also clears any in-memory form session/draft without touching another employee's data.
    window.location.reload();
  }

  function ensureClearButton() {
    const head = document.querySelector('.chat-head');
    if (!head || head.querySelector('.clear-chat')) return;

    const actions = document.createElement('div');
    actions.className = 'chat-head-actions';

    const grounded = head.querySelector('.grounded');
    if (grounded) actions.appendChild(grounded);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outline clear-chat';
    button.textContent = document.documentElement.lang === 'en' ? 'Clear chat' : 'مسح المحادثة';
    button.addEventListener('click', clearCurrentEmployeeChat);
    actions.appendChild(button);
    head.appendChild(actions);
  }

  let loginReloadPending = false;
  document.addEventListener('click', (event) => {
    const loginBtn = event.target.closest?.('#loginBtn');
    if (loginBtn && !loginReloadPending) {
      loginReloadPending = true;
      // app.js stores the selected employee first. Reload afterwards so the new account hydrates only its own history.
      setTimeout(() => window.location.reload(), 80);
      return;
    }

    if (event.target.closest?.('#sendQuestion, .quick-question, .field-option, .smart-fill, .restart-smart-form, .cancel-form')) {
      setTimeout(scrollChatToBottom, 0);
      setTimeout(scrollChatToBottom, 150);
      setTimeout(scrollChatToBottom, 700);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.target?.id === 'question' && event.key === 'Enter' && !event.shiftKey) {
      setTimeout(scrollChatToBottom, 0);
      setTimeout(scrollChatToBottom, 150);
      setTimeout(scrollChatToBottom, 700);
    }
  }, true);

  const observer = new MutationObserver(() => {
    ensureClearButton();
    scrollChatToBottom();
  });

  function boot() {
    ensureClearButton();
    scrollChatToBottom();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
