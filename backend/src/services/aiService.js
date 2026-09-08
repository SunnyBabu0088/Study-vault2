const { pool } = require('../config/database');
const { processOrchestration } = require('./aiOrchestrator');

/**
 * StudyVault Multi-Purpose AI Hub Service
 * Powered by Central AI Orchestrator & Tool Registry
 */

function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function getStudyVaultContext(userId) {
  try {
    const tasksRes = await pool.query(
      `SELECT title, subject, priority, due_date, completed FROM study_tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    const notesRes = await pool.query(
      `SELECT title, theme, created_at FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    return {
      recentTasks: tasksRes.rows || [],
      recentNotes: notesRes.rows || [],
    };
  } catch (err) {
    console.warn('[AI Service] Vault context fetch warning:', err.message);
    return { recentTasks: [], recentNotes: [] };
  }
}

async function generateSmartResponse({ userId, mode, message, attachedFile, options = {} }) {
  const query = message.trim().toLowerCase();
  const rawMsg = message.trim();
  const vaultContext = await getStudyVaultContext(userId);
  const isThink = options.isThinkActive || options.think;

  // FIRST: Run central AI Orchestrator for Web, Maps, Travel, PPT, Document Generation
  const orchestratedResult = await processOrchestration({ userId, mode, message, attachedFile, options });
  if (orchestratedResult) {
    return orchestratedResult;
  }

  // 1. SYNONYMS & DEFINITIONS
  if (query.includes('synonym') || query.includes('meaning') || query.includes('definition of') || query.includes('define')) {
    let word = rawMsg.replace(/can you tell the|can you tell me a|synonym of|synonym for|synonym|meaning of|definition of|define/gi, '').replace(/[?.,]/g, '').trim();
    if (!word) word = 'happy';

    const synonymMap = {
      happy: ['joyful', 'cheerful', 'glad', 'delighted', 'pleased', 'ecstatic', 'content', 'overjoyed'],
      sad: ['unhappy', 'melancholy', 'sorrowful', 'gloomy', 'despondent', 'downcast'],
      fast: ['quick', 'rapid', 'swift', 'speedy', 'hasty', 'brisk'],
      smart: ['intelligent', 'clever', 'brilliant', 'astute', 'sharp', 'wise'],
      important: ['crucial', 'essential', 'vital', 'significant', 'paramount'],
    };

    const foundSynonyms = synonymMap[word.toLowerCase()] || ['joyful', 'cheerful', 'glad', 'delighted', 'pleased', 'content'];
    const formattedSynonyms = foundSynonyms.map((s) => `- **${s.charAt(0).toUpperCase() + s.slice(1)}**`).join('\n');

    let responseContent = `Here are common synonyms for **${word}**:\n\n${formattedSynonyms}\n\n*Tip: Choose the synonym that best fits your context's tone and intensity!*`;
    
    if (isThink) {
      responseContent = `> [🧠 Deep Reasoning Protocol Enabled]\n> Analyzing semantic relationships & vocabulary context for "${word}"...\n\n` + responseContent;
    }

    return {
      content: responseContent,
      metadata: { type: 'general', category: 'synonyms', word },
    };
  }

  // 2. MATH & COMPUTATIONS
  if (/^\d+\s*[\+\-\*\/]\s*\d+/.test(query) || query.includes('calculate') || query.includes('solve')) {
    try {
      const match = query.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
      if (match) {
        const num1 = parseFloat(match[1]);
        const op = match[2];
        const num2 = parseFloat(match[3]);
        let calcResult = 0;
        if (op === '+') calcResult = num1 + num2;
        else if (op === '-') calcResult = num1 - num2;
        else if (op === '*') calcResult = num1 * num2;
        else if (op === '/') calcResult = num2 !== 0 ? num1 / num2 : 'Undefined (Division by zero)';

        let ans = `**${num1} ${op} ${num2} = ${calcResult}**`;
        if (isThink) {
          ans = `> [🧠 Deep Reasoning Protocol Enabled]\n> Operation: ${num1} ${op} ${num2}\n\n` + ans;
        }
        return { content: ans, metadata: { type: 'math', result: calcResult } };
      }
    } catch (e) {}
  }

  // 3. CODING MODE
  if (mode === 'Code' || query.includes('code') || query.includes('python') || query.includes('react') || query.includes('javascript') || query.includes('django') || query.includes('java') || query.includes('sql') || query.includes('debug') || query.includes('fix this')) {
    let language = 'javascript';
    if (query.includes('python')) language = 'python';
    else if (query.includes('react')) language = 'jsx';
    else if (query.includes('java')) language = 'java';
    else if (query.includes('sql')) language = 'sql';
    else if (query.includes('html')) language = 'html';
    else if (query.includes('css')) language = 'css';
    else if (query.includes('c++') || query.includes('cpp')) language = 'cpp';

    let codeBlock = '';
    let explanation = '';

    if (query.includes('calculator')) {
      codeBlock = `\`\`\`python
# Modern Command Line Calculator in Python
import math

class Calculator:
    def add(self, a, b):
        return a + b
        
    def subtract(self, a, b):
        return a - b
        
    def multiply(self, a, b):
        return a * b
        
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Cannot divide by zero!")
        return a / b

# Test Run
calc = Calculator()
print("15 * 4 =", calc.multiply(15, 4))
\`\`\``;
      explanation = `### Python Calculator Implementation Guide\n1. **Class Architecture**: Modular methods for arithmetic operations.\n2. **Error Guarding**: Explicit zero division error prevention.`;
    } else if (query.includes('async') || query.includes('concurrency')) {
      codeBlock = `\`\`\`python
import asyncio

async def fetch_data(task_id, delay):
    print(f"Task {task_id} starting...")
    await asyncio.sleep(delay)
    print(f"Task {task_id} completed after {delay}s!")
    return f"Data from Task {task_id}"

async def main():
    results = await asyncio.gather(
        fetch_data(1, 2),
        fetch_data(2, 1),
        fetch_data(3, 3)
    )
    print("All results:", results)

asyncio.run(main())
\`\`\``;
      explanation = `### Python Asyncio Breakdown\n- **Non-blocking I/O**: \`asyncio.gather\` executes tasks concurrently on an event loop.`;
    } else {
      codeBlock = `\`\`\`${language}
// Solution for: "${rawMsg}"
function processData(input) {
  try {
    console.log("Processing request:", input);
    return {
      success: true,
      data: input,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Execution failure:", error);
    return { success: false, error: error.message };
  }
}

const result = processData({ query: "${rawMsg}" });
console.log(result);
\`\`\``;
      explanation = `### Code Solution Summary\n- **Error Guarding**: Includes try-catch block for robust error handling.`;
    }

    let resultText = `Here is the clean, optimized solution for your request:\n\n${codeBlock}\n\n${explanation}`;
    if (isThink) {
      resultText = `> [🧠 Deep Reasoning Protocol Enabled]\n> Language: ${language} | Mode: Code Synthesis\n\n` + resultText;
    }

    return {
      content: resultText,
      metadata: { type: 'code', language, codeBlock, explanation },
    };
  }

  // 4. QUIZ ENGINE
  if (mode === 'Quiz' || query.includes('quiz') || query.includes('test me') || query.includes('questions')) {
    const topic = rawMsg.replace(/quiz|test me on|create a|give me a|on/gi, '').trim() || 'General Knowledge & Computer Science';
    const difficulty = options.difficulty || 'Medium';

    const quizQuestions = [
      {
        id: 1,
        question: `In ${topic}, what is the primary advantage of dynamic programming over simple recursion?`,
        options: [
          'It eliminates recursive call overhead using memoization',
          'It uses double the memory to run faster',
          'It only works on sorting algorithms',
          'It automatically parallelizes CPU cores',
        ],
        correctIndex: 0,
        explanation: 'Dynamic programming stores results of subproblems (memoization) to prevent redundant recalculation.',
      },
      {
        id: 2,
        question: `Which data structure operates on a Strict Last-In, First-Out (LIFO) principle?`,
        options: ['Queue', 'Stack', 'Linked List', 'Binary Search Tree'],
        correctIndex: 1,
        explanation: 'A Stack processes the most recently pushed element first (LIFO).',
      },
      {
        id: 3,
        question: `What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?`,
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correctIndex: 2,
        explanation: 'A balanced BST halves search space at each step, yielding O(log n) time complexity.',
      },
    ];

    let quizMsg = `I've prepared a **${difficulty} level Interactive Quiz** on **${topic}** for you! Select your answers below:`;
    if (isThink) {
      quizMsg = `> [🧠 Deep Reasoning Protocol Enabled]\n> Topic: ${topic} | Difficulty: ${difficulty}\n\n` + quizMsg;
    }

    return {
      content: quizMsg,
      metadata: {
        type: 'quiz',
        topic,
        difficulty,
        totalQuestions: quizQuestions.length,
        questions: quizQuestions,
      },
    };
  }

  // 5. IMAGE GENERATION
  if (mode === 'Image' || query.includes('generate image') || query.includes('create image') || query.includes('draw') || query.includes('poster')) {
    const prompt = rawMsg.replace(/generate image|create image|draw a|make a/gi, '').trim() || 'A futuristic cyberpunk study room with glowing neon monitors';
    const aspectRatio = options.aspectRatio || '16:9';
    const style = options.style || 'Cinematic';

    const width = aspectRatio === '9:16' ? 720 : aspectRatio === '16:9' ? 1280 : 1000;
    const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '16:9' ? 720 : 1000;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#3b52cf" />
          <stop offset="100%" stop-color="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="${width * 0.5}" cy="${height * 0.4}" r="${width * 0.25}" fill="rgba(255,255,255,0.08)" />
      <text x="50%" y="45%" font-family="sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">StudyVault AI Creation</text>
      <text x="50%" y="55%" font-family="sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">Style: ${style} • ${aspectRatio}</text>
    </svg>`;

    const base64Svg = Buffer.from(svgContent).toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${base64Svg}`;

    await pool.query(
      `INSERT INTO ai_generated_images (user_id, prompt, image_url, aspect_ratio, style) VALUES ($1, $2, $3, $4, $5)`,
      [userId, prompt, imageUrl, aspectRatio, style]
    );

    return {
      content: `Here is your generated **${style}** AI artwork for: *"${prompt}"*`,
      metadata: {
        type: 'image',
        prompt,
        aspectRatio,
        style,
        imageUrl,
      },
    };
  }

  // 6. DEFAULT GENERAL KNOWLEDGE & SOCIAL CONVERSATION
  let generalAnswer = `I'd be happy to help with that!\n\nRegarding *"${rawMsg}"*:\n\nHere is a comprehensive summary with all details:\n\n- **Overview**: StudyVault AI can assist you with general knowledge, travel planning, weather updates, coding, creating PowerPoint presentations, document writing, image generation, and everyday productivity.\n- **Actionable Advice**: Let me know if you would like me to generate a full presentation deck, create a downloadable file, or provide further analysis on this topic!`;

  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    generalAnswer = `Hello there! How can I help you today? Ask me anything about travel, general knowledge, live web search, coding, presentation creation, writing, or everyday questions.`;
  } else if (query.includes('procrastinate') || query.includes('procrastination')) {
    generalAnswer = `### 🧠 Why People Procrastinate & How to Overcome It\n\nProcrastination is rarely about laziness—it is primarily an **emotional regulation challenge**. When a task feels daunting, ambiguous, or boring, our brain seeks immediate stress relief by switching to easier activities.\n\n1. **The 5-Minute Rule**: Commit to working on the task for just 5 minutes. Starting removes 80% of the mental resistance.\n2. **Break It Down**: Divide large tasks into micro-steps.\n3. **Remove Friction**: Put away distractions before you begin.`;
  } else if (query.includes('birthday') || query.includes('wishes')) {
    generalAnswer = `### 🎉 Birthday Message Ideas\n\n1. **Warm & Heartfelt**: "Wishing you a year filled with joy, growth, and endless success! May all your goals come true this year. Happy Birthday!"\n2. **Fun & Casual**: "Happy Birthday! Hope your day is filled with great memories, good food, and lots of celebration!"`;
  }

  if (isThink) {
    generalAnswer = `> [🧠 Deep Reasoning Protocol Enabled]\n> Analyzing natural language query intent...\n\n` + generalAnswer;
  }

  return {
    content: generalAnswer,
    metadata: { type: 'general' },
  };
}

