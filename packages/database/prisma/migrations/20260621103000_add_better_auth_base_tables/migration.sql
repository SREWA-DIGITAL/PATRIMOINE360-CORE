-- CreateTable
CREATE TABLE "BetterAuthUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "userMetadata" JSONB,
    "appMetadata" JSONB,
    "invitedAt" TIMESTAMP(3),
    "lastSignInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetterAuthUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetterAuthSession" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BetterAuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetterAuthAccount" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetterAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetterAuthVerification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetterAuthVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetterAuthUser_email_key" ON "BetterAuthUser"("email");

-- CreateIndex
CREATE INDEX "BetterAuthUser_emailVerified_idx" ON "BetterAuthUser"("emailVerified");

-- CreateIndex
CREATE INDEX "BetterAuthUser_lastSignInAt_idx" ON "BetterAuthUser"("lastSignInAt");

-- CreateIndex
CREATE UNIQUE INDEX "BetterAuthSession_token_key" ON "BetterAuthSession"("token");

-- CreateIndex
CREATE INDEX "BetterAuthSession_userId_idx" ON "BetterAuthSession"("userId");

-- CreateIndex
CREATE INDEX "BetterAuthSession_expiresAt_idx" ON "BetterAuthSession"("expiresAt");

-- CreateIndex
CREATE INDEX "BetterAuthAccount_userId_idx" ON "BetterAuthAccount"("userId");

-- CreateIndex
CREATE INDEX "BetterAuthAccount_providerId_accountId_idx" ON "BetterAuthAccount"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "BetterAuthVerification_identifier_idx" ON "BetterAuthVerification"("identifier");

-- CreateIndex
CREATE INDEX "BetterAuthVerification_expiresAt_idx" ON "BetterAuthVerification"("expiresAt");

-- AddForeignKey
ALTER TABLE "BetterAuthUser" ADD CONSTRAINT "BetterAuthUser_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetterAuthSession" ADD CONSTRAINT "BetterAuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BetterAuthUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetterAuthAccount" ADD CONSTRAINT "BetterAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BetterAuthUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
