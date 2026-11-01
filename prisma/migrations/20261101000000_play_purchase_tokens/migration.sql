CREATE TABLE "PlayPurchase" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayPurchase_pkey" PRIMARY KEY ("tokenHash")
);

CREATE INDEX "PlayPurchase_userId_idx" ON "PlayPurchase"("userId");

CREATE TABLE "RazorpayPayment" (
    "paymentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpayPayment_pkey" PRIMARY KEY ("paymentId")
);

CREATE INDEX "RazorpayPayment_userId_idx" ON "RazorpayPayment"("userId");

ALTER TABLE "IdentityVector" ALTER COLUMN "userId" DROP DEFAULT;
