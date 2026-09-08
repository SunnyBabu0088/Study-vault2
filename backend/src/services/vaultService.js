const { pool } = require('../config/database');

const seedDefaultDataForUser = async (userId) => {
    // Seed default subjects if user has none
    const existingSubjects = await pool.query('SELECT id FROM subjects WHERE user_id = $1', [userId]);
    let subjectIds = {};

    if (existingSubjects.rows.length === 0) {
        const defaultSubjects = [
            { name: 'Machine Learning', code: 'CS-401', color: '#ff007f' },
            { name: 'DBMS', code: 'CS-302', color: '#3b52cf' },
            { name: 'Python', code: 'CS-201', color: '#10b981' },
            { name: 'AI', code: 'CS-405', color: '#06b6d4' },
        ];

        for (const s of defaultSubjects) {
            const res = await pool.query(
                `INSERT INTO subjects (user_id, name, code, color) VALUES ($1, $2, $3, $4) RETURNING id, name`,
                [userId, s.name, s.code, s.color]
            );
            subjectIds[s.name] = res.rows[0].id;
        }
    } else {
        const res = await pool.query('SELECT id, name FROM subjects WHERE user_id = $1', [userId]);
        res.rows.forEach(r => { subjectIds[r.name] = r.id; });
    }

    // Seed default study materials if none exist
    const existingMaterials = await pool.query('SELECT id FROM study_materials WHERE user_id = $1', [userId]);
    if (existingMaterials.rows.length === 0) {
        const mlId = subjectIds['Machine Learning'] || null;
        const dbmsId = subjectIds['DBMS'] || null;
        const pythonId = subjectIds['Python'] || null;

        const defaultMaterials = [
            {
                subject_id: mlId,
                title: 'Neural Networks — Chapter 4',
                topic: 'Deep Learning',
                material_type: 'video',
                content_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                thumbnail_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&auto=format&fit=crop',
                duration_seconds: 2700,
                description: 'Comprehensive guide to forward propagation and backpropagation.',
                difficulty: 'Hard'
            },
            {
                subject_id: dbmsId,
                title: 'SQL Indexing & Query Optimization',
                topic: 'Indexing',
                material_type: 'text',
                content_url: null,
                thumbnail_url: null,
                duration_seconds: 1500,
                description: 'B-Trees, Hash Indexes, and execution plan analysis.',
                difficulty: 'Medium'
            },
            {
                subject_id: pythonId,
                title: 'Python Asyncio & Concurrency',
                topic: 'Advanced Python',
                material_type: 'audio',
                content_url: null,
                thumbnail_url: null,
                duration_seconds: 1800,
                description: 'Audio podcast on event loops, coroutines, and async tasks.',
                difficulty: 'Medium'
            },
        ];

        for (const m of defaultMaterials) {
            await pool.query(
                `INSERT INTO study_materials (user_id, subject_id, title, topic, material_type, content_url, thumbnail_url, duration_seconds, description, difficulty)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [userId, m.subject_id, m.title, m.topic, m.material_type, m.content_url, m.thumbnail_url, m.duration_seconds, m.description, m.difficulty]
            );
        }
    }

    // Seed Quizzes if missing
    const existingQuizzes = await pool.query('SELECT id FROM quizzes LIMIT 1');
    if (existingQuizzes.rows.length === 0) {
        for (let level = 1; level <= 5; level++) {
            const quizRes = await pool.query(
                `INSERT INTO quizzes (title, subject_name, quiz_date, level, xp_reward)
                 VALUES ($1, $2, CURRENT_DATE, $3, $4) RETURNING id`,
                [`Level ${level} Challenge`, level % 2 === 1 ? 'Machine Learning' : 'Python', level, 100 * level]
            );
            const qId = quizRes.rows[0].id;

            // Seed 3 questions per quiz level
            const questions = [
                {
                    question: `[Level ${level}] What is the primary function of a activation function in a Neural Network?`,
                    a: 'Introduce non-linearity',
                    b: 'Scale input features',
                    c: 'Calculate loss',
                    d: 'Normalize gradients',
                    correct: 'A',
                    explanation: 'Activation functions introduce non-linear properties to the neural network.'
                },
                {
                    question: `[Level ${level}] Which algorithm is commonly used for supervised classification?`,
                    a: 'K-Means',
                    b: 'Random Forest',
                    c: 'Apriori',
                    d: 'DBSCAN',
                    correct: 'B',
                    explanation: 'Random Forest is an ensemble learning method for classification and regression.'
                },
                {
                    question: `[Level ${level}] In Python, what does the keyword "async" declare?`,
                    a: 'A synchronous block',
                    b: 'A coroutine function',
                    c: 'A thread lock',
                    d: 'A generator expression',
                    correct: 'B',
                    explanation: 'The async def syntax defines a native coroutine in Python.'
                }
            ];

            for (const q of questions) {
                await pool.query(
                    `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [qId, q.question, q.a, q.b, q.c, q.d, q.correct, q.explanation]
                );
            }
        }
    }
};

