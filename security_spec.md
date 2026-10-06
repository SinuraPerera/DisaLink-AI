# DisaLink AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: All paths in Firestore are denied by default (`match /{document=**} { allow read, write: if false; }`).
2. **Authenticated Coordinator Identity**: Only authenticated users (`request.auth != null`) may create, read, update, or delete records in `/coordinator_records/{recordId}` and `/coordinator_profiles/{profileId}`.
3. **Strict Ownership Isolation**: A user can only read (`get`, `list`), create, update, or delete a `CoordinatorRecord` or `CoordinatorProfile` where `uid == request.auth.uid` (and `profileId == request.auth.uid` for profiles). Blanket `isSignedIn()` reads without ownership checks are strictly forbidden.
4. **Schema & Volumetric Bounds**:
   - Every `CoordinatorRecord` must contain exact required keys (`uid`, `recordType`, `targetId`, `title`, `summaryText`, `urgency`, `status`, `createdAt`, `updatedAt`) with `hasAll` and `hasOnly`, bounded string sizes (`title <= 200`, `summaryText <= 4000`), and regex-validated IDs (`^[a-zA-Z0-9_\-]+$`).
   - Every `CoordinatorProfile` must contain exact required keys (`uid`, `fullName`, `role`, `division`, `district`, `badgeNumber`, `dutyStatus`, `createdAt`, `updatedAt`) with `hasAll` and `hasOnly`, bounded string sizes (`fullName <= 120`, `division <= 80`, `district <= 60`, `badgeNumber <= 40`), enum-validated `role` and `dutyStatus`, and regex-validated `badgeNumber`.
5. **Temporal & Immutable Integrity**: `createdAt` and `updatedAt` must equal `request.time` on creation; `uid`, `recordType`, `targetId`, and `createdAt` are immutable on update, and `updatedAt` must equal `request.time`.
6. **Terminal State Locking**: Once a `CoordinatorRecord` reaches `status == 'archived'`, no further updates are permitted.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 01 (Unauthenticated Write)**: `auth = null` attempting `create` on `/coordinator_records/rec_1`.
2. **Payload 02 (Unverified Email Spoof)**: `auth = { uid: 'user_1', token: { email_verified: false } }` attempting `create`.
3. **Payload 03 (Identity Spoofing on Create)**: `auth.uid = 'user_1'` creating record with `uid: 'user_2'`.
4. **Payload 04 (Shadow/Ghost Field Injection)**: Payload includes extra unauthorized key `isAdmin: true`.
5. **Payload 05 (Path Variable ID Poisoning)**: Document ID contains invalid characters or >128 chars (`rec_bad$id!`).
6. **Payload 06 (Volumetric Denial-of-Wallet String)**: `summaryText` exceeds 4000 characters.
7. **Payload 07 (Invalid Enum Value)**: `recordType` set to `'malicious_type'` or `status` set to `'hacked'`.
8. **Payload 08 (Urgency Out-of-Bounds)**: `urgency` set to `99` or `-1` instead of `1..5`.
9. **Payload 09 (Forged Client Timestamp)**: `createdAt` set to a past or future timestamp instead of `request.time`.
10. **Payload 10 (Cross-Tenant Read/List Leak)**: `auth.uid = 'user_1'` attempting `get` or `list` on records owned by `'user_2'`.
11. **Payload 11 (Immutable Field Mutation on Update)**: Attempting to mutate `uid` or `createdAt` during an `update`.
12. **Payload 12 (Terminal State Bypass)**: Attempting to update a document whose existing `status` is already `'archived'`.