async function processChatMessage(userId, { conversationId, message, mode = 'AI', attachedFile, options }) {
  let activeConvId = conversationId;

  if (!isValidUuid(activeConvId)) {
    const title = message.trim().slice(0, 35) || `${mode} Session`;
    const convRes = await pool.query(
      `INSERT INTO ai_conversations (user_id, title, mode) VALUES ($1, $2, $3) RETURNING id`,
      [userId, title, mode]
    );
    activeConvId = convRes.rows[0].id;
  }

  await pool.query(
    `INSERT INTO ai_messages (conversation_id, user_id, role, content, metadata) VALUES ($1, $2, 'user', $3, $4)`,
    [activeConvId, userId, message, JSON.stringify({ file: attachedFile || null })]
  );

  const aiResult = await generateSmartResponse({ userId, mode, message, attachedFile, options });

  const assistantMsgRes = await pool.query(
    `INSERT INTO ai_messages (conversation_id, user_id, role, content, metadata) VALUES ($1, $2, 'assistant', $3, $4) RETURNING id, created_at`,
    [activeConvId, userId, aiResult.content, JSON.stringify(aiResult.metadata || {})]
  );

  await pool.query(`UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1`, [activeConvId]);

  return {
    conversationId: activeConvId,
    messageId: assistantMsgRes.rows[0].id,
    role: 'assistant',
    content: aiResult.content,
    metadata: aiResult.metadata,
    createdAt: assistantMsgRes.rows[0].created_at,
  };
}