const getVaultSummary = async (userId) => {
    await seedDefaultDataForUser(userId);

    // Today's total study duration from active/completed study sessions
    const todayStudyRes = await pool.query(
        `SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds
         FROM study_sessions
         WHERE user_id = $1 AND started_at >= CURRENT_DATE AND status IN ('completed', 'active', 'paused')`,
        [userId]
    );
    const todayStudiedSeconds = parseInt(todayStudyRes.rows[0].total_seconds, 10);

    // Today's focus material (latest material with progress or first material)
    const focusRes = await pool.query(
        `SELECT sm.id, sm.title, sm.topic, sm.material_type, sm.content_url, sm.thumbnail_url, sm.duration_seconds,
                s.name as subject_name, s.color as subject_color,
                COALESCE(mp.progress_percentage, 0) as progress_percentage,
                COALESCE(mp.last_position_seconds, 0) as last_position_seconds,
                COALESCE(mp.watched_seconds, 0) as watched_seconds
         FROM study_materials sm
         LEFT JOIN subjects s ON s.id = sm.subject_id
         LEFT JOIN material_progress mp ON mp.material_id = sm.id AND mp.user_id = $1
         WHERE sm.user_id = $1
         ORDER BY mp.updated_at DESC NULLS LAST, sm.created_at DESC
         LIMIT 1`,
        [userId]
    );

    const focusItem = focusRes.rows[0] || {
        title: 'Machine Learning Fundamentals',
        topic: 'Neural Networks',
        subject_name: 'Machine Learning',
        progress_percentage: 0,
        last_position_seconds: 0,
        duration_seconds: 2700,
    };

    // My Subjects progress calculation
    const subjectsRes = await pool.query(
        `SELECT s.id, s.name, s.code, s.color,
                COUNT(sm.id) as total_materials,
                COALESCE(AVG(mp.progress_percentage), 0) as avg_progress
         FROM subjects s
         LEFT JOIN study_materials sm ON sm.subject_id = s.id
         LEFT JOIN material_progress mp ON mp.material_id = sm.id AND mp.user_id = $1
         WHERE s.user_id = $1
         GROUP BY s.id
         ORDER BY s.name ASC`,
        [userId]
    );

    // Today's Tasks
    const tasksRes = await pool.query(
        `SELECT id, subject, title, content, priority, due_date, completed
         FROM study_tasks
         WHERE user_id = $1
         ORDER BY completed ASC, due_date ASC NULLS LAST
         LIMIT 5`,
        [userId]
    );

    // Recent Study Materials
    const materialsRes = await pool.query(
        `SELECT sm.id, sm.title, sm.topic, sm.material_type, sm.content_url, sm.thumbnail_url, sm.duration_seconds, sm.difficulty,
                s.name as subject_name, s.color as subject_color,
                COALESCE(mp.progress_percentage, 0) as progress_percentage,
                COALESCE(mp.last_position_seconds, 0) as last_position_seconds
         FROM study_materials sm
         LEFT JOIN subjects s ON s.id = sm.subject_id
         LEFT JOIN material_progress mp ON mp.material_id = sm.id AND mp.user_id = $1
         WHERE sm.user_id = $1
         ORDER BY mp.updated_at DESC NULLS LAST, sm.created_at DESC
         LIMIT 6`,
        [userId]
    );

    // User XP & Level
    const xpRes = await pool.query('SELECT total_xp, quiz_streak, current_level FROM user_xp WHERE user_id = $1', [userId]);
    const xpData = xpRes.rows[0] || { total_xp: 0, quiz_streak: 0, current_level: 1 };

    return {
        today_studied_seconds: todayStudiedSeconds,
        today_focus: focusItem,
        subjects: subjectsRes.rows,
        tasks: tasksRes.rows,
        recent_materials: materialsRes.rows,
        xp: xpData,
    };
};

const startStudySession = async (userId, { subject_id, material_id, activity_type }) => {
    const res = await pool.query(
        `INSERT INTO study_sessions (user_id, subject_id, material_id, activity_type, started_at, status, last_heartbeat)
         VALUES ($1, $2, $3, $4, NOW(), 'active', NOW())
         RETURNING *`,
        [userId, subject_id || null, material_id || null, activity_type || 'reading']
    );
    return res.rows[0];
};

