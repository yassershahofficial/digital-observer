import connectDB from './mongodb';
import Admin from '@/models/Admin';

/**
 * Auto-creates superadmin from SUPERADMIN_EMAIL on first run
 * This function is idempotent - safe to call multiple times
 */
export async function createSuperadminIfNotExists() {
  try {
    await connectDB();
    
    const superadminEmail = process.env.SUPERADMIN_EMAIL?.toLowerCase().trim();
    
    if (!superadminEmail) {
      console.warn('SUPERADMIN_EMAIL not set in environment variables');
      return;
    }

    // Check if superadmin already exists
    const existingAdmin = await Admin.findOne({ email: superadminEmail });
    
    if (!existingAdmin) {
      // Create superadmin
      await Admin.create({
        email: superadminEmail,
        role: 'superadmin',
      });
      console.log(`✅ Superadmin created: ${superadminEmail}`);
    } else if (existingAdmin.role !== 'superadmin') {
      // Update existing admin to superadmin
      existingAdmin.role = 'superadmin';
      await existingAdmin.save();
      console.log(`✅ Existing admin promoted to superadmin: ${superadminEmail}`);
    }
  } catch (error) {
    console.error('Error creating superadmin:', error);
    // Don't throw - allow app to continue even if superadmin creation fails
  }
}
