const { pool } = require('./database');

const DEMO_REELS = [
  {
    creator: 'Alex',
    caption: 'Python List Comprehensions in 30 Seconds! 🚀 Master clean code.',
    hashtags: '#python #coding #programming #software',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Maya',
    caption: 'How Neural Networks Learn: Backpropagation explained visually 🧠✨',
    hashtags: '#ai #artificialintelligence #deeplearning #tech',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    cover_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Noah',
    caption: 'Supervised vs Unsupervised Learning in 45s 📊🤖',
    hashtags: '#ml #machinelearning #datascience #ai',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    cover_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Aarav',
    caption: 'Binary Search Tree (BST) operations & O(log N) time complexity ⚡',
    hashtags: '#dsa #algorithms #datastructures #leetcode',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylikes.mp4',
    cover_url: 'https://images.unsplash.com/photo-1516116211223-48a122637329?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Zoe',
    caption: 'React useEffect Hook Lifecycle & Cleanup Functions 💻⚛️',
    hashtags: '#webdev #react #frontend #js',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    cover_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Alex',
    caption: 'Java Object-Oriented Principles: Inheritance vs Polymorphism ☕',
    hashtags: '#java #oop #backend #programming',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    cover_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Maya',
    caption: 'C++ Pointers & Memory Management Tutorial ⚡🎯',
    hashtags: '#cpp #pointers #memory #programming',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback2012.mp4',
    cover_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Noah',
    caption: 'SQL Joins Explained: INNER, LEFT, RIGHT & FULL OUTER 🗄️',
    hashtags: '#sql #database #postgres #backend',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    cover_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Aarav',
    caption: 'Feynman Technique for Semester Exams 📝 Target 90%+',
    hashtags: '#examprep #studyhacks #semesterexams #study',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    cover_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=60',
  },
  {
    creator: 'Zoe',
    caption: '50/10 Pomodoro Method for Deep Focus Study Sessions ⏱️📚',
    hashtags: '#productivity #studytips #focus #time-management',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    cover_url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=500&auto=format&fit=crop&q=60',
  },
];

async function seedDemoReels() {
  try {
    const countRes = await pool.query(`SELECT COUNT(*)::int FROM reels WHERE is_demo = true`);
    const count = countRes.rows[0]?.count || 0;

    if (count >= 10) {
      console.log(`[Seed Demo Reels] Database already has ${count} demo reels. Skipping.`);
      return;
    }

    // Get or create a demo user to own demo reels
    let userRes = await pool.query(`SELECT id FROM users WHERE email = 'demo@studyvault.internal'`);
    let userId = userRes.rows[0]?.id;

    if (!userId) {
      const newUser = await pool.query(
        `INSERT INTO users (email, username, password_hash, roll_number)
         VALUES ('demo@studyvault.internal', 'DemoStudent', 'demo_hash_not_usable', 'DEMO-001')
         RETURNING id`
      );
      userId = newUser.rows[0].id;
    }

    for (const reel of DEMO_REELS) {
      const exists = await pool.query(
        `SELECT id FROM reels WHERE caption = $1 AND is_demo = true`,
        [reel.caption]
      );

      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO reels (user_id, video_url, cover_url, caption, hashtags, visibility, views_count, is_demo)
           VALUES ($1, $2, $3, $4, $5, 'public', 120, true)`,
          [userId, reel.video_url, reel.cover_url, reel.caption, reel.hashtags]
        );
      }
    }

    console.log('[Seed Demo Reels] Successfully seeded 10 realistic demo reels tagged with is_demo = true.');
  } catch (err) {
    console.error('[Seed Demo Reels] Failed to seed demo reels:', err.message || err);
  }
}

module.exports = { seedDemoReels };
