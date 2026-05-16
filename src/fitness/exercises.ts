/**
 * Hand-curated exercise database — 60+ exercises across all main movement
 * patterns + equipment tiers. Bilingual (ID/EN), with Indonesian form cues.
 *
 * Konteks: pengguna Indonesia rata-rata gak punya gym lengkap. Bias ke
 * bodyweight + dumbbell + resistance band. Barbell exercises tetap ada
 * untuk yang akses gym, tapi gak dominasi default pool.
 *
 * Konvensi kode: <equip>_<category>_<num>
 *   BW = bodyweight, DB = dumbbell, BB = barbell, KB = kettlebell,
 *   RB = resistance band, CD = cardio, MB = mobility
 */

export type ExerciseCategory =
  | "push" // chest/shoulder/tricep dominant
  | "pull" // back/bicep dominant
  | "squat" // quad/glute dominant
  | "hinge" // posterior chain (hamstring/glute/lower back)
  | "lunge" // unilateral leg
  | "core" // abs/obliques/lower back
  | "carry" // loaded carry (farmer walk, suitcase)
  | "cardio" // conditioning
  | "mobility" // flexibility/joint health
  | "explosive"; // power/plyometric

export type Equipment =
  | "bodyweight"
  | "dumbbell"
  | "barbell"
  | "kettlebell"
  | "resistance_band"
  | "machine"
  | "pullup_bar"
  | "bench"
  | "cardio_equipment"
  | "none";

export type Level = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  code: string;
  name_id: string;
  name_en: string;
  category: ExerciseCategory;
  muscle_primary: string[]; // ['dada', 'tricep']
  muscle_secondary?: string[];
  equipment: Equipment[];
  level: Level;
  unilateral?: boolean; // gerakan satu sisi
  notes_id?: string; // form cue Indonesia
}