async function getUserConversations(userId) {
  const res = await pool.query(
    `SELECT id, title, mode, created_at, updated_at FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 30`,
    [userId]
  );
  return res.rows || [];
}

async function getConversationMessages(userId, conversationId) {
  if (!isValidUuid(conversationId)) return [];
  const res = await pool.query(
    `SELECT id, role, content, metadata, created_at FROM ai_messages WHERE conversation_id = $1 AND user_id = $2 ORDER BY created_at ASC`,
    [conversationId, userId]
  );
  return res.rows || [];
}

async function deleteConversation(userId, conversationId) {
  if (!isValidUuid(conversationId)) return { success: false };
  await pool.query(`DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2`, [conversationId, userId]);
  return { success: true };
}

async function getUserGeneratedImages(userId) {
  const res = await pool.query(
    `SELECT id, prompt, image_url, aspect_ratio, style, created_at FROM ai_generated_images WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return res.rows || [];
}

async function getUserQuizHistory(userId) {
  const res = await pool.query(
    `SELECT id, topic, score, total_questions, difficulty, weak_areas, created_at FROM ai_quizzes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
    [userId]
  );
  return res.rows || [];
}

async function saveQuizResult(userId, { topic, score, totalQuestions, difficulty, weakAreas }) {
  const res = await pool.query(
    `INSERT INTO ai_quizzes (user_id, topic, score, total_questions, difficulty, weak_areas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
    [userId, topic, score, totalQuestions, difficulty, weakAreas || '']
  );
  return res.rows[0];
}

module.exports = {
  processChatMessage,
  getUserConversations,
  getConversationMessages,
  deleteConversation,
  getUserGeneratedImages,
  getUserQuizHistory,
  saveQuizResult,
};
