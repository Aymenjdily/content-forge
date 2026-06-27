# Data Models

## Prisma Schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  jobs          Job[]
  templates     Template[]
}

model Job {
  id            String    @id @default(cuid())
  triggerDevId  String?   @unique
  userId        String
  user          User      @relation(fields: [userId], references: [id])

  // Input
  topic         String
  sourceUrl     String?
  config        Json      // tone, length, platforms, etc.

  // Status
  status        JobStatus @default(PENDING)
  progress      Int       @default(0) // 0-100
  currentStage  String?

  // Output
  research      Json?
  outline       Json?
  draft         String?   @db.Text
  imageUrl      String?
  seoMeta       Json?
  scheduledPosts Json?

  // Timestamps
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  completedAt   DateTime?

  // Relations
  stages        JobStage[]
  logs          JobLog[]
}

model JobStage {
  id            String    @id @default(cuid())
  jobId         String
  job           Job       @relation(fields: [jobId], references: [id])
  name          String    // research, writeDraft, createImage, etc.
  status        StageStatus @default(PENDING)
  startedAt     DateTime?
  completedAt   DateTime?
  durationMs    Int?
  output        Json?
  error         String?
}

model JobLog {
  id            String    @id @default(cuid())
  jobId         String
  job           Job       @relation(fields: [jobId], references: [id])
  stage         String?
  level         LogLevel
  message       String
  metadata      Json?
  createdAt     DateTime  @default(now())
}

model Template {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  description   String?
  config        Json      // preset configuration
  isPublic      Boolean   @default(false)
  createdAt     DateTime  @default(now())
}

enum JobStatus {
  PENDING
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum StageStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  SKIPPED
}

enum LogLevel {
  INFO
  WARN
  ERROR
  DEBUG
}
```
