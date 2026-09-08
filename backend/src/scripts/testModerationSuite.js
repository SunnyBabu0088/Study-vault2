const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Load database schema & moderation service
const { initializeSchema } = require('../config/schema');
const { pool } = require('../config/database');
const moderationService = require('../services/moderationService');
const postService = require('../services/postService');
const reelService = require('../services/reelService');
const storyService = require('../services/storyService');
const highlightService = require('../services/highlightService');
const userService = require('../services/userService');
const messageService = require('../services/messageService');
const reportService = require('../services/reportService');
const privacyService = require('../services/privacyService');

async function runTestSuite() {
    console.log('=====================================================');
    console.log('   STUDYVAULT MODERATION & SAFETY SUITE VERIFICATION ');
    console.log('=====================================================\n');

    await initializeSchema();

    // Create test user fixtures
    const user1Res = await pool.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ('mod_user1', 'mod_user1@test.com', 'hash123')
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
         RETURNING id, username, email`
    );
    const user1 = user1Res.rows[0];

    const user2Res = await pool.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ('mod_user2', 'mod_user2@test.com', 'hash123')
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
         RETURNING id, username, email`
    );
    const user2 = user2Res.rows[0];

    let passed = 0;
    let total = 0;

    const test = async (name, fn) => {
        total++;
        try {
            await fn();
            console.log(` ✓ [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(` ✗ [FAIL] ${name}:`, err.message);
        }
    };

    // Helper for expecting moderation errors
    const expectModerationError = async (fn) => {
        try {
            await fn();
        } catch (err) {
            if (err.message && (
                err.message.includes('guidelines') || 
                err.message.includes('blocked') || 
                err.message.includes("can't be sent") || 
                err.message.includes('allowed') ||
                err.message.includes('restricted') ||
                err.message.includes('violations')
            )) {
                return; // Expected moderation error
            }
            throw new Error(`Unexpected error: ${err.message}`);
        }
        throw new Error('Expected function to throw moderation error, but it succeeded.');
    };

    // 1. Normal student text & notes → allowed
    await test('Normal student text & study notes → allowed', async () => {
        const text = "Studying linear algebra and calculus for tomorrow's exam! #study #math";
        const result = moderationService.moderateText(text);
        assert.strictEqual(result.allowed, true);
        assert.strictEqual(result.status, 'APPROVED');
    });

    // 2. Educational anatomy/biology diagram → allowed
    await test('Educational biology/anatomy diagram → allowed', async () => {
        const text = "Anatomy and human reproductive system structure diagram for biology assignment.";
        const result = moderationService.moderateText(text, 'academic');
        assert.strictEqual(result.allowed, true);
    });

    // 3. Nude / explicit text → rejected
    await test('Explicit pornographic text → rejected', async () => {
        const text = "Check out this explicit xxx pornography video stream!";
        const result = moderationService.moderateText(text);
        assert.strictEqual(result.allowed, false);
        assert.strictEqual(result.status, 'REJECTED');
    });

    // 4. Zero tolerance minor sexual protection → rejected
    await test('Zero tolerance minor sexual protection → rejected immediately', async () => {
        const text = "Explicit child sexual minor nude content link";
        const result = moderationService.moderateText(text);
        assert.strictEqual(result.allowed, false);
        assert.strictEqual(result.isMinorProtection, true);
    });

    // 5. Image scanning - safe notes image → allowed
    await test('Normal student photo / notes screenshot → allowed', async () => {
        const buf = Buffer.from('STUDY_NOTES_IMAGE_DATA_SAFE');
        const result = await moderationService.moderateImage(buf, 'math_notes.png');
        assert.strictEqual(result.allowed, true);
        assert.strictEqual(result.status, 'APPROVED');
    });

    // 6. Image scanning - nude image fixture → rejected
    await test('Nude image fixture → rejected', async () => {
        const buf = Buffer.from('moderation_test_nude_image_synthetic_fixture');
        const result = await moderationService.moderateImage(buf, 'nude_test_photo.jpg');
        assert.strictEqual(result.allowed, false);
        assert.strictEqual(result.status, 'REJECTED');
    });

    // 7. Video multi-frame sampling → rejected if explicit frame detected
    await test('Explicit video multi-frame sampling → rejected', async () => {
        const tempVideo = path.join(__dirname, 'temp_test_video.mp4');
        fs.writeFileSync(tempVideo, 'moderation_test_explicit_video');
        try {
            const result = await moderationService.moderateVideo(tempVideo);
            assert.strictEqual(result.allowed, false);
            assert.strictEqual(result.status, 'REJECTED');
        } finally {
            if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
        }
    });

    // 8. Post creation with unsafe media → throws guidelines error
    await test('Post creation with unsafe text/media → blocked by backend', async () => {
        await expectModerationError(async () => {
            await postService.createPost({
                userId: user1.id,
                title: 'Check out explicit xxx pornography content',
                content: 'Unsafe post'
            });
        });
    });

    // 9. Reel creation with unsafe caption → blocked by backend
    await test('Reel creation with unsafe caption → blocked by backend', async () => {
        await expectModerationError(async () => {
            await reelService.createReel(user1.id, {
                video_url: 'http://localhost:5000/uploads/public/test.mp4',
                caption: 'Explicit xxx pornography video reel'
            });
        });
    });

    // 10. Story creation with unsafe content → blocked by backend
    await test('Story creation with unsafe content → blocked by backend', async () => {
        await expectModerationError(async () => {
            await storyService.createStory(user1.id, {
                content: 'Unsafe story with xxx pornography content'
            });
        });
    });

    // 11. Profile picture moderation → rejected avatar retains old avatar
    await test('Unsafe profile picture → rejected with clear message', async () => {
        const tempAvatar = path.join(process.cwd(), 'uploads', 'explicit_nude_avatar.jpg');
        fs.mkdirSync(path.dirname(tempAvatar), { recursive: true });
        fs.writeFileSync(tempAvatar, 'moderation_test_nude_image');

        try {
            await expectModerationError(async () => {
                await userService.updateUser(user1.id, {
                    avatarUrl: 'http://localhost:5000/uploads/explicit_nude_avatar.jpg'
                });
            });
        } finally {
            if (fs.existsSync(tempAvatar)) fs.unlinkSync(tempAvatar);
        }
    });

    // 12. Highlight moderation check → rejected story cannot enter highlight
    await test('Rejected story cannot enter Highlight', async () => {
        const rejectedStoryRes = await pool.query(
            `INSERT INTO stories (user_id, content, moderation_status) VALUES ($1, 'bad story', 'REJECTED') RETURNING id`,
            [user1.id]
        );
        const rejectedStoryId = rejectedStoryRes.rows[0].id;

        try {
            await highlightService.createHighlight(user1.id, 'My Highlight', [rejectedStoryId]);
            assert.fail('Should have prevented rejected story in highlight');
        } catch (err) {
            assert(err.message.includes('Rejected content cannot be added'));
        }
    });

    // 13. Chat media moderation → unsafe attachment blocked
    await test('Unsafe chat attachment → blocked before delivery', async () => {
        const convRes = await pool.query(`INSERT INTO conversations DEFAULT VALUES RETURNING id`);
        const convId = convRes.rows[0].id;
        await pool.query(`INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [convId, user1.id, user2.id]);

        await expectModerationError(async () => {
            await messageService.createMessage(user1.id, convId, 'Check xxx pornography link attachment http://localhost:5000/uploads/nude.jpg');
        });
    });

    // 14. User Report System → stores report with correct category
    await test('User Report System → stores report successfully', async () => {
        const report = await reportService.createReport(user1.id, {
            entity_type: 'post',
            entity_id: user1.id,
            reason: 'nudity_sexual',
            description: 'Reported inappropriate media post.'
        });
        assert.strictEqual(report.reason, 'nudity_sexual');
        assert.strictEqual(report.status, 'pending');
    });

    // 15. Blocked accounts enforcement on backend feed queries
    await test('Blocked user content → excluded from feed queries on backend', async () => {
        await privacyService.blockUser(user1.id, user2.id);
        const posts = await postService.getPostsForUser(user1.id);
        const user2Posts = posts.filter(p => p.user_id === user2.id);
        assert.strictEqual(user2Posts.length, 0);
    });

    console.log(`\n-----------------------------------------------------`);
    console.log(` SUMMARY: ${passed} / ${total} MODERATION TESTS PASSED`);
    console.log(`-----------------------------------------------------\n`);

    if (passed === total) {
        console.log('✅ ALL MODERATION PIPELINE TESTS PASSED CLEANLY.');
    } else {
        console.error('❌ SOME MODERATION TESTS FAILED.');
        process.exit(1);
    }
}

runTestSuite().catch((err) => {
    console.error('Test suite runner failed:', err);
    process.exit(1);
});
