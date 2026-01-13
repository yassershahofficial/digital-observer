import mongoose, { Schema, Model } from 'mongoose';

export interface IResumeHeader {
  fullName: string;
  email: string;
  city: string;
  country: string;
  linkedinUrl: string;
  githubUrl: string;
}

export interface IResumeExperience {
  role: string;
  company: string;
  dateFrom: string;
  dateTo: string;
  bulletPoints: string[];
}

export interface IResumeEducation {
  degree: string;
  university: string;
  yearFrom: string;
  yearTo: string;
  cgpa?: string;
  relevantCoursework?: string;
}

export interface IResumeSkills {
  [categoryName: string]: string[];
}

export interface IResumeProject {
  name: string;
  description: string;
  link: string;
}

export interface IResumeCertification {
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface IContactItem {
  text: string;
  link: string;
}

export interface ISiteConfig {
  // Section Titles & UI Text
  heroTitleLeft: string;
  heroTitleRight: string;
  heroSubtitle: string;
  scrollPromptText: string;
  vcrSectionTitle: string;
  vcrInstructionText: string;
  emptyTvMessage: string;
  workbenchTitle: string;
  floorSectionTitle: string;

  // Resume Content
  resumeHeader: IResumeHeader;
  resumeSummary: string;
  resumeExperience: IResumeExperience[];
  resumeEducation: IResumeEducation[];
  resumeSkills: IResumeSkills;
  resumeProjects: IResumeProject[];
  resumeAchievements: string[];
  resumeCertifications: IResumeCertification[];

  // Contact Items
  contactPolaroid: IContactItem;
  contactEnvelope: IContactItem;
  contactPCB: IContactItem;
  contactStickyNote: IContactItem;

  updatedAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    heroTitleLeft: { type: String, default: '' },
    heroTitleRight: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    scrollPromptText: { type: String, default: '' },
    vcrSectionTitle: { type: String, default: '' },
    vcrInstructionText: { type: String, default: '' },
    emptyTvMessage: { type: String, default: '' },
    workbenchTitle: { type: String, default: '' },
    floorSectionTitle: { type: String, default: '' },

    resumeHeader: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      linkedinUrl: { type: String, default: '' },
      githubUrl: { type: String, default: '' },
    },

    resumeSummary: { type: String, default: '' },

    resumeExperience: [
      {
        role: { type: String, default: '' },
        company: { type: String, default: '' },
        dateFrom: { type: String, default: '' },
        dateTo: { type: String, default: '' },
        bulletPoints: [{ type: String }],
      },
    ],

    resumeEducation: [
      {
        degree: { type: String, default: '' },
        university: { type: String, default: '' },
        yearFrom: { type: String, default: '' },
        yearTo: { type: String, default: '' },
        cgpa: { type: String, default: '' },
        relevantCoursework: { type: String, default: '' },
      },
    ],

    resumeSkills: { type: Schema.Types.Mixed, default: {} },

    resumeProjects: [
      {
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        link: { type: String, default: '' },
      },
    ],

    resumeAchievements: [{ type: String }],

    resumeCertifications: [
      {
        name: { type: String, default: '' },
        issuer: { type: String, default: '' },
        date: { type: String, default: '' },
        link: { type: String, default: '' },
      },
    ],

    contactPolaroid: {
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },

    contactEnvelope: {
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },

    contactPCB: {
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },

    contactStickyNote: {
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },

    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // We manage updatedAt manually
  }
);

// Prevent model recompilation during development
const SiteConfig: Model<ISiteConfig> =
  mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);

export default SiteConfig;
