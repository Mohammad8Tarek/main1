import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Create a super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            roles: [Role.super_admin, Role.admin],
            status: 'ACTIVE',
        },
    });
    console.log(`Created/updated admin user: ${adminUser.username}`);
    
    // Create default system variables
    const defaultSettings = [
        { key: 'default_language', value: 'en' },
        { key: 'ai_suggestions', value: 'false' },
    ];

    for (const setting of defaultSettings) {
        const variable = await prisma.systemVariable.upsert({
            where: { key: setting.key },
            update: {},
            create: {
                key: setting.key,
                value: setting.value,
            },
        });
        console.log(`Created/updated system variable: ${variable.key}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        // FIX: Cast `process` to `any` to resolve type error for 'exit' due to missing Node.js types.
        (process as any).exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });