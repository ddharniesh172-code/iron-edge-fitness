/* ============================================================
   IRON EDGE FITNESS — community.js
   Handles: feed rendering, create post (with image), likes,
   comments, share, follow/unfollow, user profiles, search and
   trending. Seeds from community-data.js on first load, then
   persists to LocalStorage (and Firestore via
   window.IronEdgeCommunityFirebase when available).
   ============================================================ */

(function () {
  "use strict";

  if (!document.getElementById("feedList")) return; // not on community.html

  /* ============================================================
     STORAGE KEYS
     ============================================================ */
  const LS_POSTS = "ie_community_posts";
  const LS_FOLLOWING = "ie_following";
  const LS_LIKED = "ie_liked_posts";
  const LS_PROFILE = "ie_social_profile";
  const POSTS_PER_PAGE = 6;

  function readLS(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("IronEdge Community storage write error:", e); }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }

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

  /* ============================================================
     MY PROFILE
     ============================================================ */
  function getMyProfile() {
    let displayName = "Athlete";
    try {
      if (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        displayName = firebase.auth().currentUser.displayName || firebase.auth().currentUser.email?.split("@")[0] || "Athlete";
      }
    } catch (e) { /* firebase not ready */ }

    const stored = readLS(LS_PROFILE, null);
    if (stored) return stored;

    const profile = {
      id: "user-me",
      name: displayName,
      handle: `@${displayName.toLowerCase().replace(/\s+/g, "_")}`
    };
    writeLS(LS_PROFILE, profile);
    return profile;
  }

  /* ============================================================
     POSTS STATE
     ============================================================ */
  function getPosts() {
    let posts = readLS(LS_POSTS, null);
    if (!posts) {
      posts = typeof SEED_COMMUNITY_POSTS !== "undefined" ? [...SEED_COMMUNITY_POSTS] : [];
      writeLS(LS_POSTS, posts);
    }
    return posts;
  }
  function savePosts(posts) { writeLS(LS_POSTS, posts); }

  function getFollowing() { return readLS(LS_FOLLOWING, []); }
  function saveFollowing(list) {
    writeLS(LS_FOLLOWING, list);
    if (window.IronEdgeCommunityFirebase && typeof window.IronEdgeCommunityFirebase.saveFollowing === "function") {
      window.IronEdgeCommunityFirebase.saveFollowing(list);
    }
  }

  function getLikedPosts() { return readLS(LS_LIKED, []); }
  function saveLikedPosts(list) { writeLS(LS_LIKED, list); }

  function toggleFollow(userId) {
    let following = getFollowing();
    const isFollowing = following.includes(userId);
    following = isFollowing ? following.filter(id => id !== userId) : [...following, userId];
    saveFollowing(following);
    return !isFollowing;
  }

  /* ============================================================
     CREATE POST
     ============================================================ */
  let pendingImageDataUrl = null;

  function initCreatePost() {
    const textArea = document.getElementById("newPostText");
    const imageInput = document.getElementById("postImageInput");
    const previewRow = document.getElementById("imagePreviewRow");
    const previewImg = document.getElementById("imagePreview");
    const removeImageBtn = document.getElementById("removeImageBtn");
    const submitBtn = document.getElementById("submitPostBtn");

    if (imageInput) {
      imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          pendingImageDataUrl = ev.target.result;
          previewImg.src = pendingImageDataUrl;
          previewRow.style.display = "inline-block";
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeImageBtn) {
      removeImageBtn.addEventListener("click", () => {
        pendingImageDataUrl = null;
        previewRow.style.display = "none";
        if (imageInput) imageInput.value = "";
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const text = textArea.value.trim();
        if (!text && !pendingImageDataUrl) {
          showToast("Write something or add a photo first");
          return;
        }

        const profile = getMyProfile();
        const newPost = {
          id: `post-${Date.now()}`,
          authorId: profile.id,
          authorName: profile.name,
          authorHandle: profile.handle,
          text,
          image: pendingImageDataUrl,
          likes: 0,
          comments: [],
          timestamp: new Date().toISOString()
        };

        const posts = getPosts();
        posts.unshift(newPost);
        savePosts(posts);

        if (window.IronEdgeCommunityFirebase && typeof window.IronEdgeCommunityFirebase.createPost === "function") {
          window.IronEdgeCommunityFirebase.createPost(newPost);
        }

        textArea.value = "";
        pendingImageDataUrl = null;
        previewRow.style.display = "none";
        if (imageInput) imageInput.value = "";

        currentPage = 1;
        renderFeed();
        renderProfileCard();
        showToast("Post shared!");
      });
    }
  }

  /* ============================================================
     HASHTAG HIGHLIGHTING
     ============================================================ */
  function highlightHashtags(text) {
    const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.replace(/#(\w+)/g, '<span class="ie-post-hashtag">#$1</span>');
  }

  /* ============================================================
     POST CARD RENDERING
     ============================================================ */
  function buildPostCard(post) {
    const myProfile = getMyProfile();
    const following = getFollowing();
    const liked = getLikedPosts().includes(post.id);
    const isMe = post.authorId === myProfile.id;

    const card = document.createElement("div");
    card.className = "ie-post-card glass-card";
    card.dataset.postId = post.id;

    card.innerHTML = `
      <div class="ie-post-header">
        <div class="ie-avatar" data-author-id="${post.authorId}" style="cursor:pointer;"><i class="fa-solid fa-user"></i></div>
        <div class="ie-post-author-info" data-author-id="${post.authorId}">
          <div class="ie-post-author-name">${post.authorName}</div>
          <div class="ie-post-time">${post.authorHandle} &middot; ${timeAgo(post.timestamp)}</div>
        </div>
        ${isMe ? "" : `<button class="ie-post-follow-btn ${following.includes(post.authorId) ? "following" : ""}" data-follow-id="${post.authorId}">
          ${following.includes(post.authorId) ? "Following" : "Follow"}
        </button>`}
      </div>
      <div class="ie-post-text">${highlightHashtags(post.text || "")}</div>
      ${post.image ? `<img src="${post.image}" class="ie-post-image" alt="Post image">` : ""}
      <div class="ie-post-actions">
        <button class="ie-post-action-btn ${liked ? "liked" : ""}" data-like-id="${post.id}">
          <i class="fa-${liked ? "solid" : "regular"} fa-heart"></i> <span data-like-count="${post.id}">${post.likes}</span>
        </button>
        <button class="ie-post-action-btn" data-comment-id="${post.id}">
          <i class="fa-regular fa-comment"></i> ${post.comments.length}
        </button>
        <button class="ie-post-action-btn" data-share-id="${post.id}">
          <i class="fa-solid fa-share-nodes"></i> Share
        </button>
      </div>
    `;
    return card;
  }

  function attachPostEvents(container) {
    container.querySelectorAll("[data-like-id]").forEach(btn => {
      btn.addEventListener("click", () => toggleLike(btn.dataset.likeId));
    });
    container.querySelectorAll("[data-comment-id]").forEach(btn => {
      btn.addEventListener("click", () => openCommentsModal(btn.dataset.commentId));
    });
    container.querySelectorAll("[data-share-id]").forEach(btn => {
      btn.addEventListener("click", () => openShareModal(btn.dataset.shareId));
    });
    container.querySelectorAll("[data-follow-id]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nowFollowing = toggleFollow(btn.dataset.followId);
        btn.classList.toggle("following", nowFollowing);
        btn.textContent = nowFollowing ? "Following" : "Follow";
        renderProfileCard();
        renderSuggestedMembers();
      });
    });
    container.querySelectorAll("[data-author-id]").forEach(el => {
      el.addEventListener("click", () => openUserProfileModal(el.dataset.authorId));
    });
  }

  function toggleLike(postId) {
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    let liked = getLikedPosts();
    const isLiked = liked.includes(postId);

    if (isLiked) {
      liked = liked.filter(id => id !== postId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      liked.push(postId);
      post.likes += 1;
    }
    saveLikedPosts(liked);
    savePosts(posts);

    if (window.IronEdgeCommunityFirebase && typeof window.IronEdgeCommunityFirebase.likePost === "function") {
      window.IronEdgeCommunityFirebase.likePost(postId, !isLiked);
    }

    // Update just this card in-place rather than a full re-render
    const btn = document.querySelector(`[data-like-id="${postId}"]`);
    const countEl = document.querySelector(`[data-like-count="${postId}"]`);
    if (btn) {
      btn.classList.toggle("liked", !isLiked);
      btn.querySelector("i").className = `fa-${!isLiked ? "solid" : "regular"} fa-heart`;
    }
    if (countEl) countEl.textContent = post.likes;
  }

  /* ============================================================
     FEED RENDERING (tabs + search + pagination)
     ============================================================ */
  let currentFeedTab = "latest";
  let currentPage = 1;
  let searchQuery = "";

  function getFilteredPosts() {
    let posts = [...getPosts()];
    const following = getFollowing();

    if (currentFeedTab === "trending") {
      posts.sort((a, b) => b.likes - a.likes);
    } else if (currentFeedTab === "following") {
      posts = posts.filter(p => following.includes(p.authorId));
    } else {
      posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        p.text.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.authorHandle.toLowerCase().includes(q)
      );
    }

    return posts;
  }

  function renderFeed() {
    const list = document.getElementById("feedList");
    if (!list) return;

    const filtered = getFilteredPosts();
    const loadMoreBtn = document.getElementById("loadMoreFeedBtn");

    if (filtered.length === 0) {
      list.innerHTML = `<div class="ie-no-results" style="display:flex;">
        <i class="fa-solid fa-magnifying-glass-minus"></i>
        <p>${currentFeedTab === "following" ? "You're not following anyone with posts yet." : "No posts match your search."}</p>
      </div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = "none";
      return;
    }

    const upperBound = currentPage * POSTS_PER_PAGE;
    const pageItems = filtered.slice(0, upperBound);

    list.innerHTML = "";
    pageItems.forEach(post => list.appendChild(buildPostCard(post)));
    attachPostEvents(list);

    if (loadMoreBtn) {
      loadMoreBtn.style.display = upperBound >= filtered.length ? "none" : "inline-block";
    }
  }

  /* ============================================================
     PROFILE CARD + SIDEBAR
     ============================================================ */
  function renderProfileCard() {
    const profile = getMyProfile();
    const posts = getPosts();
    const myPostCount = posts.filter(p => p.authorId === profile.id).length;
    const following = getFollowing();

    document.getElementById("myDisplayName").textContent = profile.name;
    document.getElementById("myHandle").textContent = profile.handle;
    document.getElementById("myPostCount").textContent = myPostCount;
    document.getElementById("myFollowingCount").textContent = following.length;
    // Follower count is simulated for demo purposes since there's no real social graph yet
    document.getElementById("myFollowerCount").textContent = Math.max(0, myPostCount * 3 + following.length);
  }

  function renderTrendingTags() {
    const wrap = document.getElementById("trendingTags");
    if (!wrap || typeof SEED_TRENDING_TAGS === "undefined") return;
    wrap.innerHTML = SEED_TRENDING_TAGS.map(tag => `<span class="ie-tag-pill" data-tag="${tag}">${tag}</span>`).join("");
    wrap.querySelectorAll("[data-tag]").forEach(pill => {
      pill.addEventListener("click", () => {
        const input = document.getElementById("communitySearchInput");
        input.value = pill.dataset.tag;
        searchQuery = pill.dataset.tag;
        currentPage = 1;
        renderFeed();
      });
    });
  }

  function renderSuggestedMembers() {
    const wrap = document.getElementById("suggestedMembers");
    if (!wrap || typeof SEED_SUGGESTED_MEMBERS === "undefined") return;
    const following = getFollowing();
    const suggestions = SEED_SUGGESTED_MEMBERS.filter(m => !following.includes(m.id)).slice(0, 4);

    if (suggestions.length === 0) {
      wrap.innerHTML = `<p style="color:var(--ie-gray); font-size:0.8rem;">You're following everyone suggested!</p>`;
      return;
    }

    wrap.innerHTML = suggestions.map(m => `
      <div class="ie-suggested-item">
        <div class="ie-avatar" data-author-id="${m.id}" style="cursor:pointer;"><i class="fa-solid fa-user"></i></div>
        <div class="ie-suggested-info" data-author-id="${m.id}" style="cursor:pointer;">
          <div class="ie-suggested-name">${m.name}</div>
          <div class="ie-suggested-handle">${m.handle}</div>
        </div>
        <button class="ie-follow-btn-sm" data-follow-id="${m.id}">Follow</button>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-follow-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        toggleFollow(btn.dataset.followId);
        renderSuggestedMembers();
        renderProfileCard();
        showToast("You're now following this member");
      });
    });
    wrap.querySelectorAll("[data-author-id]").forEach(el => {
      el.addEventListener("click", () => openUserProfileModal(el.dataset.authorId));
    });
  }

  /* ============================================================
     USER PROFILE MODAL
     ============================================================ */
  function openUserProfileModal(userId) {
    const posts = getPosts();
    const authoredPosts = posts.filter(p => p.authorId === userId);
    const sampleMember = (typeof SEED_SUGGESTED_MEMBERS !== "undefined" ? SEED_SUGGESTED_MEMBERS : []).find(m => m.id === userId);
    const myProfile = getMyProfile();

    const name = userId === myProfile.id ? myProfile.name : (authoredPosts[0]?.authorName || sampleMember?.name || "Member");
    const handle = userId === myProfile.id ? myProfile.handle : (authoredPosts[0]?.authorHandle || sampleMember?.handle || "@member");

    document.getElementById("profileModalName").textContent = name;
    document.getElementById("profileModalHandle").textContent = handle;

    const stats = document.getElementById("profileModalStats");
    const following = getFollowing();
    stats.innerHTML = `
      <div><span>${authoredPosts.length}</span><small>Posts</small></div>
      <div><span>${Math.max(0, authoredPosts.length * 3)}</span><small>Followers</small></div>
      <div><span>${following.length}</span><small>Following</small></div>
    `;

    const followBtn = document.getElementById("profileModalFollowBtn");
    if (userId === myProfile.id) {
      followBtn.style.display = "none";
    } else {
      followBtn.style.display = "inline-flex";
      const isFollowing = following.includes(userId);
      followBtn.textContent = isFollowing ? "Following" : "Follow";
      followBtn.classList.toggle("following", isFollowing);
      followBtn.onclick = () => {
        const nowFollowing = toggleFollow(userId);
        followBtn.textContent = nowFollowing ? "Following" : "Follow";
        followBtn.classList.toggle("following", nowFollowing);
        renderProfileCard();
        renderSuggestedMembers();
      };
    }

    const postsWrap = document.getElementById("profileModalPosts");
    postsWrap.innerHTML = "";
    authoredPosts.forEach(p => postsWrap.appendChild(buildPostCard(p)));
    attachPostEvents(postsWrap);

    document.getElementById("userProfileModal").style.display = "flex";
  }

  /* ============================================================
     COMMENTS MODAL
     ============================================================ */
  let activeCommentsPostId = null;

  function openCommentsModal(postId) {
    activeCommentsPostId = postId;
    renderComments();
    document.getElementById("commentsModal").style.display = "flex";
  }

  function renderComments() {
    const post = getPosts().find(p => p.id === activeCommentsPostId);
    const list = document.getElementById("commentsList");
    if (!post || !list) return;

    if (post.comments.length === 0) {
      list.innerHTML = `<p style="color:var(--ie-gray); font-size:0.85rem; text-align:center;">No comments yet. Be the first to comment!</p>`;
      return;
    }

    list.innerHTML = post.comments.map(c => `
      <div class="ie-comment-item">
        <div class="ie-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="ie-comment-bubble">
          <div class="ie-comment-author">${c.author}</div>
          <div class="ie-comment-text">${c.text}</div>
          <div class="ie-comment-time">${timeAgo(c.date)}</div>
        </div>
      </div>
    `).join("");
  }

  function submitComment() {
    const input = document.getElementById("newCommentInput");
    const text = input.value.trim();
    if (!text || !activeCommentsPostId) return;

    const posts = getPosts();
    const post = posts.find(p => p.id === activeCommentsPostId);
    if (!post) return;

    const profile = getMyProfile();
    post.comments.push({ author: profile.name, text, date: new Date().toISOString() });
    savePosts(posts);

    if (window.IronEdgeCommunityFirebase && typeof window.IronEdgeCommunityFirebase.addComment === "function") {
      window.IronEdgeCommunityFirebase.addComment(activeCommentsPostId, { author: profile.name, text });
    }

    input.value = "";
    renderComments();
    renderFeed();
  }

  /* ============================================================
     SHARE MODAL
     ============================================================ */
  function openShareModal(postId) {
    const link = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    document.getElementById("shareLinkInput").value = link;
    document.getElementById("shareModal").style.display = "flex";
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */
  function initFeedTabs() {
    document.querySelectorAll("[data-feed-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-feed-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFeedTab = btn.dataset.feedTab;
        currentPage = 1;
        renderFeed();
      });
    });
  }

  function initSearch() {
    const input = document.getElementById("communitySearchInput");
    if (!input) return;
    input.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      renderFeed();
    });
  }

  function initModals() {
    const closeMap = [
      ["userProfileCloseBtn", "userProfileModal"],
      ["commentsCloseBtn", "commentsModal"],
      ["shareCloseBtn", "shareModal"]
    ];
    closeMap.forEach(([btnId, modalId]) => {
      const btn = document.getElementById(btnId);
      const modal = document.getElementById(modalId);
      if (btn && modal) {
        btn.addEventListener("click", () => modal.style.display = "none");
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
      }
    });

    const submitCommentBtn = document.getElementById("submitCommentBtn");
    if (submitCommentBtn) submitCommentBtn.addEventListener("click", submitComment);

    const commentInput = document.getElementById("newCommentInput");
    if (commentInput) {
      commentInput.addEventListener("keypress", (e) => { if (e.key === "Enter") submitComment(); });
    }

    const copyShareLinkBtn = document.getElementById("copyShareLinkBtn");
    if (copyShareLinkBtn) {
      copyShareLinkBtn.addEventListener("click", () => {
        const input = document.getElementById("shareLinkInput");
        input.select();
        navigator.clipboard?.writeText(input.value).then(() => showToast("Link copied to clipboard"));
      });
    }
  }

  function initLoadMore() {
    const btn = document.getElementById("loadMoreFeedBtn");
    if (btn) btn.addEventListener("click", () => { currentPage++; renderFeed(); });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    renderProfileCard();
    renderTrendingTags();
    renderSuggestedMembers();
    renderFeed();

    initCreatePost();
    initFeedTabs();
    initSearch();
    initModals();
    initLoadMore();
  });

  window.IronEdgeCommunity = { renderFeed, getPosts, getMyProfile };
})();
