/* ============================================================
   IRON EDGE FITNESS — community-data.js
   Seed data for the community feed, suggested members, trainer
   directory (with slots + reviews), and notification templates.
   Used by community.js, trainer-booking.js and notifications.js.
   ============================================================ */

/* ============================================================
   SEED COMMUNITY POSTS
   ============================================================ */
const SEED_COMMUNITY_POSTS = [
  {
    id: "post-001",
    authorId: "user-arjun",
    authorName: "Arjun Mehta",
    authorHandle: "@arjun_lifts",
    text: "Hit a new deadlift PR today — 140kg for a clean single! Six months of consistent programming finally paying off. #deadlift #pr #ironedge",
    image: "https://placehold.co/700x420/121214/ff6a00?text=New+PR+140kg+Deadlift",
    likes: 42,
    comments: [
      { author: "Priya Sharma", text: "Beast mode! What's your next target?", date: daysAgoIso(1) },
      { author: "Rahul Verma", text: "Insane progress, congrats!", date: daysAgoIso(1) }
    ],
    timestamp: daysAgoIso(1)
  },
  {
    id: "post-002",
    authorId: "user-priya",
    authorName: "Priya Sharma",
    authorHandle: "@priya_fit",
    text: "3 months into my weight loss journey — down 8kg! The diet planner's macro tracking has been a game changer. Sticking to the plan even on busy days. #weightloss #transformation #consistency",
    image: "https://placehold.co/700x420/121214/ff6a00?text=8kg+Down+Progress",
    likes: 76,
    comments: [
      { author: "Arjun Mehta", text: "Incredible discipline, keep it up!", date: daysAgoIso(2) }
    ],
    timestamp: daysAgoIso(2)
  },
  {
    id: "post-003",
    authorId: "user-rahul",
    authorName: "Rahul Verma",
    authorHandle: "@rahul_strong",
    text: "Quick tip for anyone struggling with pull-ups: negative reps changed everything for me. Jump to the top, lower slowly for 5 seconds, repeat. Built the strength to get my first strict pull-up in 3 weeks. #pullups #calisthenics #tips",
    image: null,
    likes: 58,
    comments: [],
    timestamp: daysAgoIso(3)
  },
  {
    id: "post-004",
    authorId: "user-sneha",
    authorName: "Sneha Iyer",
    authorHandle: "@sneha_yoga",
    text: "Rest day reminder: recovery is part of the plan, not a break from it. Spent today on mobility work and foam rolling. Back at it tomorrow. #restday #recovery #mobility",
    image: "https://placehold.co/700x420/121214/ff6a00?text=Mobility+%26+Recovery",
    likes: 34,
    comments: [
      { author: "Priya Sharma", text: "Needed to hear this today, thank you!", date: daysAgoIso(4) }
    ],
    timestamp: daysAgoIso(4)
  },
  {
    id: "post-005",
    authorId: "user-vikram",
    authorName: "Vikram Nair",
    authorHandle: "@vikram_bulks",
    text: "Bulking update: up 4kg in 2 months, strength climbing every week on my main lifts. Eating in a surplus is harder than it sounds when you're not used to it! #bulking #strengthtraining #gains",
    image: null,
    likes: 29,
    comments: [],
    timestamp: daysAgoIso(5)
  },
  {
    id: "post-006",
    authorId: "user-arjun",
    authorName: "Arjun Mehta",
    authorHandle: "@arjun_lifts",
    text: "Booked my first session with a trainer through the app — online strength coaching starting this week. Excited to have some structure in my programming. #trainerbooking #strengthtraining",
    image: null,
    likes: 21,
    comments: [],
    timestamp: daysAgoIso(6)
  }
];

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/* ============================================================
   SUGGESTED MEMBERS
   ============================================================ */
