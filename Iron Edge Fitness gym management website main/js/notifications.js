/* ============================================================
   IRON EDGE FITNESS — notifications.js
   In-app Notification Center: generates reminder notifications
   (membership, workout, diet, water), renders the bell/panel,
   mark-as-read, and notification history. Exposes
   window.IronEdgeNotifications.notify() so other modules
   (trainer-booking.js, community.js, shop/order flows) can push
   notifications into the same center.

   Firebase Cloud Messaging hook is wired but inert until a real
   VAPID key + service worker are configured — see initFcm().
   ============================================================ */

(function () {
  "use strict";

  const LS_NOTIFICATIONS = "ie_notifications";
  const LS_LAST_REMINDER_CHECK = "ie_last_reminder_check";
  const MAX_NOTIFICATIONS = 60;

  function readLS(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("IronEdge Notifications storage write error:", e); }
  }

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  /* ============================================================
     NOTIFICATION STATE
     ============================================================ */
  function getNotifications() { return readLS(LS_NOTIFICATIONS, []); }

  function saveNotifications(list) {
    writeLS(LS_NOTIFICATIONS, list.slice(0, MAX_NOTIFICATIONS));
    if (window.IronEdgeNotificationsFirebase && typeof window.IronEdgeNotificationsFirebase.saveNotifications === "function") {
      window.IronEdgeNotificationsFirebase.saveNotifications(list.slice(0, MAX_NOTIFICATIONS));
    }
    renderBellState();
  }

  /**
   * Push a new notification into the center. `template` should be one of
   * the objects returned by NOTIFICATION_TEMPLATES.* (community-data.js).
   */
  function notify(template) {
    if (!template) return;
    const list = getNotifications();

    // Avoid stacking duplicate reminders of the same type within the same day
    const isDuplicateToday = list.some(n =>
      n.type === template.type && n.title === template.title && n.date.slice(0, 10) === todayKey()
    );
    if (isDuplicateToday) return;

    list.unshift({
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...template,
      read: false,
      date: new Date().toISOString()
    });
    saveNotifications(list);
    renderNotifPanel();
    maybeShowBrowserNotification(template);
  }

  function markAllRead() {
    const list = getNotifications().map(n => ({ ...n, read: true }));
    saveNotifications(list);
    renderNotifPanel();
  }

  function markRead(id) {
    const list = getNotifications();
    const item = list.find(n => n.id === id);
    if (item) item.read = true;
    saveNotifications(list);
    renderNotifPanel();
  }

  /* ============================================================
     REMINDER GENERATION
     Runs once per page load per day — checks membership expiry,
     workout/diet/water status and generates reminders as needed.
     ============================================================ */
  function runDailyReminderCheck() {
    const lastCheck = readLS(LS_LAST_REMINDER_CHECK, null);
    if (lastCheck === todayKey()) return; // already checked today
    writeLS(LS_LAST_REMINDER_CHECK, todayKey());

    if (typeof NOTIFICATION_TEMPLATES === "undefined") return;

    // Membership expiry
    try {
      const membership = readLS("ie_membership", null);
      if (membership) {
        const daysLeft = Math.ceil((new Date(membership.expiryDate).getTime() - Date.now()) / 86400000);
        if (daysLeft <= 7) notify(NOTIFICATION_TEMPLATES.membershipExpiry(daysLeft));
      }
    } catch (e) { /* ignore */ }

    // Workout reminder — only if nothing logged yet today, checked in the evening-ish (after page load)
    try {
      const workoutHistory = readLS("ie_workout_history", []);
      const workedOutToday = workoutHistory.some(w => w.date.slice(0, 10) === todayKey());
      if (!workedOutToday) notify(NOTIFICATION_TEMPLATES.workoutReminder());
    } catch (e) { /* ignore */ }

    // Diet reminder
    try {
      const dietHistory = readLS("ie_diet_history", []);
      const loggedToday = dietHistory.some(d => d.date === todayKey() && d.calories > 0);
      if (!loggedToday) notify(NOTIFICATION_TEMPLATES.dietReminder());
    } catch (e) { /* ignore */ }

    // Water reminder
    try {
      const goal = readLS("ie_diet_goal", { waterGoalMl: 2000 });
      const water = readLS(`ie_diet_water_${todayKey()}`, { ml: 0 });
      if (water.ml < (goal.waterGoalMl || 2000) * 0.5) {
        notify(NOTIFICATION_TEMPLATES.waterReminder(water.ml, goal.waterGoalMl || 2000));
      }
    } catch (e) { /* ignore */ }
  }

  /* ============================================================
     BELL + PANEL RENDERING
     ============================================================ */
  function timeAgo(isoDate) {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function renderBellState() {
    const dot = document.getElementById("notifDot");
    if (!dot) return;
    const hasUnread = getNotifications().some(n => !n.read);
    dot.style.display = hasUnread ? "block" : "none";
  }

  function renderNotifPanel() {
    const list = document.getElementById("notifList");
    if (!list) return;

    const notifications = getNotifications();
    if (notifications.length === 0) {
      list.innerHTML = `<div class="ie-notif-empty">You're all caught up — no notifications yet.</div>`;
      renderBellState();
      return;
    }

    list.innerHTML = notifications.map(n => `
      <div class="ie-notif-item ${n.read ? "" : "unread"}" data-notif-id="${n.id}">
        <div class="ie-notif-icon"><i class="${n.icon || "fa-solid fa-bell"}"></i></div>
        <div class="ie-notif-body">
          <div class="ie-notif-title">${n.title}</div>
          <div class="ie-notif-desc">${n.desc}</div>
          <div class="ie-notif-time">${timeAgo(n.date)}</div>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-notif-id]").forEach(item => {
      item.addEventListener("click", () => markRead(item.dataset.notifId));
    });

    renderBellState();
  }

  function initBellToggle() {
    const bellBtn = document.getElementById("notifBellBtn");
    const panel = document.getElementById("notifPanel");
    if (!bellBtn || !panel) return;

    bellBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = panel.style.display === "flex" || panel.style.display === "block";
      panel.style.display = isOpen ? "none" : "flex";
      panel.style.flexDirection = "column";
      if (!isOpen) renderNotifPanel();
    });

    document.addEventListener("click", (e) => {
      if (panel.style.display !== "none" && !panel.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
        panel.style.display = "none";
      }
    });

    const markAllReadBtn = document.getElementById("markAllReadBtn");
    if (markAllReadBtn) markAllReadBtn.addEventListener("click", markAllRead);
  }

  /* ============================================================
     BROWSER PUSH NOTIFICATION (best-effort, permission gated)
     ============================================================ */
  function maybeShowBrowserNotification(template) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      try {
        new Notification(template.title, { body: template.desc, icon: "/assets/images/icon-192.png" });
      } catch (e) { /* ignore unsupported contexts */ }
    }
  }

  function requestBrowserPermission() {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  /* ============================================================
     FIREBASE CLOUD MESSAGING (ready, inert until configured)
     Requires a real VAPID key and a registered service worker
     (firebase-messaging-sw.js) to actually receive push messages.
     This just wires the plumbing so it's a drop-in once ready.
     ============================================================ */
  function initFcm() {
    try {
      if (typeof firebase === "undefined" || !firebase.messaging || !firebase.apps.length) return;
      const messaging = firebase.messaging();

      // Replace with your real VAPID key from Firebase Console > Cloud Messaging
      const VAPID_KEY = "";
      if (!VAPID_KEY) {
        console.info("IronEdge FCM: VAPID key not set — push notifications via FCM are inert until configured.");
        return;
      }

      messaging.getToken({ vapidKey: VAPID_KEY }).then(token => {
        if (token && window.IronEdgeNotificationsFirebase && typeof window.IronEdgeNotificationsFirebase.saveFcmToken === "function") {
          window.IronEdgeNotificationsFirebase.saveFcmToken(token);
        }
      }).catch(err => console.warn("IronEdge FCM: getToken failed —", err.message));

      messaging.onMessage(payload => {
        const title = payload.notification?.title || "Iron Edge Fitness";
        const body = payload.notification?.body || "";
        notify({ type: "push", icon: "fa-solid fa-bell", title, desc: body });
      });
    } catch (e) {
      console.warn("IronEdge FCM: init skipped —", e.message);
    }
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    initBellToggle();
    renderBellState();
    runDailyReminderCheck();
    renderNotifPanel();
    requestBrowserPermission();
    initFcm();
  });

  window.IronEdgeNotifications = {
    notify,
    markAllRead,
    markRead,
    getNotifications
  };
})();
