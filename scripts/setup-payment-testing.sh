#!/bin/bash

# Payment Features Testing Setup Script
# This script prepares the database with comprehensive test data

echo "🚀 Property CRM - Payment Features Testing Setup"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from project root directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install bcryptjs @types/bcryptjs --save-dev
echo "✅ Dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "🔧 Step 2: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 3: Run migrations
echo "🗄️  Step 3: Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations applied"
echo ""

# Step 4: Compile and run seed script
echo "🌱 Step 4: Seeding database with payment test data..."
echo ""
npx tsx prisma/seed-payment-features.ts
echo ""

# Step 5: Success message
echo "✨ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Start your development server: npm run dev"
echo "  2. Login with: landlord@test.com / password123"
echo "  3. Navigate to: /financials/rent-collection"
echo "  4. Follow the testing guide: docs/TESTING_GUIDE.md"
echo ""
echo "🎉 Happy Testing!"