export const EXERCISES: Exercise[] = [
  // ========== BODYWEIGHT PUSH ==========
  {
    code: "BW_PUSH_01",
    name_id: "Push-up standar",
    name_en: "Push-up",
    category: "push",
    muscle_primary: ["dada", "tricep"],
    muscle_secondary: ["bahu depan", "core"],
    equipment: ["bodyweight", "none"],
    level: "beginner",
    notes_id: "Tubuh lurus, tangan selebar bahu, turun sampai dada hampir lantai. Jangan turun pinggul/punggung.",
  },
  {
    code: "BW_PUSH_02",
    name_id: "Push-up incline",
    name_en: "Incline push-up",
    category: "push",
    muscle_primary: ["dada bawah", "tricep"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Tangan di bangku/meja tinggi. Lebih mudah dari push-up standar. Cocok pemula.",
  },
  {
    code: "BW_PUSH_03",
    name_id: "Push-up decline",
    name_en: "Decline push-up",
    category: "push",
    muscle_primary: ["dada atas", "bahu depan"],
    equipment: ["bodyweight", "bench"],
    level: "intermediate",
    notes_id: "Kaki di bangku, tangan di lantai. Lebih berat dari standar, dada atas lebih kena.",
  },
  {
    code: "BW_PUSH_04",
    name_id: "Diamond push-up",
    name_en: "Diamond push-up",
    category: "push",
    muscle_primary: ["tricep", "dada dalam"],
    equipment: ["bodyweight"],
    level: "intermediate",
    notes_id: "Telapak tangan rapat membentuk berlian. Tricep dominan.",
  },
  {
    code: "BW_PUSH_05",
    name_id: "Pike push-up",
    name_en: "Pike push-up",
    category: "push",
    muscle_primary: ["bahu", "tricep"],
    equipment: ["bodyweight"],
    level: "intermediate",
    notes_id: "Pinggul terangkat (downward dog), turunkan kepala. Mimic OHP pakai berat badan.",
  },
  {
    code: "BW_PUSH_06",
    name_id: "Dip (kursi)",
    name_en: "Bench/chair dip",
    category: "push",
    muscle_primary: ["tricep", "dada bawah"],
    equipment: ["bench"],
    level: "beginner",
    notes_id: "Pakai kursi/bangku stabil. Siku lurus belakang, jangan flare ke samping.",
  },

  // ========== BODYWEIGHT PULL ==========
  {
    code: "BW_PULL_01",
    name_id: "Pull-up",
    name_en: "Pull-up",
    category: "pull",
    muscle_primary: ["latissimus", "bicep"],
    muscle_secondary: ["punggung tengah", "core"],
    equipment: ["pullup_bar"],
    level: "intermediate",
    notes_id: "Grip overhand (pronasi), bahu turun, tarik dada ke bar. Hindari menggoyang badan.",
  },
  {
    code: "BW_PULL_02",
    name_id: "Chin-up",
    name_en: "Chin-up",
    category: "pull",
    muscle_primary: ["bicep", "latissimus"],
    equipment: ["pullup_bar"],
    level: "intermediate",
    notes_id: "Grip underhand (supinasi). Lebih bicep dominan dari pull-up.",
  },
  {
    code: "BW_PULL_03",
    name_id: "Inverted row (under meja/bar rendah)",
    name_en: "Inverted row",
    category: "pull",
    muscle_primary: ["punggung tengah", "bicep"],
    equipment: ["bodyweight", "pullup_bar"],
    level: "beginner",
    notes_id: "Pakai bar rendah / meja kuat. Badan lurus, tarik dada ke bar. Pengganti pull-up untuk pemula.",
  },
  {
    code: "BW_PULL_04",
    name_id: "Negative pull-up",
    name_en: "Negative pull-up",
    category: "pull",
    muscle_primary: ["latissimus", "bicep"],
    equipment: ["pullup_bar"],
    level: "beginner",
    notes_id: "Mulai di posisi atas (lompat/box), turunkan badan 3-5 detik. Bangun strength menuju pull-up penuh.",
  },

  // ========== BODYWEIGHT SQUAT/HINGE ==========
  {
    code: "BW_SQT_01",
    name_id: "Squat bodyweight",
    name_en: "Bodyweight squat",
    category: "squat",
    muscle_primary: ["quadrisep", "glute"],
    muscle_secondary: ["hamstring", "core"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Kaki selebar bahu, turun seperti duduk ke belakang. Lutut sejajar ujung kaki. Dada tegak.",
  },
  {
    code: "BW_SQT_02",
    name_id: "Bulgarian split squat",
    name_en: "Bulgarian split squat",
    category: "lunge",
    muscle_primary: ["quadrisep", "glute"],
    muscle_secondary: ["hamstring"],
    equipment: ["bench"],
    level: "intermediate",
    unilateral: true,
    notes_id: "Kaki belakang di bangku, turun lurus. Lutut depan jangan lewat ujung kaki.",
  },
  {
    code: "BW_SQT_03",
    name_id: "Pistol squat",
    name_en: "Pistol squat",
    category: "squat",
    muscle_primary: ["quadrisep", "glute"],
    equipment: ["bodyweight"],
    level: "advanced",
    unilateral: true,
    notes_id: "Squat satu kaki, kaki lain lurus depan. Butuh mobility + balance. Mulai dari assisted.",
  },
  {
    code: "BW_HNG_01",
    name_id: "Glute bridge",
    name_en: "Glute bridge",
    category: "hinge",
    muscle_primary: ["glute", "hamstring"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Tidur terlentang, kaki ditekuk. Angkat pinggul, peras pantat 1-2 detik di puncak.",
  },
  {
    code: "BW_HNG_02",
    name_id: "Single-leg hip thrust",
    name_en: "Single-leg hip thrust",
    category: "hinge",
    muscle_primary: ["glute"],
    muscle_secondary: ["hamstring", "core"],
    equipment: ["bench"],
    level: "intermediate",
    unilateral: true,
    notes_id: "Pundak di bangku, satu kaki lurus di udara. Dorong satu kaki yang menapak. Glute terisolasi.",
  },
  {
    code: "BW_HNG_03",
    name_id: "Good morning bodyweight",
    name_en: "Bodyweight good morning",
    category: "hinge",
    muscle_primary: ["hamstring", "punggung bawah"],
    muscle_secondary: ["glute"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Hip hinge ke depan, lutut sedikit ditekuk. Punggung tetap rata. Latih pola gerak deadlift.",
  },
  {
    code: "BW_LNG_01",
    name_id: "Walking lunge",
    name_en: "Walking lunge",
    category: "lunge",
    muscle_primary: ["quadrisep", "glute"],
    muscle_secondary: ["hamstring"],
    equipment: ["bodyweight"],
    level: "beginner",
    unilateral: true,
    notes_id: "Langkah panjang, lutut belakang hampir sentuh lantai. Ganti kaki tiap langkah.",
  },
  {
    code: "BW_LNG_02",
    name_id: "Reverse lunge",
    name_en: "Reverse lunge",
    category: "lunge",
    muscle_primary: ["quadrisep", "glute"],
    equipment: ["bodyweight"],
    level: "beginner",
    unilateral: true,
    notes_id: "Step mundur, lebih ramah lutut dari forward lunge. Cocok pemula.",
  },

  // ========== BODYWEIGHT CORE ==========
  {
    code: "BW_COR_01",
    name_id: "Plank",
    name_en: "Plank",
    category: "core",
    muscle_primary: ["abs", "core dalam"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Siku di bawah bahu, tubuh lurus dari kepala ke tumit. Jangan turun pinggul/punggung. Target 30-60s.",
  },
  {
    code: "BW_COR_02",
    name_id: "Side plank",
    name_en: "Side plank",
    category: "core",
    muscle_primary: ["obliques", "core lateral"],
    equipment: ["bodyweight"],
    level: "intermediate",
    unilateral: true,
    notes_id: "Sisi tubuh, siku di bawah bahu. Pinggul terangkat lurus.",
  },
  {
    code: "BW_COR_03",
    name_id: "Dead bug",
    name_en: "Dead bug",
    category: "core",
    muscle_primary: ["abs", "core stability"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Tidur terlentang, tangan ke atas dan lutut 90°. Ulurkan lengan + kaki berlawanan tanpa angkat pinggang.",
  },
  {
    code: "BW_COR_04",
    name_id: "Hollow body hold",
    name_en: "Hollow hold",
    category: "core",
    muscle_primary: ["abs", "core anterior"],
    equipment: ["bodyweight"],
    level: "intermediate",
    notes_id: "Tidur terlentang, punggung rata lantai, tangan + kaki naik sedikit. Gym/calisthenic staple.",
  },
  {
    code: "BW_COR_05",
    name_id: "Mountain climber",
    name_en: "Mountain climber",
    category: "core",
    muscle_primary: ["core", "hip flexor"],
    muscle_secondary: ["bahu"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Plank position, tarik lutut ke dada bergantian cepat. Core + sedikit cardio.",
  },
  {
    code: "BW_COR_06",
    name_id: "Hanging knee raise",
    name_en: "Hanging knee raise",
    category: "core",
    muscle_primary: ["abs bawah", "hip flexor"],
    equipment: ["pullup_bar"],
    level: "intermediate",
    notes_id: "Gantung di bar, tarik lutut ke dada. Hindari ayunan badan.",
  },
  {
    code: "BW_COR_07",
    name_id: "Russian twist",
    name_en: "Russian twist",
    category: "core",
    muscle_primary: ["obliques"],
    equipment: ["bodyweight", "dumbbell"],
    level: "beginner",
    notes_id: "Duduk, lutut tekuk, badan miring ke belakang. Putar torso kiri-kanan.",
  },

  // ========== DUMBBELL ==========
  {
    code: "DB_PUSH_01",
    name_id: "DB bench press",
    name_en: "Dumbbell bench press",
    category: "push",
    muscle_primary: ["dada", "tricep"],
    muscle_secondary: ["bahu depan"],
    equipment: ["dumbbell", "bench"],
    level: "beginner",
    notes_id: "Berbaring di bangku, dorong DB lurus ke atas. ROM lebih dalam dari barbell, lebih aman untuk bahu.",
  },
  {
    code: "DB_PUSH_02",
    name_id: "DB overhead press",
    name_en: "Dumbbell shoulder press",
    category: "push",
    muscle_primary: ["bahu", "tricep"],
    equipment: ["dumbbell"],
    level: "beginner",
    notes_id: "Duduk atau berdiri. Dorong DB ke atas dari level bahu, jangan lock siku keras.",
  },
  {
    code: "DB_PUSH_03",
    name_id: "DB lateral raise",
    name_en: "Lateral raise",
    category: "push",
    muscle_primary: ["bahu samping"],
    equipment: ["dumbbell"],
    level: "beginner",
    notes_id: "Angkat DB ke samping sampai sejajar bahu. Siku sedikit ditekuk. Beban ringan, fokus form.",
  },
  {
    code: "DB_PUSH_04",
    name_id: "DB chest fly",
    name_en: "Dumbbell fly",
    category: "push",
    muscle_primary: ["dada"],
    equipment: ["dumbbell", "bench"],
    level: "intermediate",
    notes_id: "Berbaring, DB di atas dada, buka tangan ke samping seperti memeluk. Stretch dada.",
  },
  {
    code: "DB_PULL_01",
    name_id: "DB row (single arm)",
    name_en: "Single-arm DB row",
    category: "pull",
    muscle_primary: ["latissimus", "punggung tengah"],
    muscle_secondary: ["bicep"],
    equipment: ["dumbbell", "bench"],
    level: "beginner",
    unilateral: true,
    notes_id: "Satu lutut + tangan di bangku, tarik DB ke pinggul. Siku dekat tubuh.",
  },
  {
    code: "DB_PULL_02",
    name_id: "DB bent-over row",
    name_en: "DB bent-over row",
    category: "pull",
    muscle_primary: ["latissimus", "punggung tengah"],
    muscle_secondary: ["bicep"],
    equipment: ["dumbbell"],
    level: "intermediate",
    notes_id: "Bungkuk hip hinge 45°, tarik kedua DB ke pinggul. Core engaged.",
  },
  {
    code: "DB_PULL_03",
    name_id: "DB curl",
    name_en: "Dumbbell bicep curl",
    category: "pull",
    muscle_primary: ["bicep"],
    equipment: ["dumbbell"],
    level: "beginner",
    notes_id: "Siku dekat tubuh, angkat DB ke bahu. Hindari ayunan badan.",
  },
  {
    code: "DB_PULL_04",
    name_id: "DB hammer curl",
    name_en: "Hammer curl",
    category: "pull",
    muscle_primary: ["bicep", "brachialis"],
    equipment: ["dumbbell"],
    level: "beginner",
    notes_id: "Grip neutral (telapak hadap dalam). Brachialis + forearm dapet ekstra.",
  },
  {
    code: "DB_SQT_01",
    name_id: "DB goblet squat",
    name_en: "Goblet squat",
    category: "squat",
    muscle_primary: ["quadrisep", "glute"],
    muscle_secondary: ["core"],
    equipment: ["dumbbell"],
    level: "beginner",
    notes_id: "Pegang DB vertikal di depan dada. Squat dalam, dada tegak.",
  },
  {
    code: "DB_HNG_01",
    name_id: "DB Romanian deadlift",
    name_en: "DB Romanian deadlift",
    category: "hinge",
    muscle_primary: ["hamstring", "glute"],
    muscle_secondary: ["punggung bawah"],
    equipment: ["dumbbell"],
    level: "beginner",
    notes_id: "Hip hinge dengan lutut sedikit ditekuk. DB turun di depan kaki sampai stretch hamstring.",
  },
  {
    code: "DB_LNG_01",
    name_id: "DB walking lunge",
    name_en: "DB walking lunge",
    category: "lunge",
    muscle_primary: ["quadrisep", "glute"],
    equipment: ["dumbbell"],
    level: "intermediate",
    unilateral: true,
  },
  {
    code: "DB_CRY_01",
    name_id: "Farmer carry",
    name_en: "Farmer's walk",
    category: "carry",
    muscle_primary: ["grip", "trap", "core"],
    equipment: ["dumbbell", "kettlebell"],
    level: "beginner",
    notes_id: "Pegang DB berat di sisi tubuh, jalan 20-40m. Postur tegak. Latih grip + core stability.",
  },

  // ========== BARBELL (gym access) ==========
  {
    code: "BB_PUSH_01",
    name_id: "Bench press barbell",
    name_en: "Barbell bench press",
    category: "push",
    muscle_primary: ["dada", "tricep"],
    muscle_secondary: ["bahu depan"],
    equipment: ["barbell", "bench"],
    level: "intermediate",
    notes_id: "Grip sedikit lebih lebar dari bahu. Bar turun ke dada bawah, dorong eksplosif. Spotter direkomendasikan.",
  },
  {
    code: "BB_PUSH_02",
    name_id: "OHP (overhead press) barbell",
    name_en: "Standing barbell OHP",
    category: "push",
    muscle_primary: ["bahu", "tricep"],
    muscle_secondary: ["core"],
    equipment: ["barbell"],
    level: "intermediate",
    notes_id: "Berdiri, bar di rak bahu depan. Dorong ke atas, kepala sedikit ke depan saat bar lewat. Core engaged.",
  },
  {
    code: "BB_SQT_01",
    name_id: "Back squat",
    name_en: "Barbell back squat",
    category: "squat",
    muscle_primary: ["quadrisep", "glute"],
    muscle_secondary: ["hamstring", "core"],
    equipment: ["barbell"],
    level: "intermediate",
    notes_id: "Bar di trap atas (high bar) atau rear delts (low bar). Turun ke parallel atau lebih dalam. Spotter untuk berat.",
  },
  {
    code: "BB_HNG_01",
    name_id: "Deadlift (konvensional)",
    name_en: "Conventional deadlift",
    category: "hinge",
    muscle_primary: ["hamstring", "glute", "punggung bawah"],
    muscle_secondary: ["latissimus", "trap"],
    equipment: ["barbell"],
    level: "intermediate",
    notes_id: "Bar di atas mid-foot, grip selebar bahu. Punggung netral (bukan melengkung). Push lantai, jangan tarik bar.",
  },
  {
    code: "BB_PULL_01",
    name_id: "Barbell bent-over row",
    name_en: "Barbell row",
    category: "pull",
    muscle_primary: ["latissimus", "punggung tengah"],
    muscle_secondary: ["bicep", "rear delt"],
    equipment: ["barbell"],
    level: "intermediate",
    notes_id: "Hip hinge 45°, tarik bar ke pinggul/perut. Punggung netral.",
  },
  {
    code: "BB_HNG_02",
    name_id: "Romanian deadlift (RDL) barbell",
    name_en: "Romanian deadlift",
    category: "hinge",
    muscle_primary: ["hamstring", "glute"],
    equipment: ["barbell"],
    level: "intermediate",
    notes_id: "Hip hinge dengan lutut soft. Bar turun di depan kaki sampai stretch hamstring (sekitar lutut). Tidak lock-out di bawah.",
  },
  {
    code: "BB_HNG_03",
    name_id: "Hip thrust barbell",
    name_en: "Barbell hip thrust",
    category: "hinge",
    muscle_primary: ["glute"],
    muscle_secondary: ["hamstring"],
    equipment: ["barbell", "bench"],
    level: "intermediate",
    notes_id: "Pundak di bangku, bar di pinggul (pakai pad). Dorong pinggul ke atas, peras glute.",
  },

  // ========== KETTLEBELL ==========
  {
    code: "KB_HNG_01",
    name_id: "KB swing (Russian)",
    name_en: "Kettlebell swing",
    category: "hinge",
    muscle_primary: ["glute", "hamstring"],
    muscle_secondary: ["core", "bahu"],
    equipment: ["kettlebell"],
    level: "intermediate",
    notes_id: "Ayun KB dari antara kaki ke setinggi bahu via hip drive. Bukan squat, ini hinge.",
  },
  {
    code: "KB_GBL_01",
    name_id: "KB goblet squat",
    name_en: "KB goblet squat",
    category: "squat",
    muscle_primary: ["quadrisep", "glute"],
    equipment: ["kettlebell"],
    level: "beginner",
  },

  // ========== RESISTANCE BAND ==========
  {
    code: "RB_PUSH_01",
    name_id: "Band chest press",
    name_en: "Band chest press",
    category: "push",
    muscle_primary: ["dada", "tricep"],
    equipment: ["resistance_band"],
    level: "beginner",
    notes_id: "Band terjepit di pintu/tiang belakang, dorong ke depan. Bagus buat home gym.",
  },
  {
    code: "RB_PULL_01",
    name_id: "Band row",
    name_en: "Band row",
    category: "pull",
    muscle_primary: ["punggung tengah", "latissimus"],
    muscle_secondary: ["bicep"],
    equipment: ["resistance_band"],
    level: "beginner",
    notes_id: "Band di anchor depan, tarik ke perut. Siku dekat tubuh.",
  },
  {
    code: "RB_PULL_02",
    name_id: "Band face pull",
    name_en: "Band face pull",
    category: "pull",
    muscle_primary: ["rear delt", "rhomboid"],
    equipment: ["resistance_band"],
    level: "beginner",
    notes_id: "Band setinggi kepala, tarik ke wajah dengan siku tinggi. Postur shoulder health.",
  },
  {
    code: "RB_PULL_03",
    name_id: "Band pull-apart",
    name_en: "Band pull-apart",
    category: "pull",
    muscle_primary: ["rear delt", "rhomboid"],
    equipment: ["resistance_band"],
    level: "beginner",
    notes_id: "Pegang band selebar bahu, tarik kedua sisi ke samping. Aktivasi otot punggung atas.",
  },
  {
    code: "RB_SQT_01",
    name_id: "Band squat",
    name_en: "Band squat",
    category: "squat",
    muscle_primary: ["quadrisep", "glute"],
    equipment: ["resistance_band"],
    level: "beginner",
  },

  // ========== CARDIO ==========
  {
    code: "CD_01",
    name_id: "Lari/jogging",
    name_en: "Running / jogging",
    category: "cardio",
    muscle_primary: ["kardiovaskular", "kaki"],
    equipment: ["none"],
    level: "beginner",
    notes_id: "Outdoor atau treadmill. Mulai 20-30 menit zone-2 (bisa ngobrol sambil lari).",
  },
  {
    code: "CD_02",
    name_id: "Jalan cepat",
    name_en: "Brisk walking",
    category: "cardio",
    muscle_primary: ["kardiovaskular"],
    equipment: ["none"],
    level: "beginner",
    notes_id: "Low impact, cocok pemula / recovery. Target 5-7 km/jam, 30-60 menit.",
  },
  {
    code: "CD_03",
    name_id: "Bersepeda",
    name_en: "Cycling",
    category: "cardio",
    muscle_primary: ["kardiovaskular", "kaki"],
    equipment: ["cardio_equipment", "none"],
    level: "beginner",
    notes_id: "Outdoor atau stationary bike. Low impact, bagus buat yang lutut sensitif.",
  },
  {
    code: "CD_04",
    name_id: "Jump rope",
    name_en: "Jump rope",
    category: "cardio",
    muscle_primary: ["kardiovaskular", "betis"],
    equipment: ["cardio_equipment"],
    level: "intermediate",
    notes_id: "Murah, portable. Mulai 1-2 menit set, build up. 10 menit jump rope ≈ 30 menit jogging.",
  },
  {
    code: "CD_05",
    name_id: "Burpee",
    name_en: "Burpee",
    category: "explosive",
    muscle_primary: ["full body", "kardiovaskular"],
    equipment: ["bodyweight"],
    level: "intermediate",
    notes_id: "Squat → plank → push-up → squat → jump. HIIT staple.",
  },
  {
    code: "CD_06",
    name_id: "Jumping jack",
    name_en: "Jumping jack",
    category: "cardio",
    muscle_primary: ["kardiovaskular"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Cardio ringan, bagus buat warmup atau interval circuit.",
  },
  {
    code: "CD_07",
    name_id: "High knee",
    name_en: "High knees",
    category: "cardio",
    muscle_primary: ["kardiovaskular", "hip flexor"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Lari di tempat, lutut diangkat tinggi (pinggul level).",
  },

  // ========== EXPLOSIVE / PLYOMETRIC ==========
  {
    code: "PL_01",
    name_id: "Box jump",
    name_en: "Box jump",
    category: "explosive",
    muscle_primary: ["quadrisep", "glute"],
    equipment: ["bench"],
    level: "intermediate",
    notes_id: "Lompat ke atas box/bangku stabil. Mendarat soft, jangan kunci lutut.",
  },
  {
    code: "PL_02",
    name_id: "Jump squat",
    name_en: "Jump squat",
    category: "explosive",
    muscle_primary: ["quadrisep", "glute"],
    equipment: ["bodyweight"],
    level: "beginner",
  },

  // ========== MOBILITY ==========
  {
    code: "MB_01",
    name_id: "Cat-cow",
    name_en: "Cat-cow stretch",
    category: "mobility",
    muscle_primary: ["spine"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Posisi merangkak, gantian melengkungkan + cembung tulang belakang. Warmup spine.",
  },
  {
    code: "MB_02",
    name_id: "Hip flexor stretch",
    name_en: "Hip flexor stretch",
    category: "mobility",
    muscle_primary: ["hip flexor"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Half-kneeling, dorong pinggul ke depan. 30-45 detik tiap sisi. Penting buat orang kantoran.",
  },
  {
    code: "MB_03",
    name_id: "Thoracic rotation",
    name_en: "Thoracic spine rotation",
    category: "mobility",
    muscle_primary: ["thoracic spine"],
    equipment: ["bodyweight"],
    level: "beginner",
    notes_id: "Quadruped (merangkak), tangan kanan di belakang kepala, putar siku ke langit. 10 rep tiap sisi.",
  },
  {
    code: "MB_04",
    name_id: "Shoulder dislocate (band)",
    name_en: "Shoulder dislocate",
    category: "mobility",
    muscle_primary: ["bahu"],
    equipment: ["resistance_band"],
    level: "beginner",
    notes_id: "Pegang band lebar di depan, putar lewat kepala sampai belakang. Mobility bahu.",
  },
  {
    code: "MB_05",
    name_id: "World's greatest stretch",
    name_en: "World's greatest stretch",
    category: "mobility",
    muscle_primary: ["full body"],
    equipment: ["bodyweight"],
    level: "intermediate",
    notes_id: "Lunge + thoracic rotation + hamstring stretch dalam satu gerakan. Warmup all-purpose.",
  },
];

// ============================================
// QUERY HELPERS
// ============================================

export interface ExerciseFilter {
  category?: ExerciseCategory[];
  equipment_available?: Equipment[]; // user-side: include exercise jika SEMUA equipment-nya ada
  level_max?: Level;
  exclude_codes?: string[];
}

const LEVEL_ORDER: Record<Level, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export function filterExercises(filter: ExerciseFilter = {}): Exercise[] {
  return EXERCISES.filter((ex) => {
    if (filter.exclude_codes?.includes(ex.code)) return false;
    if (filter.category && !filter.category.includes(ex.category)) return false;
    if (filter.level_max && LEVEL_ORDER[ex.level] > LEVEL_ORDER[filter.level_max]) {
      return false;
    }
    if (filter.equipment_available) {
      // Exercise OK kalau semua equipment-nya ada di available
      // Special case: "none" / "bodyweight" selalu OK
      const allHave = ex.equipment.every(
        (eq) => eq === "none" || eq === "bodyweight" || filter.equipment_available!.includes(eq),
      );
      if (!allHave) return false;
    }
    return true;
  });
}

export function listCategories(): ExerciseCategory[] {
  return [
    "push",
    "pull",
    "squat",
    "hinge",
    "lunge",
    "core",
    "carry",
    "cardio",
    "mobility",
    "explosive",
  ];
}

export function getExercise(code: string): Exercise | undefined {
  return EXERCISES.find((ex) => ex.code === code);
}

/** Compact representation for Claude prompt context. */
export interface CompactExercise {
  code: string;
  name: string;
  cat: string;
  eq: string[];
  level: string;
  muscle: string[];
  unilat?: boolean;
}

export function toCompact(ex: Exercise): CompactExercise {
  return {
    code: ex.code,
    name: ex.name_id,
    cat: ex.category,
    eq: ex.equipment,
    level: ex.level,
    muscle: ex.muscle_primary,
    ...(ex.unilateral ? { unilat: true } : {}),
  };
}
