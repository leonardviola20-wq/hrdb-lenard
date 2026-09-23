-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "status" TEXT,
    "dateStarted" TIMESTAMP(3),
    "employerId" INTEGER,
    "address" TEXT,
    "age" INTEGER,
    "biometricNo" TEXT,
    "branch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT,
    "emergencyAddress" TEXT,
    "emergencyName" TEXT,
    "emergencyNumber" TEXT,
    "emergencyRelation" TEXT,
    "employeeCode" TEXT NOT NULL,
    "endDate" TIMESTAMP(3),
    "firstName" TEXT NOT NULL,
    "gender" TEXT,
    "lastName" TEXT NOT NULL,
    "maritalStatus" TEXT,
    "middleName" TEXT,
    "mobileNumber" TEXT,
    "pagIbigNumber" TEXT,
    "philHealth" TEXT,
    "photoUrl" TEXT,
    "remarks" TEXT,
    "sssNumber" TEXT,
    "tinNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3),

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "branches" TEXT,

    CONSTRAINT "employer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_biometricNo_key" ON "employee"("biometricNo");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employeeCode_key" ON "employee"("employeeCode");

-- CreateIndex
CREATE INDEX "employee_employerId_idx" ON "employee"("employerId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
