import connectDB from './mongodb';
import SiteConfig from '@/models/SiteConfig';

/**
 * Ensure only one siteConfig document exists (cleanup duplicates)
 * Keeps the most recently updated document
 */
export async function ensureSingleSiteConfig() {
  try {
    await connectDB();
    
    const configs = await SiteConfig.find().sort({ updatedAt: -1 });
    
    if (configs.length > 1) {
      console.log(`⚠️  Found ${configs.length} siteConfig documents. Cleaning up duplicates...`);
      
      // Keep the most recently updated one
      const keepConfig = configs[0];
      
      // Delete the rest
      const idsToDelete = configs.slice(1).map(c => c._id);
      const deleteResult = await SiteConfig.deleteMany({ _id: { $in: idsToDelete } });
      
      console.log(`✅ Removed ${deleteResult.deletedCount} duplicate siteConfig document(s). Keeping the latest one.`);
      return keepConfig;
    }
    
    return configs[0] || null;
  } catch (error) {
    console.error('Error ensuring single siteConfig:', error);
    throw error;
  }
}

/**
 * Get the latest siteConfig document (ensuring only one exists)
 * This is the primary method to retrieve siteConfig
 */
export async function getLatestSiteConfig() {
  try {
    await connectDB();
    
    // First ensure only one exists (cleanup duplicates)
    await ensureSingleSiteConfig();
    
    // Get the single config
    const config = await SiteConfig.findOne().sort({ updatedAt: -1 });
    return config;
  } catch (error) {
    console.error('Error getting latest siteConfig:', error);
    throw error;
  }
}

/**
 * Seed initial siteConfig document with default values
 * Safe to call multiple times (idempotent)
 */
export async function seedSiteConfig() {
  try {
    await connectDB();

    // First, ensure only one config exists (cleanup duplicates)
    await ensureSingleSiteConfig();

    // Check if siteConfig already exists
    const existingConfig = await SiteConfig.findOne().sort({ updatedAt: -1 });

    if (existingConfig) {
      console.log('Site config already exists, skipping seed');
      return existingConfig;
    }

    // Create default site config
    const defaultConfig = await SiteConfig.create({
      // Hero Section
      heroTitleLeft: 'THE',
      heroTitleRight: 'DIGITAL OBSERVER',
      heroSubtitle: 'Welcome to my portfolio',
      scrollPromptText: 'Scroll to explore',

      // VCR Station Section
      vcrSectionTitle: 'Projects',
      vcrInstructionText: 'Drag a cassette to the VCR to watch',
      emptyTvMessage: 'Insert a cassette to watch a project',

      // Workbench Section
      workbenchTitle: 'Resume',
      floorSectionTitle: 'Contact',

      // Resume Header
      resumeHeader: {
        fullName: 'Your Name',
        email: 'your.email@example.com',
        city: 'City',
        country: 'Country',
        linkedinUrl: 'https://linkedin.com/in/yourprofile',
        githubUrl: 'https://github.com/yourusername',
      },

      // Resume Summary
      resumeSummary: 'Professional summary goes here...',

      // Resume Experience
      resumeExperience: [],

      // Resume Education
      resumeEducation: [],

      // Resume Skills
      resumeSkills: {},

      // Resume Projects
      resumeProjects: [],

      // Resume Achievements
      resumeAchievements: [],

      // Resume Certifications
      resumeCertifications: [],

      // Contact Items
      contactPolaroid: {
        text: 'LinkedIn',
        link: 'https://linkedin.com/in/yourprofile',
      },
      contactEnvelope: {
        text: 'Email',
        link: 'mailto:your.email@example.com',
      },
      contactPCB: {
        text: 'GitHub',
        link: 'https://github.com/yourusername',
      },
      contactStickyNote: {
        text: 'Portfolio',
        link: 'https://yourportfolio.com',
      },

      updatedAt: new Date(),
    });

    console.log('✅ Site config seeded successfully');
    return defaultConfig;
  } catch (error) {
    console.error('Error seeding site config:', error);
    throw error;
  }
}
