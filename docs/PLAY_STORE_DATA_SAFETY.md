# Google Play Store Data Safety Questionnaire Guide for StudyVault

This document specifies the exact answers required when completing the **Data Safety** form on Google Play Console for StudyVault.

---

## 1. Overview Checklist
- **Is data collected?** Yes.
- **Is data shared with third parties?** No (data is only transferred to necessary infrastructure service providers such as FCM for push notifications).
- **Is all user data encrypted in transit?** Yes (HTTPS/TLS 1.3 for all REST API endpoints and WSS for WebSockets).
- **Do you provide a way for users to request that their data be deleted?** Yes (in-app delete account button + REST endpoint `DELETE /api/auth/account`).

---

## 2. Specific Data Types Collected

| Data Type | Category | Collected? | Shared? | Purpose | Ephemeral? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Name** | Personal info | Yes | No | Account management, student profile | No |
| **Email address** | Personal info | Yes | No | Account login, password reset, security | No |
| **User IDs** | Personal info | Yes | No | Account identification | No |
| **Phone number** | Personal info | Optional | No | Account recovery (if provided) | No |
| **Messages** | Messages | Yes | No | In-app 1-on-1 peer messaging | No |
| **Photos** | Photos & Videos | Yes | No | Profile pictures, Startup ideas, Stories, Memories | No (Stories expire in 24h) |
| **Videos** | Photos & Videos | Yes | No | Startup ideas, Stories, Reels | No |
| **Voice/Audio** | Audio files | Yes (Live only) | No | Real-time WebRTC audio calls | Yes (Not stored) |
| **App Activity** | App info | Yes | No | Study sessions, quiz attempts, streaks, XP | No |
| **Crash logs** | Diagnostics | Yes | No | App stability and troubleshooting | No |
| **Device IDs** | Device / identifiers | Yes | No | Push notifications (FCM device token) | No |

---

## 3. Permissions Justification for Play Console Review

- `CAMERA`: Required strictly for live WebRTC video calling, capturing photos/videos for Stories, and setting profile avatars.
- `RECORD_AUDIO` & `MODIFY_AUDIO_SETTINGS`: Required strictly for real-time WebRTC audio/video calling.
- `READ_MEDIA_IMAGES` & `READ_MEDIA_VIDEO`: Required on Android 13+ to allow users to select media from their gallery for study materials, stories, and Startup Wall posts.
- `POST_NOTIFICATIONS`: Required on Android 13+ to notify users of incoming peer calls, chat messages, and daily study reminders.
- `INTERNET` & `ACCESS_NETWORK_STATE`: Required for cloud synchronization, real-time messaging, and online quizzes.

---

## 4. Account Deletion URL & Compliance
- **In-App Path**: Settings > Profile > Account > Delete Account
- **Web Deletion Request URL**: `https://studyvault.app/account-deletion`
- **Data purged upon deletion**: All personal identifiers, hashed credentials, study logs, messages, stories, memories, and uploaded files are irreversibly deleted from the database.
