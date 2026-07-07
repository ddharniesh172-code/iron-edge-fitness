/* ============================================================
   IRON EDGE FITNESS — exercise-data.js
   Central exercise database used by workout.html, body-parts.html
   and exercise-details.html.

   NOTE: videoId fields are placeholders — swap in real YouTube
   video IDs for each exercise before going to production.
   Images use placehold.co as visual placeholders — replace
   with real exercise photography in /assets/images/exercises/.
   ============================================================ */

const EXERCISE_DATA = [

  /* ================= CHEST ================= */
  {
    id: "chest-barbell-bench-press",
    name: "Barbell Bench Press",
    bodyPart: "chest",
    category: "Strength Training",
    difficulty: "Intermediate",
    equipment: "Barbell",
    target: "Mid Chest",
    muscles: ["Pectoralis Major", "Triceps", "Anterior Deltoid"],
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    calories: 9,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Barbell+Bench+Press",
    videoId: "",
    description: "The king of pressing movements, the barbell bench press builds raw pushing strength and overall chest mass.",
    instructions: [
      "Lie flat on the bench with feet planted firmly on the floor.",
      "Grip the bar slightly wider than shoulder width.",
      "Unrack the bar and lower it slowly to your mid-chest.",
      "Press the bar back up until your arms are fully extended.",
      "Repeat for the prescribed reps, keeping your shoulder blades retracted."
    ],
    tips: [
      "Keep your wrists stacked directly over your elbows.",
      "Drive through your feet to stay tight on the bench.",
      "Don't bounce the bar off your chest."
    ]
  },
  {
    id: "chest-incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    bodyPart: "chest",
    category: "Strength Training",
    difficulty: "Intermediate",
    equipment: "Dumbbell",
    target: "Upper Chest",
    muscles: ["Upper Pectoralis", "Anterior Deltoid", "Triceps"],
    sets: 3,
    reps: "10-12",
    restSeconds: 75,
    calories: 8,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Incline+DB+Press",
    videoId: "",
    description: "Targets the upper chest fibers for a fuller, more balanced chest development.",
    instructions: [
      "Set an incline bench to 30-45 degrees.",
      "Hold a dumbbell in each hand at shoulder level.",
      "Press the dumbbells up until arms are extended.",
      "Lower under control back to the start position.",
      "Repeat without locking out elbows harshly."
    ],
    tips: [
      "Avoid setting the bench too steep or it becomes a shoulder press.",
      "Squeeze your chest at the top of every rep."
    ]
  },
  {
    id: "chest-pushup",
    name: "Push-Up",
    bodyPart: "chest",
    category: "Bodyweight Training",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    target: "Chest",
    muscles: ["Pectoralis Major", "Triceps", "Core"],
    sets: 3,
    reps: "12-20",
    restSeconds: 60,
    calories: 6,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Push-Up",
    videoId: "",
    description: "A foundational bodyweight movement that builds chest, shoulder and triceps strength anywhere.",
    instructions: [
      "Start in a high plank with hands under shoulders.",
      "Lower your body until your chest nearly touches the floor.",
      "Push back up to the starting position.",
      "Keep your core tight and body in a straight line throughout."
    ],
    tips: [
      "Don't let your hips sag.",
      "Elevate your feet to increase difficulty."
    ]
  },
  {
    id: "chest-cable-fly",
    name: "Cable Fly",
    bodyPart: "chest",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Cable",
    target: "Chest",
    muscles: ["Pectoralis Major"],
    sets: 3,
    reps: "12-15",
    restSeconds: 60,
    calories: 6,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Cable+Fly",
    videoId: "",
    description: "An isolation movement that keeps constant tension on the chest through the full range of motion.",
    instructions: [
      "Set cables to chest height and grab a handle in each hand.",
      "Step forward with a slight bend in the elbows.",
      "Bring your hands together in front of your chest in an arcing motion.",
      "Slowly return to the start, feeling a stretch across the chest."
    ],
    tips: [
      "Keep a slight, fixed bend in the elbows throughout.",
      "Focus on squeezing rather than using heavy weight."
    ]
  },

  /* ================= BACK ================= */
  {
    id: "back-deadlift",
    name: "Barbell Deadlift",
    bodyPart: "back",
    category: "Strength Training",
    difficulty: "Advanced",
    equipment: "Barbell",
    target: "Lower Back & Lats",
    muscles: ["Erector Spinae", "Glutes", "Hamstrings", "Traps"],
    sets: 4,
    reps: "5-6",
    restSeconds: 120,
    calories: 12,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Barbell+Deadlift",
    videoId: "",
    description: "The ultimate full posterior chain builder — develops back thickness, grip and total-body strength.",
    instructions: [
      "Stand with feet hip-width apart, bar over mid-foot.",
      "Hinge at the hips and grip the bar just outside your knees.",
      "Brace your core and drive through your heels to stand up.",
      "Lock out hips and knees at the top, then lower with control."
    ],
    tips: [
      "Keep the bar close to your shins throughout the lift.",
      "Never round your lower back under load."
    ]
  },
  {
    id: "back-pullup",
    name: "Pull-Up",
    bodyPart: "back",
    category: "Bodyweight Training",
    difficulty: "Intermediate",
    equipment: "Bodyweight",
    target: "Lats",
    muscles: ["Latissimus Dorsi", "Biceps", "Rear Deltoid"],
    sets: 4,
    reps: "6-10",
    restSeconds: 90,
    calories: 9,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Pull-Up",
    videoId: "",
    description: "A gold-standard bodyweight pull movement for building a wide, defined back.",
    instructions: [
      "Hang from a bar with an overhand grip, slightly wider than shoulders.",
      "Pull your chest up toward the bar by driving your elbows down.",
      "Pause briefly at the top, then lower under control to full extension."
    ],
    tips: [
      "Avoid kipping unless training specifically for it.",
      "Use a resistance band for assistance if needed."
    ]
  },
  {
    id: "back-bent-over-row",
    name: "Bent Over Barbell Row",
    bodyPart: "back",
    category: "Strength Training",
    difficulty: "Intermediate",
    equipment: "Barbell",
    target: "Mid Back",
    muscles: ["Latissimus Dorsi", "Rhomboids", "Traps"],
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    calories: 8,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Bent+Over+Row",
    videoId: "",
    description: "Builds back thickness and improves posture by targeting the mid-back musculature.",
    instructions: [
      "Hinge forward at the hips holding a barbell with an overhand grip.",
      "Keep a flat back and pull the bar toward your lower ribs.",
      "Squeeze your shoulder blades together at the top.",
      "Lower the bar under control back to the start."
    ],
    tips: [
      "Don't use momentum to heave the weight up.",
      "Keep your neck neutral, eyes toward the floor."
    ]
  },
  {
    id: "back-lat-pulldown",
    name: "Lat Pulldown",
    bodyPart: "back",
    category: "Machine",
    difficulty: "Beginner",
    equipment: "Machine",
    target: "Lats",
    muscles: ["Latissimus Dorsi", "Biceps"],
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    calories: 7,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Lat+Pulldown",
    videoId: "",
    description: "A machine-based alternative to pull-ups, great for building lat width for all experience levels.",
    instructions: [
      "Sit at the lat pulldown machine and grip the bar wider than shoulders.",
      "Pull the bar down to your upper chest, driving elbows down and back.",
      "Slowly return to the start position with control."
    ],
    tips: [
      "Avoid leaning back excessively to cheat the weight down.",
      "Focus on leading with your elbows, not your hands."
    ]
  },

  /* ================= SHOULDERS ================= */
  {
    id: "shoulders-overhead-press",
    name: "Standing Overhead Press",
    bodyPart: "shoulders",
    category: "Strength Training",
    difficulty: "Intermediate",
    equipment: "Barbell",
    target: "Front Deltoid",
    muscles: ["Anterior Deltoid", "Triceps", "Upper Chest"],
    sets: 4,
    reps: "6-8",
    restSeconds: 90,
    calories: 8,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Overhead+Press",
    videoId: "",
    description: "A foundational strength movement that builds powerful, well-rounded shoulders.",
    instructions: [
      "Stand with the bar racked at shoulder height, hands just outside shoulders.",
      "Brace your core and press the bar overhead until arms lock out.",
      "Lower the bar back to shoulder height with control."
    ],
    tips: [
      "Squeeze your glutes to avoid over-arching your back.",
      "Keep your wrists straight, not bent backward."
    ]
  },
  {
    id: "shoulders-lateral-raise",
    name: "Dumbbell Lateral Raise",
    bodyPart: "shoulders",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Dumbbell",
    target: "Side Deltoid",
    muscles: ["Lateral Deltoid"],
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Lateral+Raise",
    videoId: "",
    description: "Isolates the side delts for that coveted 3D shoulder width and cap.",
    instructions: [
      "Stand holding a dumbbell in each hand at your sides.",
      "Raise both arms out to the sides until roughly shoulder height.",
      "Lower slowly back to the starting position."
    ],
    tips: [
      "Use lighter weight and focus on form over load.",
      "Lead with your elbows, not your hands."
    ]
  },
  {
    id: "shoulders-face-pull",
    name: "Cable Face Pull",
    bodyPart: "shoulders",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Cable",
    target: "Rear Deltoid",
    muscles: ["Rear Deltoid", "Rotator Cuff", "Traps"],
    sets: 3,
    reps: "15-20",
    restSeconds: 45,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Face+Pull",
    videoId: "",
    description: "Essential for shoulder health and posture, strengthening the often-neglected rear delts.",
    instructions: [
      "Set a cable with a rope attachment to upper chest height.",
      "Pull the rope toward your face, splitting it around your ears.",
      "Squeeze your shoulder blades together at the peak.",
      "Return slowly to the start position."
    ],
    tips: [
      "Use a lighter weight — this is a technique-focused movement.",
      "Keep elbows high through the pull."
    ]
  },

  /* ================= BICEPS ================= */
  {
    id: "biceps-barbell-curl",
    name: "Barbell Curl",
    bodyPart: "biceps",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Barbell",
    target: "Biceps",
    muscles: ["Biceps Brachii", "Brachialis"],
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Barbell+Curl",
    videoId: "",
    description: "The classic mass-builder for bigger, stronger biceps.",
    instructions: [
      "Stand holding a barbell with an underhand, shoulder-width grip.",
      "Curl the bar up toward your chest, keeping elbows pinned to your sides.",
      "Squeeze at the top, then lower with control."
    ],
    tips: [
      "Avoid swinging your torso to generate momentum.",
      "Keep your elbows locked in place throughout."
    ]
  },
  {
    id: "biceps-hammer-curl",
    name: "Dumbbell Hammer Curl",
    bodyPart: "biceps",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Dumbbell",
    target: "Biceps & Forearms",
    muscles: ["Brachialis", "Brachioradialis", "Biceps"],
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Hammer+Curl",
    videoId: "",
    description: "Builds thickness in the biceps and forearms with a neutral grip.",
    instructions: [
      "Hold a dumbbell in each hand with palms facing your torso.",
      "Curl both dumbbells up while keeping your wrists neutral.",
      "Lower with control back to the starting position."
    ],
    tips: [
      "Keep your elbows stationary at your sides.",
      "Alternate arms if it helps maintain strict form."
    ]
  },
  {
    id: "biceps-concentration-curl",
    name: "Concentration Curl",
    bodyPart: "biceps",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Dumbbell",
    target: "Biceps Peak",
    muscles: ["Biceps Brachii"],
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    calories: 4,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Concentration+Curl",
    videoId: "",
    description: "A seated isolation curl that maximizes the mind-muscle connection for bicep peak.",
    instructions: [
      "Sit on a bench with legs spread, holding a dumbbell in one hand.",
      "Rest your elbow against your inner thigh.",
      "Curl the weight up toward your shoulder, then lower slowly."
    ],
    tips: [
      "Move slowly and avoid using momentum.",
      "Focus on squeezing hard at the top of the rep."
    ]
  },

  /* ================= TRICEPS ================= */
  {
    id: "triceps-pushdown",
    name: "Cable Triceps Pushdown",
    bodyPart: "triceps",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Cable",
    target: "Triceps",
    muscles: ["Triceps Brachii"],
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Triceps+Pushdown",
    videoId: "",
    description: "A staple isolation move for building triceps size and definition.",
    instructions: [
      "Attach a bar or rope to a high cable pulley.",
      "Keep elbows pinned to your sides and push the attachment down.",
      "Fully extend your arms, then return under control."
    ],
    tips: [
      "Don't let your elbows flare out to the sides.",
      "Avoid leaning your body forward to cheat the weight down."
    ]
  },
  {
    id: "triceps-skullcrusher",
    name: "Lying Triceps Extension",
    bodyPart: "triceps",
    category: "Isolation",
    difficulty: "Intermediate",
    equipment: "Barbell",
    target: "Triceps",
    muscles: ["Triceps Brachii"],
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    calories: 6,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Skullcrusher",
    videoId: "",
    description: "Also known as skullcrushers, this move heavily overloads all three heads of the triceps.",
    instructions: [
      "Lie on a bench holding a barbell or EZ-bar above your chest.",
      "Bend at the elbows, lowering the bar toward your forehead.",
      "Extend your arms back to the starting position."
    ],
    tips: [
      "Keep your upper arms stationary throughout the movement.",
      "Use a spotter when going heavy."
    ]
  },
  {
    id: "triceps-dips",
    name: "Triceps Dips",
    bodyPart: "triceps",
    category: "Bodyweight Training",
    difficulty: "Intermediate",
    equipment: "Bodyweight",
    target: "Triceps",
    muscles: ["Triceps Brachii", "Chest", "Anterior Deltoid"],
    sets: 3,
    reps: "8-12",
    restSeconds: 60,
    calories: 7,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Triceps+Dips",
    videoId: "",
    description: "A compound bodyweight movement that builds serious triceps and lower chest strength.",
    instructions: [
      "Support yourself on parallel bars with arms extended.",
      "Lower your body by bending your elbows until upper arms are parallel to the floor.",
      "Push back up to the starting position."
    ],
    tips: [
      "Keep your torso upright to bias the triceps over the chest.",
      "Don't let your shoulders shrug up toward your ears."
    ]
  },

  /* ================= FOREARMS ================= */
  {
    id: "forearms-wrist-curl",
    name: "Wrist Curl",
    bodyPart: "forearms",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Dumbbell",
    target: "Forearm Flexors",
    muscles: ["Wrist Flexors"],
    sets: 3,
    reps: "15-20",
    restSeconds: 30,
    calories: 3,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Wrist+Curl",
    videoId: "",
    description: "Builds forearm strength and grip endurance for better performance in all pulling exercises.",
    instructions: [
      "Sit and rest your forearms on your thighs, palms facing up, holding dumbbells.",
      "Lower the weight by extending your wrists downward.",
      "Curl your wrists back up to fully contract the forearms."
    ],
    tips: [
      "Use a light weight — forearms fatigue quickly.",
      "Move slowly through the full range of motion."
    ]
  },
  {
    id: "forearms-farmers-carry",
    name: "Farmer's Carry",
    bodyPart: "forearms",
    category: "Functional",
    difficulty: "Beginner",
    equipment: "Dumbbell",
    target: "Grip & Forearms",
    muscles: ["Forearm Flexors", "Traps", "Core"],
    sets: 3,
    reps: "30-45 sec",
    restSeconds: 60,
    calories: 8,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Farmer%27s+Carry",
    videoId: "",
    description: "A simple but brutally effective grip and total-body conditioning exercise.",
    instructions: [
      "Pick up a heavy dumbbell or kettlebell in each hand.",
      "Stand tall and walk for the prescribed distance or time.",
      "Keep your shoulders back and core braced throughout."
    ],
    tips: [
      "Don't let the weights swing as you walk.",
      "Go heavy — grip strength responds well to load."
    ]
  },

  /* ================= LEGS ================= */
  {
    id: "legs-barbell-squat",
    name: "Barbell Back Squat",
    bodyPart: "legs",
    category: "Strength Training",
    difficulty: "Intermediate",
    equipment: "Barbell",
    target: "Quadriceps",
    muscles: ["Quadriceps", "Glutes", "Hamstrings", "Core"],
    sets: 4,
    reps: "6-8",
    restSeconds: 120,
    calories: 11,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Barbell+Squat",
    videoId: "",
    description: "The king of leg exercises, building total lower-body strength and mass.",
    instructions: [
      "Position the bar on your upper back and stand with feet shoulder-width apart.",
      "Bend your knees and hips to lower into a squat until thighs are parallel to the floor.",
      "Drive through your heels to return to standing."
    ],
    tips: [
      "Keep your chest up and core braced throughout.",
      "Track your knees in line with your toes."
    ]
  },
  {
    id: "legs-lunge",
    name: "Walking Lunge",
    bodyPart: "legs",
    category: "Functional",
    difficulty: "Beginner",
    equipment: "Dumbbell",
    target: "Quadriceps & Glutes",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    sets: 3,
    reps: "12 per leg",
    restSeconds: 60,
    calories: 8,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Walking+Lunge",
    videoId: "",
    description: "A unilateral movement that builds leg strength while improving balance and coordination.",
    instructions: [
      "Hold a dumbbell in each hand and step forward into a lunge.",
      "Lower your back knee toward the floor, keeping your front knee over your ankle.",
      "Push through your front foot to step into the next lunge."
    ],
    tips: [
      "Keep your torso upright, avoid leaning forward.",
      "Take controlled, deliberate steps rather than rushing."
    ]
  },
  {
    id: "legs-leg-press",
    name: "Leg Press",
    bodyPart: "legs",
    category: "Machine",
    difficulty: "Beginner",
    equipment: "Machine",
    target: "Quadriceps",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    sets: 4,
    reps: "10-12",
    restSeconds: 90,
    calories: 9,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Leg+Press",
    videoId: "",
    description: "A machine-based squat alternative that allows safe overload of the legs.",
    instructions: [
      "Sit in the leg press machine with feet shoulder-width on the platform.",
      "Lower the platform by bending your knees toward your chest.",
      "Press through your heels to extend your legs without locking your knees."
    ],
    tips: [
      "Don't let your lower back round off the pad.",
      "Avoid fully locking out your knees at the top."
    ]
  },
  {
    id: "legs-romanian-deadlift",
    name: "Romanian Deadlift",
    bodyPart: "legs",
    category: "Strength Training",
    difficulty: "Intermediate",
    equipment: "Barbell",
    target: "Hamstrings",
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    calories: 9,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Romanian+Deadlift",
    videoId: "",
    description: "Targets the hamstrings and glutes through a hip-hinge pattern with a deep stretch.",
    instructions: [
      "Hold a barbell in front of your thighs with a shoulder-width grip.",
      "Push your hips back while lowering the bar down your legs.",
      "Keep a slight knee bend and flat back throughout.",
      "Drive your hips forward to return to standing."
    ],
    tips: [
      "Keep the bar close to your legs the entire movement.",
      "Stop the descent once you feel a deep hamstring stretch."
    ]
  },

  /* ================= CALVES ================= */
  {
    id: "calves-standing-raise",
    name: "Standing Calf Raise",
    bodyPart: "calves",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Machine",
    target: "Gastrocnemius",
    muscles: ["Gastrocnemius", "Soleus"],
    sets: 4,
    reps: "15-20",
    restSeconds: 45,
    calories: 4,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Standing+Calf+Raise",
    videoId: "",
    description: "Builds calf size and strength through a full range of ankle motion.",
    instructions: [
      "Stand on the edge of a calf raise platform with balls of your feet planted.",
      "Lower your heels below the platform for a deep stretch.",
      "Rise up onto your toes as high as possible, then lower with control."
    ],
    tips: [
      "Pause briefly at the top for maximum contraction.",
      "Use a full range of motion rather than small pulses."
    ]
  },
  {
    id: "calves-seated-raise",
    name: "Seated Calf Raise",
    bodyPart: "calves",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Machine",
    target: "Soleus",
    muscles: ["Soleus", "Gastrocnemius"],
    sets: 3,
    reps: "15-20",
    restSeconds: 45,
    calories: 4,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Seated+Calf+Raise",
    videoId: "",
    description: "With knees bent, this variation shifts emphasis onto the soleus muscle beneath the calf.",
    instructions: [
      "Sit at the machine with the pads resting on your lower thighs.",
      "Lower your heels for a full stretch.",
      "Press through the balls of your feet to raise your heels as high as possible."
    ],
    tips: [
      "Slow, controlled reps work better than fast bouncing.",
      "Squeeze hard at the top of every rep."
    ]
  },

  /* ================= GLUTES ================= */
  {
    id: "glutes-hip-thrust",
    name: "Barbell Hip Thrust",
    bodyPart: "glutes",
    category: "Strength Training",
    difficulty: "Intermediate",
    equipment: "Barbell",
    target: "Glutes",
    muscles: ["Gluteus Maximus", "Hamstrings"],
    sets: 4,
    reps: "8-12",
    restSeconds: 90,
    calories: 8,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Hip+Thrust",
    videoId: "",
    description: "The most effective exercise for maximizing glute activation and strength.",
    instructions: [
      "Sit on the ground with your upper back against a bench and a barbell over your hips.",
      "Drive through your heels to lift your hips until your torso is parallel to the floor.",
      "Squeeze your glutes hard at the top, then lower with control."
    ],
    tips: [
      "Keep your chin tucked to avoid overextending your neck.",
      "Pause and squeeze for a full second at the top of each rep."
    ]
  },
  {
    id: "glutes-glute-bridge",
    name: "Glute Bridge",
    bodyPart: "glutes",
    category: "Bodyweight Training",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    target: "Glutes",
    muscles: ["Gluteus Maximus", "Hamstrings", "Core"],
    sets: 3,
    reps: "15-20",
    restSeconds: 45,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Glute+Bridge",
    videoId: "",
    description: "A bodyweight-friendly starting point for building glute strength and activation.",
    instructions: [
      "Lie on your back with knees bent and feet flat on the floor.",
      "Drive through your heels to lift your hips toward the ceiling.",
      "Squeeze your glutes at the top, then lower back down."
    ],
    tips: [
      "Avoid arching your lower back excessively.",
      "Add a resistance band above the knees for extra activation."
    ]
  },
  {
    id: "glutes-cable-kickback",
    name: "Cable Glute Kickback",
    bodyPart: "glutes",
    category: "Isolation",
    difficulty: "Beginner",
    equipment: "Cable",
    target: "Glutes",
    muscles: ["Gluteus Maximus"],
    sets: 3,
    reps: "12-15 per leg",
    restSeconds: 45,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Cable+Kickback",
    videoId: "",
    description: "An isolation move providing constant glute tension throughout the kickback motion.",
    instructions: [
      "Attach an ankle strap to a low cable pulley and hook it around one ankle.",
      "Hold the machine for balance and kick your leg back and up.",
      "Squeeze your glute at the top, then return with control."
    ],
    tips: [
      "Avoid using your lower back to swing the leg.",
      "Keep the movement slow and controlled for maximum tension."
    ]
  },

  /* ================= ABS ================= */
  {
    id: "abs-plank",
    name: "Plank",
    bodyPart: "abs",
    category: "Bodyweight Training",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    target: "Core",
    muscles: ["Rectus Abdominis", "Transverse Abdominis", "Obliques"],
    sets: 3,
    reps: "30-60 sec",
    restSeconds: 45,
    calories: 4,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Plank",
    videoId: "",
    description: "A core stability staple that builds total-core endurance and strength.",
    instructions: [
      "Get into a forearm plank position with elbows under shoulders.",
      "Keep your body in a straight line from head to heels.",
      "Brace your core and hold the position for the prescribed time."
    ],
    tips: [
      "Don't let your hips sag or pike upward.",
      "Breathe steadily rather than holding your breath."
    ]
  },
  {
    id: "abs-hanging-leg-raise",
    name: "Hanging Leg Raise",
    bodyPart: "abs",
    category: "Bodyweight Training",
    difficulty: "Advanced",
    equipment: "Bodyweight",
    target: "Lower Abs",
    muscles: ["Rectus Abdominis", "Hip Flexors"],
    sets: 3,
    reps: "10-15",
    restSeconds: 60,
    calories: 6,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Hanging+Leg+Raise",
    videoId: "",
    description: "A challenging lower-ab focused movement performed hanging from a pull-up bar.",
    instructions: [
      "Hang from a pull-up bar with arms fully extended.",
      "Keeping your legs straight, raise them until parallel to the floor or higher.",
      "Lower slowly back to the starting hang position."
    ],
    tips: [
      "Avoid swinging — control the movement using your core.",
      "Bend your knees to regress the exercise if needed."
    ]
  },
  {
    id: "abs-cable-crunch",
    name: "Cable Crunch",
    bodyPart: "abs",
    category: "Isolation",
    difficulty: "Intermediate",
    equipment: "Cable",
    target: "Upper Abs",
    muscles: ["Rectus Abdominis"],
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    calories: 5,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Cable+Crunch",
    videoId: "",
    description: "Allows for progressive overload on the abs, unlike most bodyweight ab exercises.",
    instructions: [
      "Kneel below a high cable pulley holding a rope attachment behind your head.",
      "Crunch down, bringing your elbows toward your knees.",
      "Slowly return to the upright starting position."
    ],
    tips: [
      "Move through your spine, not your hips.",
      "Exhale forcefully at the bottom of each rep."
    ]
  },

  /* ================= CARDIO ================= */
  {
    id: "cardio-treadmill-run",
    name: "Treadmill Running",
    bodyPart: "cardio",
    category: "Cardio",
    difficulty: "Beginner",
    equipment: "Machine",
    target: "Cardiovascular System",
    muscles: ["Quadriceps", "Hamstrings", "Calves", "Heart"],
    sets: 1,
    reps: "20-30 min",
    restSeconds: 0,
    calories: 300,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Treadmill+Run",
    videoId: "",
    description: "A classic steady-state cardio session for improving endurance and burning calories.",
    instructions: [
      "Start with a 5-minute warm-up walk.",
      "Gradually increase pace to a comfortable running speed.",
      "Maintain steady pace for the target duration.",
      "Cool down with a 5-minute walk."
    ],
    tips: [
      "Land mid-foot rather than heel-striking hard.",
      "Keep a relaxed upper body and steady breathing rhythm."
    ]
  },
  {
    id: "cardio-jump-rope",
    name: "Jump Rope",
    bodyPart: "cardio",
    category: "Cardio",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    target: "Cardiovascular System",
    muscles: ["Calves", "Shoulders", "Core"],
    sets: 4,
    reps: "60 sec",
    restSeconds: 30,
    calories: 130,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Jump+Rope",
    videoId: "",
    description: "A high-efficiency cardio tool that also builds coordination and calf endurance.",
    instructions: [
      "Hold rope handles at hip height and swing the rope overhead.",
      "Jump just high enough for the rope to pass beneath your feet.",
      "Maintain a steady rhythm for the prescribed time."
    ],
    tips: [
      "Stay light on the balls of your feet.",
      "Keep jumps small and controlled to save energy."
    ]
  },
  {
    id: "cardio-burpees",
    name: "Burpees",
    bodyPart: "cardio",
    category: "Cardio",
    difficulty: "Advanced",
    equipment: "Bodyweight",
    target: "Full Body Conditioning",
    muscles: ["Chest", "Legs", "Core", "Shoulders"],
    sets: 4,
    reps: "10-15",
    restSeconds: 45,
    calories: 150,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Burpees",
    videoId: "",
    description: "A brutal full-body conditioning movement that torches calories and builds work capacity.",
    instructions: [
      "Start standing, then drop into a squat and place hands on the floor.",
      "Kick your feet back into a plank position.",
      "Perform a push-up, then jump your feet back to your hands.",
      "Explode upward into a jump with arms overhead."
    ],
    tips: [
      "Pace yourself — burpees fatigue quickly at high volume.",
      "Modify by stepping instead of jumping if needed."
    ]
  },
  {
    id: "cardio-rowing-machine",
    name: "Rowing Machine",
    bodyPart: "cardio",
    category: "Cardio",
    difficulty: "Intermediate",
    equipment: "Machine",
    target: "Cardiovascular System",
    muscles: ["Back", "Legs", "Core", "Arms"],
    sets: 1,
    reps: "15-20 min",
    restSeconds: 0,
    calories: 250,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Rowing+Machine",
    videoId: "",
    description: "A low-impact, full-body cardio option that builds endurance without joint stress.",
    instructions: [
      "Sit on the rower with feet strapped in and grip the handle.",
      "Drive with your legs first, then lean back and pull the handle to your torso.",
      "Reverse the motion smoothly to return to the start.",
      "Repeat in a consistent rhythm for the target duration."
    ],
    tips: [
      "Sequence the drive as legs, then back, then arms.",
      "Keep the return phase controlled, don't rush it."
    ]
  },

  /* ================= FULL BODY ================= */
  {
    id: "fullbody-kettlebell-swing",
    name: "Kettlebell Swing",
    bodyPart: "full-body",
    category: "Functional",
    difficulty: "Intermediate",
    equipment: "Kettlebell",
    target: "Posterior Chain",
    muscles: ["Glutes", "Hamstrings", "Core", "Shoulders"],
    sets: 4,
    reps: "15-20",
    restSeconds: 60,
    calories: 12,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Kettlebell+Swing",
    videoId: "",
    description: "An explosive hip-hinge movement that builds power, conditioning and posterior-chain strength together.",
    instructions: [
      "Stand with feet shoulder-width apart, kettlebell on the floor in front of you.",
      "Hinge at the hips to grip the kettlebell with both hands.",
      "Explosively drive your hips forward to swing the kettlebell to chest height.",
      "Let it swing back between your legs and repeat the motion."
    ],
    tips: [
      "Power comes from your hips, not your arms.",
      "Keep your back flat throughout the movement."
    ]
  },
  {
    id: "fullbody-clean-and-press",
    name: "Dumbbell Clean and Press",
    bodyPart: "full-body",
    category: "Functional",
    difficulty: "Advanced",
    equipment: "Dumbbell",
    target: "Full Body",
    muscles: ["Legs", "Shoulders", "Back", "Core"],
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    calories: 13,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Clean+and+Press",
    videoId: "",
    description: "A dynamic total-body movement combining a pull, a squat, and a press in one fluid motion.",
    instructions: [
      "Start with dumbbells at your sides in a slight squat.",
      "Explosively pull the dumbbells up to shoulder height, rotating your wrists.",
      "Dip slightly, then press the dumbbells overhead until arms are locked out.",
      "Lower back to shoulder height, then to the starting position."
    ],
    tips: [
      "Practice each portion of the lift separately before combining.",
      "Keep your core braced throughout the entire sequence."
    ]
  },
  {
    id: "fullbody-mountain-climbers",
    name: "Mountain Climbers",
    bodyPart: "full-body",
    category: "Functional",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    target: "Full Body Conditioning",
    muscles: ["Core", "Shoulders", "Legs"],
    sets: 3,
    reps: "30-40 sec",
    restSeconds: 30,
    calories: 9,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Mountain+Climbers",
    videoId: "",
    description: "A high-intensity conditioning move that elevates heart rate while engaging the entire core.",
    instructions: [
      "Start in a high plank position with hands under shoulders.",
      "Drive one knee toward your chest, then quickly switch legs.",
      "Continue alternating at a fast, controlled pace."
    ],
    tips: [
      "Keep your hips low and core braced throughout.",
      "Don't let your form break down as fatigue sets in."
    ]
  },
  {
    id: "fullbody-thruster",
    name: "Barbell Thruster",
    bodyPart: "full-body",
    category: "Functional",
    difficulty: "Advanced",
    equipment: "Barbell",
    target: "Full Body",
    muscles: ["Quadriceps", "Glutes", "Shoulders", "Core"],
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    calories: 13,
    image: "https://placehold.co/600x400/121214/ff6a00?text=Barbell+Thruster",
    videoId: "",
    description: "Combines a front squat with an overhead press for one of the most metabolically demanding lifts.",
    instructions: [
      "Hold a barbell in the front rack position with elbows up.",
      "Squat down until thighs are parallel to the floor.",
      "Drive up explosively, using the momentum to press the bar overhead.",
      "Lower the bar back to the rack position and repeat."
    ],
    tips: [
      "Use a lighter load than your squat or press alone.",
      "Keep your core tight to protect your lower back."
    ]
  }
];

/* Expose helper accessors */
const EXERCISE_BODY_PARTS = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "legs", "calves", "glutes", "abs", "cardio", "full-body"
];

function getExerciseById(id) {
  return EXERCISE_DATA.find(ex => ex.id === id) || null;
}

function getExercisesByBodyPart(bodyPart) {
  if (!bodyPart || bodyPart === "all") return EXERCISE_DATA;
  return EXERCISE_DATA.filter(ex => ex.bodyPart === bodyPart);
}

function getRelatedExercises(exercise, limit = 4) {
  if (!exercise) return [];
  return EXERCISE_DATA
    .filter(ex => ex.bodyPart === exercise.bodyPart && ex.id !== exercise.id)
    .slice(0, limit);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { EXERCISE_DATA, EXERCISE_BODY_PARTS, getExerciseById, getExercisesByBodyPart, getRelatedExercises };
}
