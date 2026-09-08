# StudyVault — Privacy Policy

**Effective Date:** September 5, 2026  
**Last Updated:** September 5, 2026  

Welcome to **StudyVault** ("we", "our", or "us"). StudyVault is a mobile learning and collaboration platform designed for students and educators. We are committed to protecting your privacy and ensuring your personal data is handled safely, transparently, and in full compliance with global privacy regulations, including GDPR, CCPA, and Google Play Developer Policies.

---

## 1. Information We Collect

### A. Information You Provide Directly
- **Account Data**: Full name, username, email address, student roll number, phone number (optional), and securely hashed passwords.
- **Profile Information**: Profile biography, avatar pictures, study goals, academic interests, and subject preferences.
- **User-Generated Content**:
  - Study notes and study task items.
  - Startup Wall ideas (text, images, and videos).
  - Stories and Memories (ephemeral and curated photos/videos).
  - Quiz answers, scores, and active study session progress.
  - Direct messages and conversation history with peers.
  - User reports and moderation inquiries.

### B. Device & Technical Information
- **Device Identifiers**: Operating system version, unique device tokens for push notifications (FCM tokens).
- **Media Hardware Access**: Camera and Microphone access requested solely during active audio/video calls or media capture for stories/posts.
- **Crash & Diagnostic Data**: Technical error logs, app performance telemetry, and network response latencies.

---

## 2. How We Use Your Information

We process your data strictly to provide, maintain, and secure StudyVault features:
1. **Authentication & Security**: Verifying user identity, enforcing session timeouts, and preventing duplicate or unauthorized accounts.
2. **Learning Vault**: Tracking active study sessions, computing accurate study time, maintaining streaks and XP, and enforcing the 24-hour daily quiz level progression.
3. **Peer Collaboration & Messaging**: Delivering real-time chat messages, typing indicators, read receipts, and WebRTC peer-to-peer audio and video calls.
4. **Safety & Moderation**: Detecting and preventing harassment, abusive content, automated spam, and protecting minors under our community guidelines.

---

## 3. Data Storage & Retention

- **Database Persistence**: All user accounts, study tasks, notes, messages, and quiz progress are stored in secure, encrypted relational database clusters.
- **Media Storage**: Photos and videos are stored in secure object storage with strict MIME type validation and malware prevention.
- **Ephemeral Content**: Stories expire automatically after 24 hours, unless explicitly saved to a user's curated "Memories".
- **Retention**: Account data is retained as long as your account remains active. If an account is inactive or requested for deletion, data is purged according to our retention rules.

---

## 4. In-App Account Deletion & Rights

StudyVault guarantees your right to be forgotten:
- You can request immediate, permanent account deletion directly within the application (**Profile > Settings > Account > Delete Account**) or by calling `DELETE /api/auth/account`.
- Upon deletion:
  - Your authentication credentials and tokens are immediately revoked.
  - All profile records, personal messages, study notes, tasks, stories, and media references are permanently deleted via database cascading delete.
  - Associated uploaded media files are scheduled for automatic storage purging.

---

## 5. Third-Party Services & Data Sharing

We **never** sell, rent, or trade your personal data to advertisers. We share information only with essential infrastructure providers:
- **Push Notifications**: Google Firebase Cloud Messaging (FCM) to deliver incoming call alerts, message notifications, and study reminders.
- **WebRTC Signaling**: Ephemeral socket signaling servers for peer-to-peer media streaming (audio and video streams are transmitted directly between peers without server recording).

---

## 6. Children and Student Privacy

StudyVault is built for students. We implement strict safety measures:
- Explicit content filtering and automated moderation on public feeds and avatars.
- User reporting and blocking capabilities to ensure student safety.
- We do not knowingly collect personal information from children under the age of 13 without parental consent.

---

## 7. Contact Information

For any privacy-related questions, data export requests, or security disclosures:
- **Email**: privacy@studyvault.app / support@studyvault.app
- **Address**: StudyVault Platform Team