const SEED_SUGGESTED_MEMBERS = [
  { id: "user-arjun", name: "Arjun Mehta", handle: "@arjun_lifts" },
  { id: "user-priya", name: "Priya Sharma", handle: "@priya_fit" },
  { id: "user-rahul", name: "Rahul Verma", handle: "@rahul_strong" },
  { id: "user-sneha", name: "Sneha Iyer", handle: "@sneha_yoga" },
  { id: "user-vikram", name: "Vikram Nair", handle: "@vikram_bulks" }
];

/* ============================================================
   TRENDING TAGS
   ============================================================ */
const SEED_TRENDING_TAGS = [
  "#deadlift", "#weightloss", "#transformation", "#pullups", "#restday",
  "#bulking", "#strengthtraining", "#consistency", "#mobility", "#pr"
];

/* ============================================================
   TRAINER DIRECTORY
   ============================================================ */
const TRAINER_TIME_SLOTS = ["06:00 AM", "07:00 AM", "08:00 AM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"];

function buildTrainerAvailability(bookedPattern = []) {
  // Generates availability for the next 5 days using the shared time slots.
  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    days.push({
      date: dateKey,
      label: i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      slots: TRAINER_TIME_SLOTS.map(time => ({
        time,
        booked: bookedPattern.includes(`${i}-${time}`)
      }))
    });
  }
  return days;
}

const TRAINERS_DATA = [
  {
    id: "trainer-001",
    name: "Coach Aditya Rao",
    specialty: "Strength Training",
    experienceYears: 8,
    certifications: "ACE-CPT, NASM-PES",
    mode: "both",
    pricePerSession: 800,
    rating: 4.9,
    reviewCount: 64,
    bio: "Former state-level powerlifter turned coach. Specializes in strength progressions for intermediate to advanced lifters, with a focus on safe technique under heavy load.",
    reviews: [
      { author: "Arjun Mehta", rating: 5, text: "Aditya completely fixed my squat depth issues in two sessions. Highly recommend.", date: daysAgoIso(10) },
      { author: "Vikram Nair", rating: 5, text: "Structured, no-nonsense programming. My numbers have gone up every month.", date: daysAgoIso(20) }
    ],
    availability: buildTrainerAvailability(["0-07:00 AM", "1-06:00 PM"])
  },
  {
    id: "trainer-002",
    name: "Coach Meera Nambiar",
    specialty: "Weight Loss",
    experienceYears: 6,
    certifications: "ACSM-CPT, Precision Nutrition L1",
    mode: "online",
    pricePerSession: 650,
    rating: 4.8,
    reviewCount: 51,
    bio: "Combines training and nutrition coaching for sustainable weight loss. Works well with busy professionals who need flexible online scheduling.",
    reviews: [
      { author: "Priya Sharma", rating: 5, text: "Meera's approach is realistic, not extreme. Lost 8kg without feeling deprived.", date: daysAgoIso(5) }
    ],
    availability: buildTrainerAvailability(["0-06:00 AM"])
  },
  {
    id: "trainer-003",
    name: "Coach Rohit Malhotra",
    specialty: "Bodybuilding",
    experienceYears: 10,
    certifications: "ISSA-CPT, IFBB Coach",
    mode: "offline",
    pricePerSession: 1000,
    rating: 4.7,
    reviewCount: 88,
    bio: "Competitive bodybuilder with a decade of coaching experience. Specializes in hypertrophy programming, posing, and contest prep.",
    reviews: [
      { author: "Vikram Nair", rating: 4, text: "Great eye for form cues, sessions are intense but effective.", date: daysAgoIso(15) }
    ],
    availability: buildTrainerAvailability([])
  },
  {
    id: "trainer-004",
    name: "Coach Ananya Das",
    specialty: "Yoga & Mobility",
    experienceYears: 7,
    certifications: "RYT-500, FMS Level 2",
    mode: "both",
    pricePerSession: 550,
    rating: 5.0,
    reviewCount: 39,
    bio: "Yoga instructor and mobility specialist. Helps lifters improve range of motion and recover from nagging joint stiffness.",
    reviews: [
      { author: "Sneha Iyer", rating: 5, text: "My shoulder mobility has never been better. Ananya is incredible.", date: daysAgoIso(8) }
    ],
    availability: buildTrainerAvailability(["2-05:00 PM"])
  },
  {
    id: "trainer-005",
    name: "Coach Karan Bedi",
    specialty: "Sports Performance",
    experienceYears: 9,
    certifications: "CSCS, USAW L1",
    mode: "offline",
    pricePerSession: 900,
    rating: 4.6,
    reviewCount: 47,
    bio: "Strength and conditioning coach working with amateur athletes on speed, power and explosiveness for their specific sport.",
    reviews: [],
    availability: buildTrainerAvailability(["1-07:00 PM"])
  },
  {
    id: "trainer-006",
    name: "Coach Neha Kapoor",
    specialty: "Nutrition Coaching",
    experienceYears: 5,
    certifications: "Precision Nutrition L2, RD",
    mode: "online",
    pricePerSession: 600,
    rating: 4.9,
    reviewCount: 33,
    bio: "Registered dietitian focused on building sustainable eating habits around Indian cuisine — no extreme diets, just practical macro coaching.",
    reviews: [
      { author: "Priya Sharma", rating: 5, text: "Finally a nutritionist who works with dal and rice instead of asking me to give it up.", date: daysAgoIso(12) }
    ],
    availability: buildTrainerAvailability([])
  }
];

