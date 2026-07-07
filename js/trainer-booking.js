/* ============================================================
   IRON EDGE FITNESS — trainer-booking.js
   Handles: trainer listing + filters, trainer profile modal
   with day-tabbed slot picker, booking confirmation, cancel
   booking, upcoming sessions, and booking history.
   Expects TRAINERS_DATA (community-data.js) loaded first.
   ============================================================ */

(function () {
  "use strict";

  if (!document.getElementById("trainerGrid")) return; // not on trainer-booking.html

  const LS_BOOKINGS = "ie_trainer_bookings";

  function readLS(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("IronEdge Trainer Booking storage write error:", e); }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ============================================================
     BOOKINGS STATE
     ============================================================ */
  function getBookings() { return readLS(LS_BOOKINGS, []); }
  function saveBookings(bookings) {
    writeLS(LS_BOOKINGS, bookings);
    if (window.IronEdgeTrainerBookingFirebase && typeof window.IronEdgeTrainerBookingFirebase.saveBookings === "function") {
      window.IronEdgeTrainerBookingFirebase.saveBookings(bookings);
    }
  }

  function isSlotBookedByMe(trainerId, date, time) {
    return getBookings().some(b =>
      b.trainerId === trainerId && b.date === date && b.time === time && b.status !== "cancelled"
    );
  }

  /* ============================================================
     TRAINER GRID + FILTERS
     ============================================================ */
  let filters = { specialty: "all", mode: "all", minRating: 0 };

  function getFilteredTrainers() {
    return TRAINERS_DATA.filter(t => {
      const matchesSpecialty = filters.specialty === "all" || t.specialty === filters.specialty;
      const matchesMode = filters.mode === "all" || t.mode === filters.mode || t.mode === "both";
      const matchesRating = t.rating >= filters.minRating;
      return matchesSpecialty && matchesMode && matchesRating;
    });
  }

  function buildStarRating(rating) {
    const fullStars = Math.round(rating);
    let stars = "";
    for (let i = 0; i < 5; i++) {
      stars += `<i class="fa-${i < fullStars ? "solid" : "regular"} fa-star"></i>`;
    }
    return `${stars}<span>${rating.toFixed(1)}</span>`;
  }

  function buildTrainerCard(trainer) {
    const card = document.createElement("div");
    card.className = "ie-trainer-card glass-card";
    card.dataset.trainerId = trainer.id;

    const modeLabel = trainer.mode === "both" ? "Online & Offline" : trainer.mode === "online" ? "Online" : "Offline";
    const modeClass = trainer.mode === "offline" ? "offline" : "";

    card.innerHTML = `
      <div class="ie-avatar ie-avatar-lg"><i class="fa-solid fa-user-tie"></i></div>
      <h3 class="ie-trainer-name">${trainer.name}</h3>
      <p class="ie-trainer-specialty">${trainer.specialty}</p>
      <div class="ie-trainer-rating">${buildStarRating(trainer.rating)} <span>(${trainer.reviewCount})</span></div>
      <div class="ie-trainer-badges">
        <span class="ie-trainer-mode-badge ${modeClass}">${modeLabel}</span>
        <span class="ie-trainer-mode-badge" style="background:rgba(255,106,0,0.1); color:var(--ie-orange); border-color:rgba(255,106,0,0.3);">${trainer.experienceYears} yrs exp</span>
      </div>
      <div class="ie-trainer-price">&#8377;${trainer.pricePerSession} <small>/ session</small></div>
    `;
    card.addEventListener("click", () => openTrainerProfileModal(trainer.id));
    return card;
  }

  function renderTrainerGrid() {
    const grid = document.getElementById("trainerGrid");
    const noResults = document.getElementById("noTrainerResults");
    if (!grid) return;

    const filtered = getFilteredTrainers();
    grid.innerHTML = "";

    if (filtered.length === 0) {
      if (noResults) noResults.style.display = "flex";
      return;
    }
    if (noResults) noResults.style.display = "none";

    filtered.forEach(t => grid.appendChild(buildTrainerCard(t)));
  }

  function initFilters() {
    const specialtyFilter = document.getElementById("specialtyFilter");
    const modeFilter = document.getElementById("modeFilter");
    const ratingFilter = document.getElementById("ratingFilter");
    const resetBtn = document.getElementById("resetTrainerFiltersBtn");

    if (specialtyFilter) specialtyFilter.addEventListener("change", (e) => { filters.specialty = e.target.value; renderTrainerGrid(); });
    if (modeFilter) modeFilter.addEventListener("change", (e) => { filters.mode = e.target.value; renderTrainerGrid(); });
    if (ratingFilter) ratingFilter.addEventListener("change", (e) => { filters.minRating = Number(e.target.value); renderTrainerGrid(); });
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        filters = { specialty: "all", mode: "all", minRating: 0 };
        if (specialtyFilter) specialtyFilter.value = "all";
        if (modeFilter) modeFilter.value = "all";
        if (ratingFilter) ratingFilter.value = "0";
        renderTrainerGrid();
      });
    }
  }

  /* ============================================================
     TRAINER PROFILE MODAL + SLOT PICKER
     ============================================================ */
  let activeTrainer = null;
  let activeDayIndex = 0;
  let selectedSlot = null;

  function openTrainerProfileModal(trainerId) {
    const trainer = TRAINERS_DATA.find(t => t.id === trainerId);
    if (!trainer) return;

    activeTrainer = trainer;
    activeDayIndex = 0;
    selectedSlot = null;

    document.getElementById("trainerProfileName").textContent = trainer.name;
    document.getElementById("trainerProfileSpecialty").textContent = trainer.specialty;
    document.getElementById("trainerProfileRating").innerHTML = buildStarRating(trainer.rating) + ` <span>(${trainer.reviewCount} reviews)</span>`;
    document.getElementById("trainerProfileExperience").textContent = `${trainer.experienceYears} years experience`;
    document.getElementById("trainerProfileCerts").textContent = trainer.certifications;
    document.getElementById("trainerProfileMode").textContent = trainer.mode === "both" ? "Online & Offline" : trainer.mode.charAt(0).toUpperCase() + trainer.mode.slice(1);
    document.getElementById("trainerProfilePrice").textContent = `${trainer.pricePerSession} / session`;
    document.getElementById("trainerProfileBio").textContent = trainer.bio;

    renderSlotsDayTabs();
    renderSlotsGrid();
    renderTrainerReviews();
    resetConfirmButton();

    document.getElementById("trainerProfileModal").style.display = "flex";
  }

  function renderSlotsDayTabs() {
    const wrap = document.getElementById("slotsDayTabs");
    if (!wrap || !activeTrainer) return;

    wrap.innerHTML = activeTrainer.availability.map((day, i) => `
      <button class="ie-chip ${i === activeDayIndex ? "active" : ""}" data-day-index="${i}">${day.label}</button>
    `).join("");

    wrap.querySelectorAll("[data-day-index]").forEach(btn => {
      btn.addEventListener("click", () => {
        activeDayIndex = Number(btn.dataset.dayIndex);
        selectedSlot = null;
        wrap.querySelectorAll("[data-day-index]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderSlotsGrid();
        resetConfirmButton();
      });
    });
  }

  function renderSlotsGrid() {
    const wrap = document.getElementById("slotsGrid");
    if (!wrap || !activeTrainer) return;

    const day = activeTrainer.availability[activeDayIndex];
    wrap.innerHTML = day.slots.map(slot => {
      const bookedByMe = isSlotBookedByMe(activeTrainer.id, day.date, slot.time);
      const isBooked = slot.booked || bookedByMe;
      const isSelected = selectedSlot && selectedSlot.date === day.date && selectedSlot.time === slot.time;
      return `<button class="ie-slot-btn ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}"
                data-slot-time="${slot.time}" ${isBooked ? "disabled" : ""}>${slot.time}</button>`;
    }).join("");

    wrap.querySelectorAll("[data-slot-time]:not([disabled])").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSlot = { date: day.date, dateLabel: day.label, time: btn.dataset.slotTime };
        renderSlotsGrid();
        updateConfirmButton();
      });
    });
  }

  function resetConfirmButton() {
    const btn = document.getElementById("confirmBookingBtn");
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Select a Slot to Book`;
    btn.onclick = null;
  }

  function updateConfirmButton() {
    const btn = document.getElementById("confirmBookingBtn");
    if (!btn || !selectedSlot) return;
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Book ${selectedSlot.dateLabel} at ${selectedSlot.time}`;
    btn.onclick = confirmBooking;
  }

  function renderTrainerReviews() {
    const wrap = document.getElementById("trainerReviewsList");
    if (!wrap || !activeTrainer) return;

    if (activeTrainer.reviews.length === 0) {
      wrap.innerHTML = `<p style="color:var(--ie-gray); font-size:0.85rem;">No reviews yet — be the first to book and review this trainer.</p>`;
      return;
    }

    wrap.innerHTML = activeTrainer.reviews.map(r => `
      <div class="ie-review-item">
        <div class="ie-review-head">
          <span class="ie-review-author">${r.author}</span>
          <span class="ie-review-stars">${"<i class=\"fa-solid fa-star\"></i>".repeat(r.rating)}</span>
        </div>
        <p class="ie-review-text">${r.text}</p>
      </div>
    `).join("");
  }

  /* ============================================================
     CONFIRM BOOKING
     ============================================================ */
  function confirmBooking() {
    if (!activeTrainer || !selectedSlot) return;

    const booking = {
      id: `booking-${Date.now()}`,
      trainerId: activeTrainer.id,
      trainerName: activeTrainer.name,
      trainerSpecialty: activeTrainer.specialty,
      mode: activeTrainer.mode === "both" ? "online" : activeTrainer.mode,
      date: selectedSlot.date,
      dateLabel: selectedSlot.dateLabel,
      time: selectedSlot.time,
      price: activeTrainer.pricePerSession,
      status: "confirmed",
      bookedAt: new Date().toISOString()
    };

    const bookings = getBookings();
    bookings.unshift(booking);
    saveBookings(bookings);

    if (window.IronEdgeNotifications && typeof window.IronEdgeNotifications.notify === "function" && typeof NOTIFICATION_TEMPLATES !== "undefined") {
      window.IronEdgeNotifications.notify(NOTIFICATION_TEMPLATES.trainerBooking(activeTrainer.name, `${selectedSlot.dateLabel} at ${selectedSlot.time}`));
    }

    document.getElementById("trainerProfileModal").style.display = "none";
    document.getElementById("bookingConfirmSummary").textContent =
      `Your session with ${activeTrainer.name} is confirmed for ${selectedSlot.dateLabel} at ${selectedSlot.time}.`;
    document.getElementById("bookingConfirmModal").style.display = "flex";

    renderUpcomingBookings();
    renderBookingHistory();
    showToast("Session booked successfully");
  }

  /* ============================================================
     CANCEL BOOKING
     ============================================================ */
  function cancelBooking(bookingId) {
    if (!confirm("Cancel this session? This cannot be undone.")) return;

    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    booking.status = "cancelled";
    saveBookings(bookings);

    if (window.IronEdgeNotifications && typeof window.IronEdgeNotifications.notify === "function" && typeof NOTIFICATION_TEMPLATES !== "undefined") {
      window.IronEdgeNotifications.notify(NOTIFICATION_TEMPLATES.bookingCancelled(booking.trainerName, `${booking.dateLabel} at ${booking.time}`));
    }

    renderUpcomingBookings();
    renderBookingHistory();
    showToast("Session cancelled");
  }

  /* ============================================================
     BOOKING LISTS (Upcoming + History)
     ============================================================ */
  function buildBookingCard(booking, showCancel) {
    const card = document.createElement("div");
    card.className = "ie-booking-card glass-card";
    card.innerHTML = `
      <div class="ie-avatar"><i class="fa-solid fa-user-tie"></i></div>
      <div class="ie-booking-info">
        <div class="ie-booking-trainer-name">${booking.trainerName}</div>
        <div class="ie-booking-meta">${booking.trainerSpecialty} &middot; ${booking.dateLabel || booking.date} at ${booking.time} &middot; ${booking.mode === "online" ? "Online" : "In-Person"} &middot; &#8377;${booking.price}</div>
      </div>
      <span class="ie-booking-status ${booking.status}">${booking.status}</span>
      ${showCancel ? `<button class="ie-cancel-booking-btn" data-cancel-id="${booking.id}">Cancel</button>` : ""}
    `;
    if (showCancel) {
      card.querySelector("[data-cancel-id]").addEventListener("click", () => cancelBooking(booking.id));
    }
    return card;
  }

  function renderUpcomingBookings() {
    const list = document.getElementById("upcomingBookingsList");
    if (!list) return;
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = getBookings().filter(b => b.status === "confirmed" && b.date >= today);

    if (upcoming.length === 0) {
      list.innerHTML = `<p style="color:var(--ie-gray); font-size:0.85rem;">No upcoming sessions. Browse trainers to book one.</p>`;
      return;
    }
    list.innerHTML = "";
    upcoming.forEach(b => list.appendChild(buildBookingCard(b, true)));
  }

  function renderBookingHistory() {
    const list = document.getElementById("bookingHistoryList");
    if (!list) return;
    const bookings = [...getBookings()].sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

    if (bookings.length === 0) {
      list.innerHTML = `<p style="color:var(--ie-gray); font-size:0.85rem;">No bookings yet.</p>`;
      return;
    }
    list.innerHTML = "";
    bookings.forEach(b => list.appendChild(buildBookingCard(b, false)));
  }

  /* ============================================================
     TAB SWITCHING (Browse / Upcoming / History)
     ============================================================ */
  function initBookingTabs() {
    document.querySelectorAll("[data-booking-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-booking-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        ["browse", "upcoming", "history"].forEach(tab => {
          const panel = document.getElementById(`panel-${tab}`);
          if (panel) panel.style.display = tab === btn.dataset.bookingTab ? "block" : "none";
        });
      });
    });
  }

  function initModalClosers() {
    const trainerCloseBtn = document.getElementById("trainerProfileCloseBtn");
    const trainerModal = document.getElementById("trainerProfileModal");
    if (trainerCloseBtn && trainerModal) {
      trainerCloseBtn.addEventListener("click", () => trainerModal.style.display = "none");
      trainerModal.addEventListener("click", (e) => { if (e.target === trainerModal) trainerModal.style.display = "none"; });
    }

    const confirmCloseBtn = document.getElementById("bookingConfirmCloseBtn");
    const confirmModal = document.getElementById("bookingConfirmModal");
    if (confirmCloseBtn && confirmModal) {
      confirmCloseBtn.addEventListener("click", () => confirmModal.style.display = "none");
    }
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    renderTrainerGrid();
    renderUpcomingBookings();
    renderBookingHistory();
    initFilters();
    initBookingTabs();
    initModalClosers();
  });

  window.IronEdgeTrainerBooking = { getBookings, renderUpcomingBookings, renderBookingHistory };
})();
