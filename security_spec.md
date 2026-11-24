# Security Specification — Evangelist Shepherd Ministry Platform

## 1. Data Invariants
1. **Admin Authority**: Only the verified ministry administrator (`sheperdphiri88@gmail.com` with `email_verified == true`) can create, update, or delete sermons (`sermons`), update public ministry/social links (`ministry_settings`), or read/update/delete private prayer requests and inquiries (`prayer_requests`).
2. **Draft Protection**: Non-admin visitors can only `get` or `list` sermons where `isPublished == true`. Unpublished drafts are restricted strictly to the verified admin.
3. **PII Isolation**: `prayer_requests` documents contain sender names, optional emails, optional phone numbers, and private prayer burdens. Public `get` and `list` access is completely forbidden; only the verified admin can read or list `prayer_requests`.
4. **Submission Integrity**: Public visitors can create `prayer_requests` only with `status == 'unread'`, `adminNote == ''`, valid server timestamps (`createdAt == request.time`, `updatedAt == request.time`), strict field length limits, and zero extra/ghost keys.
5. **Immutable Audit Fields**: `createdAt` (and `authorId` on sermons; `senderName`, `senderEmail`, `senderPhone`, `requestType`, `subject`, `message`, `isPrivate`, `createdAt` on prayer requests) remain immutable after creation.
6. **Path Variable Hardening**: Every single-document operation enforces `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Spoof**: User with `email == 'sheperdphiri88@gmail.com'` and `email_verified == false` attempts to publish a sermon -> `PERMISSION_DENIED`.
2. **Public Draft Leak**: Anonymous visitor tries `get` or `list` on a sermon with `isPublished: false` -> `PERMISSION_DENIED`.
3. **PII Blanket Read**: Authenticated non-admin user attempts `get` or `list` on `/prayer_requests` -> `PERMISSION_DENIED`.
4. **Shadow/Ghost Field on Sermon Create**: Admin attempts to include extra key `isSystemVerified: true` in `sermons` -> `PERMISSION_DENIED`.
5. **Shadow/Ghost Field on Prayer Request Create**: Visitor attempts to include `isApproved: true` in `prayer_requests` -> `PERMISSION_DENIED`.
6. **Status Shortcutting on Prayer Request Create**: Visitor submits a prayer request with `status: 'replied'` or non-empty `adminNote` -> `PERMISSION_DENIED`.
7. **Timestamp Forgery**: Client submits `createdAt` set to a past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
8. **Author Spoofing on Sermon**: Admin attempts to set `authorId` to another UID instead of `request.auth.uid` -> `PERMISSION_DENIED`.
9. **Value Poisoning / Oversized String**: Visitor submits a 10,000-char `message` or 500-char `senderName` in `prayer_requests` -> `PERMISSION_DENIED`.
10. **Path ID Poisoning**: Attacker attempts `setDoc` with a 300-character or special-character document ID -> `PERMISSION_DENIED`.
11. **Immortal Field Tampering**: Admin attempts to alter `createdAt` or `senderEmail` when updating a `prayer_request` status -> `PERMISSION_DENIED`.
12. **Unauthorized Settings Hijack**: Non-admin user attempts to overwrite `ministry_settings/main` social URLs -> `PERMISSION_DENIED`.
