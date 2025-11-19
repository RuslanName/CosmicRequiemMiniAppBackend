import { AdminService } from '../modules/admin/admin.service';
import { UserService } from '../modules/user/user.service';
import { ENV } from './constants';

export async function initAdmin(
    adminService: AdminService,
    userService: UserService,
): Promise<void> {
    const adminVkId = process.env.ADMIN_VK_ID;
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

    if (!adminVkId) {
        console.warn('⚠️  ADMIN_VK_ID not set in .env. Admin initialization skipped.');
        return;
    }

    if (!adminPassword) {
        console.warn('⚠️  ADMIN_INITIAL_PASSWORD not set in .env. Admin initialization skipped.');
        return;
    }

    const adminUsername = process.env.ADMIN_USERNAME || adminVkId;

    try {
        let user = await userService.findByVkId(Number(adminVkId));

        if (!user) {
            console.log(`📝 Creating User for admin (VK ID: ${adminVkId})...`);
            user = await userService.create({
                vk_id: Number(adminVkId),
                first_name: 'Admin',
                last_name: 'System',
                sex: 0,
                avatar_url: '',
            });
        }

        const existingAdmin = await adminService.findByUserId(user.id);

        if (existingAdmin) {
            console.log('✅ Admin already exists');
            return;
        }

        console.log(`🔐 Creating system admin (username: ${adminUsername})...`);
        await adminService.createSystemAdmin(
            Number(adminVkId),
            adminUsername,
            adminPassword,
            user.id,
        );

        console.log('✅ System admin initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize admin:', error);
        throw error;
    }
}