/* ============================================================
   NOTIFICATION TEMPLATES
   Used by notifications.js to generate consistent messages.
   ============================================================ */
const NOTIFICATION_TEMPLATES = {
  membershipExpiry: (daysLeft) => ({
    type: "membership",
    icon: "fa-solid fa-shield-heart",
    title: daysLeft > 0 ? "Membership renewing soon" : "Membership expired",
    desc: daysLeft > 0
      ? `Your plan renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew early to avoid interruption.`
      : "Your membership has expired. Renew now to keep full access."
  }),
  workoutReminder: () => ({
    type: "workout",
    icon: "fa-solid fa-dumbbell",
    title: "Time to train",
    desc: "You haven't logged a workout today — even a short session keeps your streak alive."
  }),
  dietReminder: () => ({
    type: "diet",
    icon: "fa-solid fa-utensils",
    title: "Log your meals",
    desc: "You haven't logged any meals today. Keep your diet plan on track by adding what you've eaten."
  }),
  waterReminder: (currentMl, goalMl) => ({
    type: "water",
    icon: "fa-solid fa-droplet",
    title: "Stay hydrated",
    desc: `You're at ${currentMl}ml of your ${goalMl}ml water goal today. Grab a glass of water.`
  }),
  trainerBooking: (trainerName, time) => ({
    type: "booking",
    icon: "fa-solid fa-calendar-check",
    title: "Session confirmed",
    desc: `Your session with ${trainerName} is booked for ${time}.`
  }),
  bookingCancelled: (trainerName, time) => ({
    type: "booking",
    icon: "fa-solid fa-calendar-xmark",
    title: "Session cancelled",
    desc: `Your session with ${trainerName} at ${time} has been cancelled.`
  }),
  orderNotification: (orderSummary) => ({
    type: "order",
    icon: "fa-solid fa-bag-shopping",
    title: "Order update",
    desc: orderSummary
  }),
  newFollower: (name) => ({
    type: "social",
    icon: "fa-solid fa-user-plus",
    title: "New follower",
    desc: `${name} started following you.`
  }),
  postLiked: (name) => ({
    type: "social",
    icon: "fa-solid fa-heart",
    title: "New like",
    desc: `${name} liked your post.`
  }),
  postCommented: (name) => ({
    type: "social",
    icon: "fa-solid fa-comment",
    title: "New comment",
    desc: `${name} commented on your post.`
  })
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SEED_COMMUNITY_POSTS, SEED_SUGGESTED_MEMBERS, SEED_TRENDING_TAGS,
    TRAINERS_DATA, NOTIFICATION_TEMPLATES
  };
}
