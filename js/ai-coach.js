/* ============================================================
   IRON EDGE FITNESS — ai-coach.js
   Chat interface for the AI Coach. Rule-based response engine
   (no external LLM API calls) that reasons over the person's
   own logged data: BMI/BMR (calc history), workout history,
   diet goal/history, and streaks — reusing the same logic as
   ai-recommendations.js where possible. Includes multi-thread
   chat history and a typing animation.
   ============================================================ */

(function () {
  "use strict";

  if (!document.getElementById("chatMessages")) return; // not on ai-coach.html

  /* ============================================================
     STORAGE
     ============================================================ */
  const LS_CHATS = "ie_ai_chats";

  function readLS(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("IronEdge AI Coach storage write error:", e); }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function getChats() { return readLS(LS_CHATS, []); }
  function saveChats(chats) {
    writeLS(LS_CHATS, chats);
    if (window.IronEdgeAiCoachFirebase && typeof window.IronEdgeAiCoachFirebase.saveChats === "function") {
      window.IronEdgeAiCoachFirebase.saveChats(chats);
    }
  }

  let activeChatId = null;

  function createNewChat() {
    const chats = getChats();
    const chat = {
      id: `chat-${Date.now()}`,
      title: "New Conversation",
      messages: [{
        role: "coach",
        text: "Hi! I'm your AI Coach. Ask me about your workouts, diet, BMI/BMR, or goals — I'll answer based on your own logged data.",
        date: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };
    chats.unshift(chat);
    saveChats(chats);
    activeChatId = chat.id;
    return chat;
  }

  function getActiveChat() {
    const chats = getChats();
    let chat = chats.find(c => c.id === activeChatId);
    if (!chat) {
      chat = chats[0] || createNewChat();
      activeChatId = chat.id;
    }
    return chat;
  }

  function updateActiveChat(mutatorFn) {
    const chats = getChats();
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;
    mutatorFn(chat);
    saveChats(chats);
  }

  /* ============================================================
     DATA GATHERING (shared with ai-recommendations.js patterns)
     ============================================================ */
  function getCalcHistory() { return readLS("ie_calc_history", []); }
  function getWorkoutHistory() { return readLS("ie_workout_history", []); }
  function getDietGoal() { return readLS("ie_diet_goal", { weightGoal: "maintain", calorieTarget: 2200, macroSplit: "balanced", waterGoalMl: 2000 }); }
  function getDietHistory() { return readLS("ie_diet_history", []); }

  function getLatestBmi() {
    const entry = getCalcHistory().find(h => h.type === "bmi");
    if (!entry) return null;
    const match = /([\d.]+)/.exec(entry.value);
    return match ? parseFloat(match[1]) : null;
  }
  function getLatestBmr() {
    const entry = getCalcHistory().find(h => h.type === "bmr");
    if (!entry) return null;
    const match = /(\d+)/.exec(entry.value);
    return match ? parseInt(match[1], 10) : null;
  }

  function computeWorkoutStreak() {
    const history = getWorkoutHistory();
    if (history.length === 0) return 0;
    const dates = [...new Set(history.map(h => h.date.slice(0, 10)))].sort().reverse();
    let streak = 0;
    let cursor = new Date();
    for (const d of dates) {
      const cursorStr = cursor.toISOString().slice(0, 10);
      if (d === cursorStr) { streak++; cursor.setDate(cursor.getDate() - 1); } else break;
    }
    return streak;
  }

  /* ============================================================
     SNAPSHOT SIDEBAR
     ============================================================ */
  function renderSnapshot() {
    const bmi = getLatestBmi();
    const bmr = getLatestBmr();
    const goal = getDietGoal();

    document.getElementById("snapshotBmi").textContent = bmi !== null ? bmi : "--";
    document.getElementById("snapshotBmr").textContent = bmr !== null ? bmr : "--";
    document.getElementById("snapshotStreak").textContent = computeWorkoutStreak();
    document.getElementById("snapshotGoal").textContent =
      goal.weightGoal === "lose" ? "Lose" : goal.weightGoal === "gain" ? "Gain" : "Maintain";
  }

  /* ============================================================
     RESPONSE ENGINE (rule-based, keyword intent matching)
     ============================================================ */
  function generateResponse(userText) {
    const text = userText.toLowerCase();

    const bmi = getLatestBmi();
    const bmr = getLatestBmr();
    const goal = getDietGoal();
    const workoutHistory = getWorkoutHistory();
    const streak = computeWorkoutStreak();

    // Greeting
    if (/^(hi|hello|hey|yo)\b/.test(text)) {
      return "Hey! Good to see you. Ask me about your workouts, diet, BMI/BMR, or your current goals — I'll base my answer on what you've actually logged.";
    }

    // BMI
    if (text.includes("bmi")) {
      if (bmi === null) {
        return "You haven't calculated your BMI yet. Head to the Calculators page, enter your height and weight, and I'll be able to analyze it here.";
      }
      let category = bmi < 18.5 ? "underweight" : bmi < 25 ? "in the normal range" : bmi < 30 ? "overweight" : "in the obese range";
      let advice = bmi < 18.5
        ? "Focus on a calorie surplus with enough protein to support muscle growth, alongside progressive strength training."
        : bmi < 25
          ? "You're in a healthy range — keep training consistently and eating to support your current goal."
          : "A modest calorie deficit combined with strength training and some cardio can help bring this down sustainably.";
      return `Your last calculated BMI is ${bmi}, which is ${category}. ${advice}`;
    }

    // BMR
    if (text.includes("bmr") || text.includes("metabolic rate")) {
      if (bmr === null) {
        return "You haven't calculated your BMR yet. Go to the Calculators page and I can reference it here once it's calculated.";
      }
      return `Your BMR is approximately ${bmr} kcal/day — that's what your body burns at complete rest. Your actual daily calorie needs (TDEE) will be higher once you factor in activity, which you can calculate on the Calculators page.`;
    }

    // Workout suggestion
    if (text.includes("workout") || text.includes("exercise") || text.includes("train")) {
      if (window.IronEdgeAI && typeof window.IronEdgeAI.getWorkoutSuggestion === "function") {
        const rec = window.IronEdgeAI.getWorkoutSuggestion();
        return rec.text;
      }
      return "Try to train each major muscle group at least once or twice a week, with progressive overload as your main driver of growth.";
    }

    // Diet suggestion
    if (text.includes("diet") || text.includes("food") || text.includes("eat") || text.includes("nutrition") || text.includes("meal")) {
      if (window.IronEdgeAI && typeof window.IronEdgeAI.getDietSuggestion === "function") {
        const rec = window.IronEdgeAI.getDietSuggestion();
        return rec.text;
      }
      return "Aim for a plate that's roughly balanced between protein, complex carbs, and vegetables at each meal.";
    }

    // Water
    if (text.includes("water") || text.includes("hydration") || text.includes("hydrate")) {
      const today = new Date().toISOString().slice(0, 10);
      const dietHistory = getDietHistory();
      const todayEntry = dietHistory.find(d => d.date === today);
      const consumed = todayEntry ? todayEntry.waterMl : 0;
      return `You're at ${consumed}ml of your ${goal.waterGoalMl || 2000}ml water goal today. ${consumed < (goal.waterGoalMl || 2000) * 0.5 ? "You're behind — try to get a few glasses in over the next couple hours." : "You're on track, keep sipping throughout the day."}`;
    }

    // Goal
    if (text.includes("goal")) {
      const goalLabel = goal.weightGoal === "lose" ? "losing weight" : goal.weightGoal === "gain" ? "gaining weight" : "maintaining your weight";
      return `Your current goal is ${goalLabel}, with a daily calorie target of ${goal.calorieTarget} kcal on a ${goal.macroSplit} macro split. You can adjust this any time on the Diet Planner page.`;
    }

    // Streak / motivation
    if (text.includes("streak") || text.includes("motivat") || text.includes("consisten")) {
      if (streak === 0) {
        return "You don't have an active streak right now — the best time to start a new one is today. Even a short session counts.";
      }
      return `You're on a ${streak}-day workout streak. Consistency compounds — keep showing up and the results follow.`;
    }

    // Progress / insight
    if (text.includes("progress") || text.includes("how am i doing") || text.includes("insight")) {
      if (window.IronEdgeAI && typeof window.IronEdgeAI.getPersonalizedInsight === "function") {
        return window.IronEdgeAI.getPersonalizedInsight({
          totalWorkouts: workoutHistory.length,
          workoutStreak: streak,
          waterGoalHitDays: getDietHistory().filter(d => d.waterMl >= (goal.waterGoalMl || 2000)).length,
          dietDaysLogged: getDietHistory().filter(d => d.calories > 0).length
        });
      }
      return "Keep logging your workouts and meals consistently — the more data you give me, the sharper my suggestions get.";
    }

    // Thanks
    if (text.includes("thank")) {
      return "Anytime! Let me know if you want more specific advice on your workouts, diet, or goals.";
    }

    // Fallback
    return "I can help with workout suggestions, diet recommendations, BMI/BMR analysis, water intake, and goal tracking — try asking about one of those, or tap a quick question on the left.";
  }

  /* ============================================================
     MESSAGE RENDERING
     ============================================================ */
  function timeLabel(isoDate) {
    return new Date(isoDate).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function buildMessageEl(msg) {
    const wrap = document.createElement("div");
    wrap.className = `ie-chat-msg ${msg.role === "user" ? "user" : "coach"}`;
    wrap.innerHTML = `
      <div class="ie-chat-msg-avatar"><i class="fa-solid fa-${msg.role === "user" ? "user" : "robot"}"></i></div>
      <div>
        <div class="ie-chat-bubble">${msg.text}</div>
        <div class="ie-chat-msg-time">${timeLabel(msg.date)}</div>
      </div>
    `;
    return wrap;
  }

  function renderMessages() {
    const container = document.getElementById("chatMessages");
    if (!container) return;
    const chat = getActiveChat();

    container.innerHTML = "";
    chat.messages.forEach(msg => container.appendChild(buildMessageEl(msg)));
    container.scrollTop = container.scrollHeight;
  }

  function showTypingIndicator() {
    const container = document.getElementById("chatMessages");
    const wrap = document.createElement("div");
    wrap.className = "ie-chat-msg coach";
    wrap.id = "typingIndicatorMsg";
    wrap.innerHTML = `
      <div class="ie-chat-msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="ie-typing-bubble">
        <span class="ie-typing-dot"></span><span class="ie-typing-dot"></span><span class="ie-typing-dot"></span>
      </div>
    `;
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById("typingIndicatorMsg");
    if (el) el.remove();
  }

  /* ============================================================
     SEND MESSAGE FLOW
     ============================================================ */
  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    updateActiveChat(chat => {
      chat.messages.push({ role: "user", text: trimmed, date: new Date().toISOString() });
      if (chat.title === "New Conversation") {
        chat.title = trimmed.length > 34 ? trimmed.slice(0, 34) + "…" : trimmed;
      }
    });
    renderMessages();
    renderChatHistoryList();

    const input = document.getElementById("chatInput");
    if (input) input.value = "";

    showTypingIndicator();
    const typingDelay = 700 + Math.random() * 700;

    setTimeout(() => {
      removeTypingIndicator();
      const responseText = generateResponse(trimmed);
      updateActiveChat(chat => {
        chat.messages.push({ role: "coach", text: responseText, date: new Date().toISOString() });
      });
      renderMessages();

      if (window.IronEdgeAiCoachFirebase && typeof window.IronEdgeAiCoachFirebase.logInteraction === "function") {
        window.IronEdgeAiCoachFirebase.logInteraction({ question: trimmed, answer: responseText, date: new Date().toISOString() });
      }
    }, typingDelay);
  }

  /* ============================================================
     QUICK PROMPTS
     ============================================================ */
  const QUICK_PROMPTS = [
    "What workout should I do today?",
    "What should I eat today?",
    "Analyze my BMI",
    "What's my BMR?",
    "How's my water intake?",
    "What's my current goal?",
    "How am I doing overall?"
  ];

  function renderQuickPrompts() {
    const wrap = document.getElementById("quickPrompts");
    if (!wrap) return;
    wrap.innerHTML = QUICK_PROMPTS.map(p => `<button class="ie-quick-prompt-btn" data-prompt="${p}">${p}</button>`).join("");
    wrap.querySelectorAll("[data-prompt]").forEach(btn => {
      btn.addEventListener("click", () => sendMessage(btn.dataset.prompt));
    });
  }

  /* ============================================================
     CHAT HISTORY SIDEBAR
     ============================================================ */
  function renderChatHistoryList() {
    const wrap = document.getElementById("chatHistoryList");
    if (!wrap) return;
    const chats = getChats();

    if (chats.length === 0) {
      wrap.innerHTML = `<p style="color:var(--ie-gray); font-size:0.78rem;">No past conversations yet.</p>`;
      return;
    }

    wrap.innerHTML = chats.map(c => `
      <div class="ie-chat-history-item ${c.id === activeChatId ? "active" : ""}" data-chat-id="${c.id}">
        ${c.title}
      </div>
    `).join("");

    wrap.querySelectorAll("[data-chat-id]").forEach(item => {
      item.addEventListener("click", () => {
        activeChatId = item.dataset.chatId;
        renderMessages();
        renderChatHistoryList();
      });
    });
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */
  function initChatInput() {
    const sendBtn = document.getElementById("chatSendBtn");
    const input = document.getElementById("chatInput");
    if (sendBtn) sendBtn.addEventListener("click", () => sendMessage(input.value));
    if (input) input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(input.value); });
  }

  function initNewChatButton() {
    const btn = document.getElementById("newChatBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const chat = createNewChat();
      activeChatId = chat.id;
      renderMessages();
      renderChatHistoryList();
      showToast("Started a new conversation");
    });
  }

  function initClearChatButton() {
    const btn = document.getElementById("clearChatBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (!confirm("Clear this conversation? This cannot be undone.")) return;
      updateActiveChat(chat => {
        chat.messages = [{
          role: "coach",
          text: "Conversation cleared. What would you like to ask?",
          date: new Date().toISOString()
        }];
        chat.title = "New Conversation";
      });
      renderMessages();
      renderChatHistoryList();
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    renderSnapshot();
    renderQuickPrompts();

    const chats = getChats();
    if (chats.length === 0) {
      const chat = createNewChat();
      activeChatId = chat.id;
    } else {
      activeChatId = chats[0].id;
    }

    renderMessages();
    renderChatHistoryList();

    initChatInput();
    initNewChatButton();
    initClearChatButton();
  });

  window.IronEdgeAiCoach = { sendMessage, generateResponse };
})();
