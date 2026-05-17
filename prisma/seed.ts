import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Define default admin credentials
  const defaultUsername = 'admin'
  const defaultPassword = 'admin123'
  
  // Hash the password with bcryptjs (rounds = 12, matching lib/auth.ts)
  const hashedPassword = await bcrypt.hash(defaultPassword, 12)

  // Upsert the admin user (create if doesn't exist, update if it does)
  const adminUser = await prisma.user.upsert({
    where: { username: defaultUsername },
    update: { password: hashedPassword },
    create: {
      username: defaultUsername,
      password: hashedPassword,
    },
  })

  console.log(`✅ Admin user seeded successfully!`)
  console.log(`👤 Username: ${adminUser.username}`)
  console.log(`🔑 Password: ${defaultPassword}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