const heartbeatStudySession = async (userId, sessionId, { duration_seconds, status }) => {
    const existing = await pool.query(
        `SELECT id, started_at, duration_seconds, status FROM study_sessions WHERE id = $1 AND user_id = $2`,
        [sessionId, userId]
    );
    if (existing.rows.length === 0) {
        const err = new Error('Study session not found');
        err.statusCode = 404;
        throw err;
    }

    const session = existing.rows[0];
    const serverElapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000));
    
    // Anti-tamper: duration_seconds cannot exceed total wall-clock time since session started (+ 10s grace for network latency)
    let validatedDuration = session.duration_seconds || 0;
    if (typeof duration_seconds === 'number' && !isNaN(duration_seconds) && duration_seconds >= 0) {
        validatedDuration = Math.min(Math.max(validatedDuration, Math.floor(duration_seconds)), serverElapsedSeconds + 10);
    }

    const res = await pool.query(
        `UPDATE study_sessions
         SET duration_seconds = $3,
             status = COALESCE($4, status),
             ended_at = CASE WHEN $4 IN ('completed', 'cancelled') THEN NOW() ELSE ended_at END,
             last_heartbeat = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [sessionId, userId, validatedDuration, status]
    );
    return res.rows[0];
};

const updateMaterialProgress = async (userId, { material_id, last_position_seconds, watched_seconds, progress_percentage, completed }) => {
    const res = await pool.query(
        `INSERT INTO material_progress (user_id, material_id, last_position_seconds, watched_seconds, progress_percentage, completed, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id, material_id)
         DO UPDATE SET
             last_position_seconds = EXCLUDED.last_position_seconds,
             watched_seconds = material_progress.watched_seconds + EXCLUDED.watched_seconds,
             progress_percentage = GREATEST(material_progress.progress_percentage, EXCLUDED.progress_percentage),
             completed = EXCLUDED.completed OR material_progress.completed,
             updated_at = NOW()
         RETURNING *`,
        [userId, material_id, last_position_seconds || 0, watched_seconds || 0, progress_percentage || 0, Boolean(completed)]
    );
    return res.rows[0];
};

const getDailyQuiz = async (userId) => {
    await seedDefaultDataForUser(userId);

    // Fetch quiz levels
    const levelsRes = await pool.query(
        `SELECT q.id as quiz_id, q.title, q.subject_name, q.level, q.xp_reward,
                qlp.status as level_status, qlp.completed_at, qlp.unlocks_at
         FROM quizzes q
         LEFT JOIN quiz_level_progress qlp ON qlp.level = q.level AND qlp.user_id = $1
         ORDER BY q.level ASC`,
        [userId]
    );

    const now = new Date();

    const levels = levelsRes.rows.map((row) => {
        const isLevel1 = row.level === 1;
        const isCompleted = Boolean(row.completed_at);
        const unlocksAt = row.unlocks_at ? new Date(row.unlocks_at) : null;
        
        let isUnlocked = false;
        if (isCompleted) {
            isUnlocked = true;
        } else if (isLevel1) {
            isUnlocked = true;
        } else if (unlocksAt) {
            isUnlocked = now >= unlocksAt;
        }

        return {
            quiz_id: row.quiz_id,
            title: row.title,
            subject_name: row.subject_name,
            level: row.level,
            xp_reward: row.xp_reward,
            status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
            unlocks_at: row.unlocks_at,
            completed_at: row.completed_at,
        };
    });

    // Determine current level to play (first unlocked but uncompleted level, or level 1)
    const activeLevel = levels.find((l) => l.status === 'unlocked') || levels[0];

    // Fetch questions for active level WITHOUT correct answers
    const questionsRes = await pool.query(
        `SELECT id, question, option_a, option_b, option_c, option_d
         FROM quiz_questions
         WHERE quiz_id = $1
         ORDER BY id ASC`,
        [activeLevel.quiz_id]
    );

    return {
        levels,
        active_quiz: {
            ...activeLevel,
            questions: questionsRes.rows,
        },
    };
};

const submitQuizAnswers = async (userId, { quiz_id, level, answers }) => {
    const quizLevel = Number(level) || 1;

    // Strict 24-hour server lock validation
    if (quizLevel > 1) {
        const prevLevelRes = await pool.query(
            `SELECT completed_at FROM quiz_level_progress WHERE user_id = $1 AND level = $2`,
            [userId, quizLevel - 1]
        );
        if (prevLevelRes.rows.length === 0 || !prevLevelRes.rows[0].completed_at) {
            const err = new Error(`Level ${quizLevel} is locked. You must complete Level ${quizLevel - 1} first.`);
            err.statusCode = 403;
            throw err;
        }

        const currLevelRes = await pool.query(
            `SELECT unlocks_at FROM quiz_level_progress WHERE user_id = $1 AND level = $2`,
            [userId, quizLevel]
        );
        if (currLevelRes.rows.length > 0 && currLevelRes.rows[0].unlocks_at) {
            const unlocksAt = new Date(currLevelRes.rows[0].unlocks_at);
            if (new Date() < unlocksAt) {
                const diffMs = unlocksAt.getTime() - Date.now();
                const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
                const err = new Error(`Level ${quizLevel} is locked by server rule. Available in approximately ${hoursLeft} hour(s).`);
                err.statusCode = 403;
                throw err;
            }
        }
    }

    // Validate correct answers on backend
    const questionsRes = await pool.query(
        `SELECT id, correct_answer, explanation FROM quiz_questions WHERE quiz_id = $1`,
        [quiz_id]
    );

    const questions = questionsRes.rows;
    let score = 0;
    const totalQuestions = questions.length;

    questions.forEach((q) => {
        const userChoice = answers ? answers[q.id] : null;
        if (userChoice && String(userChoice).toUpperCase() === String(q.correct_answer).toUpperCase()) {
            score += 1;
        }
    });

    const xpEarned = Math.round((score / (totalQuestions || 1)) * 100 * quizLevel);

    // Save attempt
    await pool.query(
        `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, xp_earned, completed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, quiz_id, score, totalQuestions, xpEarned]
    );

    // Mark current level completed
    await pool.query(
        `INSERT INTO quiz_level_progress (user_id, level, completed_at, status)
         VALUES ($1, $2, NOW(), 'completed')
         ON CONFLICT (user_id, level)
         DO UPDATE SET completed_at = NOW(), status = 'completed'`,
        [userId, quizLevel]
    );

    // Enforce 24-hour server lock on next level
    const nextLevel = quizLevel + 1;
    const nextUnlocksAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
        `INSERT INTO quiz_level_progress (user_id, level, unlocks_at, status)
         VALUES ($1, $2, $3, 'locked')
         ON CONFLICT (user_id, level)
         DO UPDATE SET unlocks_at = CASE WHEN quiz_level_progress.completed_at IS NULL THEN $3 ELSE quiz_level_progress.unlocks_at END,
                       status = CASE WHEN quiz_level_progress.completed_at IS NULL THEN 'locked' ELSE quiz_level_progress.status END`,
        [userId, nextLevel, nextUnlocksAt]
    );

    // Update user XP
    await pool.query(
        `INSERT INTO user_xp (user_id, total_xp, quiz_streak, last_quiz_date, current_level)
         VALUES ($1, $2, 1, CURRENT_DATE, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET total_xp = user_xp.total_xp + $2,
                       quiz_streak = user_xp.quiz_streak + 1,
                       last_quiz_date = CURRENT_DATE,
                       current_level = GREATEST(user_xp.current_level, $3 + 1)`,
        [userId, xpEarned, quizLevel]
    );

    return {
        score,
        total_questions: totalQuestions,
        accuracy_percentage: Math.round((score / (totalQuestions || 1)) * 100),
        xp_earned: xpEarned,
        unlocks_at: nextUnlocksAt,
    };
};

const getVaultAnalytics = async (userId) => {
    // Subject wise study time
    const subjectTimeRes = await pool.query(
        `SELECT s.name as subject_name, COALESCE(SUM(ss.duration_seconds), 0) as total_seconds
         FROM subjects s
         LEFT JOIN study_sessions ss ON ss.subject_id = s.id AND ss.user_id = $1
         WHERE s.user_id = $1
         GROUP BY s.name`,
        [userId]
    );

    // Weekly study sessions duration
    const weeklyRes = await pool.query(
        `SELECT DATE(started_at) as study_date, COALESCE(SUM(duration_seconds), 0) as total_seconds
         FROM study_sessions
         WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(started_at)
         ORDER BY study_date ASC`,
        [userId]
    );

    return {
        subject_breakdown: subjectTimeRes.rows,
        weekly_breakdown: weeklyRes.rows,
    };
};

module.exports = {
    getVaultSummary,
    startStudySession,
    heartbeatStudySession,
    updateMaterialProgress,
    getDailyQuiz,
    submitQuizAnswers,
    getVaultAnalytics,
};
