### User (server/models/user.model.js)

- Purpose: Auth, profile, social graph, premium flags.
- Important fields:
  - firstName, lastName, username, email, password (hashed) — core auth/profile.
  - role: Array["student"|"teacher"|"admin"] — permission roles.
  - profile: { bio, avatar, isAvatarGif, avatarHistory, connections }.
  - socials: followers, following, friends, friendRequests (arrays of ObjectId -> User).
  - premium: isPremium, premiumSince, premiumExpiry, expiryNotified.
  - refreshToken (optional server side), studentInfo (assignedCourse -> Course).
- Relations:
  - referenced by content models as uploader/creator.
  - social relationships are self-referential (User -> User).
- Indexes/Notes:
  - username/email unique and indexed; username stored lowercase.
  - Password hashing done in pre('save') middleware; matchPassword method uses bcrypt.

### Session (server/models/session.model.js)

- Purpose: Store refresh session tokens and metadata for rotation/revocation.
- Key fields: user (User), tokenId, refreshTokenHash, deviceInfo, expiresAt, revoked, replacedBy (Session).
- Usage: controllers create sessions on login; revoke/rotate on logout or refresh.

### UserToken (server/models/userToken.model.js)

- Purpose: Store OAuth tokens (Google Drive access) per user.
- Key fields: userId (unique), googleTokens (access_token, refresh_token, expiry_date...), isActive.
- Usage: Drive integration reads/writes here to call Google APIs on behalf of users.

### Course (server/models/course.model.js)

- Purpose: Course/curriculum container used by semesters/subjects and content tagging.
- Key fields: title, description, semesterCount, type (BE/BSC/PG/Commerce), creator (User).

### Semester (server/models/semester.model.js)

- Purpose: Represents logical semester linked to a Course.
- Fields: title, course (Course), creator (User), description.

### Subject (server/models/subject.model.js)

- Purpose: Academic subject connected to a Semester and Course.
- Fields: title, semester (Semester), course (Course), creator.

### Notes / AcademicNote / Timetables / Timetable(s) / QuestionPaper / Syllabus

- Purpose: Primary content models. They share a consistent structure:
  - metadata (title, description, course, subject, semester, degreeType, academicYear)
  - file info (fileType, fileSize, originalFileName)
  - storage references (googleDriveFileId or fileId, publicUrl, downloadUrl, embedUrl/directUrl as needed)
  - uploader (User reference), isAdminUploaded, isApproved, approvedBy, approvedAt, rejectionReason
  - analytics (downloadCount, viewCount)
  - status: pending/approved/rejected (or domain-specific variants)
- Notes (notes.model.js): has dedicated Google Drive metadata and text search indexes; methods include increment counters, approve/reject, and search helpers.
- AcademicNote (academicNote.model.js): similar to Notes but slightly different enums and 'type' (Official/Unofficial).
- QuestionPaper (questionPaper.model.js): exam-specific metadata (examYear, examType, duration, maxMarks) and additional distinct/aggregation helper statics.
- Syllabus (syllabus.model.js): stores fileId and academic metadata (credits, prerequisites).
- Timetable/Timetables (timetable.model.js and timetables.model.js): two similar schemas exist in the repo — one (`Timetable`) is a simpler timetable model; `Timetables` is a richer model with version history, notifications, googleDriveFileId fields. Be aware of both; controllers may use one or the other depending on route naming.

### Blog, Project, News, Notice

- Purpose: Social/content features. Blog and Project reference authors (User) and store cover images (Cloudinary URL). News/Notice maintain attachments arrays.

### Contact

- Purpose: Contact form records; can be associated with a userId or anonymous.

### Notification (server/models/notification.model.js)

- Purpose: Persistent user notifications (recipient, sender, type, message, link, isRead, isCleared).
- Notification types include follow, friend_request, blog_comment, premium_approved, new_news/new_notice, etc.

### PremiumRequest & RoleRequest

- Purpose: Capture user requests for premium membership and role upgrades; both include status fields and enforce uniqueness of pending requests via indexes.

## Relationships summary

- User 1..\* -> (uploads) -> Notes/AcademicNote/QuestionPaper/Syllabus/Timetables/Project/Blog
- Course 1..\* -> Semester -> Subject
- Content models reference Course/Subject by name or by Course ObjectId depending on the model (some models store course as String for text-query friendliness; others reference Course ObjectId).
- UserToken (1:1) -> User (Google tokens)
- Session (1..\*) -> User (sessions per device)

Note: Some models (Notes, Timetables) store course/subject as plain strings for easier full-text search and loose coupling; others (Subject, Semester) link by ObjectId. When implementing joins, controllers use either populate() or text search depending on model.

## Common patterns & flows

1. Upload & Approval

- User uploads a file through controller -> file is uploaded to Google Drive or Cloudinary -> model instance created with storage IDs/URLs and status: pending.
- If isAdminUploaded === true, pre-save middleware auto-approves and sets isApproved/status accordingly.
- Admin reviews pending items via admin routes -> approve() or reject() methods on model change state, set approvedBy, approvedAt, and optionally send Notification records.

2. Search & Retrieval

- Content models define text indices (title, description, tags). Controllers use $text queries; models provide static helpers (searchNotes, searchQuestionPapers, searchTimetables).
- Results populate uploader details (firstName, lastName, username) for display.

3. Auth / Session / Token rotation

- On login: create User session record (Session model) with refreshTokenHash, tokenId, device info, expiresAt.
- On token rotation: mark previous session.replacedBy and optionally revoke old session.
- Google Drive access: tokens stored in UserToken and used to call Drive APIs. Refresh logic should update UserToken.googleTokens.

4. Notifications

- Controllers create Notification documents for recipient users. Notification model stores message, link and type. Real-time push (socket/push) is implemented at runtime by emitting events and optionally persisting Notification.
