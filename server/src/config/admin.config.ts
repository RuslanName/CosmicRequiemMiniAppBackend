import { AdminService } from '../modules/admin/admin.service';
import { UserService } from '../modules/user/user.service';
import { ENV } from './constants';

export async function initAdmin(
  adminService: AdminService,
  userService: UserService,
): Promise<void> {
  const adminVkId = ENV.ADMIN_VK_ID;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  if (!adminVkId) {
    return;
  }

  if (!adminPassword) {
    return;
  }

  const adminUsername = ENV.ADMIN_USERNAME || adminVkId;

  try {
    let user = await userService.findByVkId(Number(adminVkId));

    if (!user) {
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
      return;
    }

    await adminService.createSystemAdmin(
      Number(adminVkId),
      adminUsername,
      adminPassword,
      user.id,
    );
  } catch (error) {
    console.error('❌ Failed to initialize admin:', error);
    throw error;
  }
}
