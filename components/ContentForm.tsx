'use client';

import { useState, useEffect } from 'react';
import { ISiteConfig } from '@/models/SiteConfig';
import Toast from '@/components/Toast';

interface ContentFormProps {
  initialData: Partial<ISiteConfig> | null;
}

export default function ContentForm({ initialData }: ContentFormProps) {
  const [formData, setFormData] = useState<Partial<ISiteConfig>>(initialData || {});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (field: string, nestedField: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: {
        ...(prev[field] as any),
        [nestedField]: value,
      },
    }));
  };

  const handleArrayItemChange = (field: string, index: number, nestedField: string, value: any) => {
    setFormData((prev: any) => {
      const array = [...(prev[field] as any[])];
      array[index] = {
        ...array[index],
        [nestedField]: value,
      };
      return {
        ...prev,
        [field]: array,
      };
    });
  };

  const handleArrayAdd = (field: string, defaultItem: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] as any[]), defaultItem],
    }));
  };

  const handleArrayRemove = (field: string, index: number) => {
    setFormData((prev: any) => {
      const array = [...(prev[field] as any[])];
      array.splice(index, 1);
      return {
        ...prev,
        [field]: array,
      };
    });
  };

  const handleBulletPointChange = (field: string, index: number, bulletIndex: number, value: string) => {
    setFormData((prev: any) => {
      const array = [...(prev[field] as any[])];
      const bulletPoints = [...array[index].bulletPoints];
      bulletPoints[bulletIndex] = value;
      array[index] = {
        ...array[index],
        bulletPoints,
      };
      return {
        ...prev,
        [field]: array,
      };
    });
  };

  const handleBulletPointAdd = (field: string, index: number) => {
    setFormData((prev: any) => {
      const array = [...(prev[field] as any[])];
      array[index] = {
        ...array[index],
        bulletPoints: [...(array[index].bulletPoints || []), ''],
      };
      return {
        ...prev,
        [field]: array,
      };
    });
  };

  const handleBulletPointRemove = (field: string, index: number, bulletIndex: number) => {
    setFormData((prev: any) => {
      const array = [...(prev[field] as any[])];
      const bulletPoints = [...array[index].bulletPoints];
      bulletPoints.splice(bulletIndex, 1);
      array[index] = {
        ...array[index],
        bulletPoints,
      };
      return {
        ...prev,
        [field]: array,
      };
    });
  };

  const handleSkillsChange = (category: string, skills: string[]) => {
    setFormData((prev) => ({
      ...prev,
      resumeSkills: {
        ...(prev.resumeSkills || {}),
        [category]: skills,
      },
    }));
  };

  const handleAchievementChange = (index: number, value: string) => {
    setFormData((prev) => {
      const achievements = [...(prev.resumeAchievements || [])];
      achievements[index] = value;
      return {
        ...prev,
        resumeAchievements: achievements,
      };
    });
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty URLs are allowed
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      // Validate URLs
      const urlsToValidate = [
        { field: 'resumeHeader.linkedinUrl', value: formData.resumeHeader?.linkedinUrl },
        { field: 'resumeHeader.githubUrl', value: formData.resumeHeader?.githubUrl },
        { field: 'contactPolaroid.link', value: formData.contactPolaroid?.link },
        { field: 'contactEnvelope.link', value: formData.contactEnvelope?.link },
        { field: 'contactPCB.link', value: formData.contactPCB?.link },
        { field: 'contactStickyNote.link', value: formData.contactStickyNote?.link },
      ];

      for (const url of urlsToValidate) {
        if (url.value && !validateUrl(url.value)) {
          throw new Error(`Invalid URL format: ${url.field}`);
        }
      }

      // Validate project links
      if (formData.resumeProjects) {
        for (let i = 0; i < formData.resumeProjects.length; i++) {
          const project = formData.resumeProjects[i];
          if (project.link && !validateUrl(project.link)) {
            throw new Error(`Invalid URL format in project ${i + 1}`);
          }
        }
      }

      // Validate certification links
      if (formData.resumeCertifications) {
        for (let i = 0; i < formData.resumeCertifications.length; i++) {
          const cert = formData.resumeCertifications[i];
          if (cert.link && !validateUrl(cert.link)) {
            throw new Error(`Invalid URL format in certification ${i + 1}`);
          }
        }
      }

      // Save to API
      const response = await fetch('/api/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save configuration');
      }

      // Trigger revalidation
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ path: '/' }),
        });
      } catch (revalidateError) {
        console.warn('Revalidation failed:', revalidateError);
        // Don't fail the save if revalidation fails
      }

      setToast({
        type: 'success',
        message: 'Configuration saved successfully! Changes are now live.',
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save configuration',
      });
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

      {/* Hero Section */}
      <Section title="Hero Section">
        <FormField
          label="Title Left"
          value={formData.heroTitleLeft || ''}
          onChange={(e) => handleInputChange('heroTitleLeft', e.target.value)}
        />
        <FormField
          label="Title Right"
          value={formData.heroTitleRight || ''}
          onChange={(e) => handleInputChange('heroTitleRight', e.target.value)}
        />
        <FormField
          label="Subtitle"
          value={formData.heroSubtitle || ''}
          onChange={(e) => handleInputChange('heroSubtitle', e.target.value)}
        />
        <FormField
          label="Scroll Prompt Text"
          value={formData.scrollPromptText || ''}
          onChange={(e) => handleInputChange('scrollPromptText', e.target.value)}
        />
      </Section>

      {/* VCR Station Section */}
      <Section title="VCR Station Section">
        <FormField
          label="Section Title"
          value={formData.vcrSectionTitle || ''}
          onChange={(e) => handleInputChange('vcrSectionTitle', e.target.value)}
        />
        <FormField
          label="Instruction Text"
          value={formData.vcrInstructionText || ''}
          onChange={(e) => handleInputChange('vcrInstructionText', e.target.value)}
        />
        <FormField
          label="Empty TV Message"
          value={formData.emptyTvMessage || ''}
          onChange={(e) => handleInputChange('emptyTvMessage', e.target.value)}
        />
      </Section>

      {/* Workbench Section */}
      <Section title="Workbench Section">
        <FormField
          label="Section Title"
          value={formData.workbenchTitle || ''}
          onChange={(e) => handleInputChange('workbenchTitle', e.target.value)}
        />
      </Section>

      {/* Workshop Floor Section */}
      <Section title="Workshop Floor Section">
        <FormField
          label="Section Title"
          value={formData.floorSectionTitle || ''}
          onChange={(e) => handleInputChange('floorSectionTitle', e.target.value)}
        />
      </Section>

      {/* Resume Header */}
      <Section title="Resume - Header">
        <FormField
          label="Full Name"
          value={formData.resumeHeader?.fullName || ''}
          onChange={(e) => handleNestedChange('resumeHeader', 'fullName', e.target.value)}
        />
        <FormField
          label="Email"
          type="email"
          value={formData.resumeHeader?.email || ''}
          onChange={(e) => handleNestedChange('resumeHeader', 'email', e.target.value)}
        />
        <FormField
          label="City"
          value={formData.resumeHeader?.city || ''}
          onChange={(e) => handleNestedChange('resumeHeader', 'city', e.target.value)}
        />
        <FormField
          label="Country"
          value={formData.resumeHeader?.country || ''}
          onChange={(e) => handleNestedChange('resumeHeader', 'country', e.target.value)}
        />
        <FormField
          label="LinkedIn URL"
          type="url"
          value={formData.resumeHeader?.linkedinUrl || ''}
          onChange={(e) => handleNestedChange('resumeHeader', 'linkedinUrl', e.target.value)}
          placeholder="https://linkedin.com/in/yourprofile"
        />
        <FormField
          label="GitHub URL"
          type="url"
          value={formData.resumeHeader?.githubUrl || ''}
          onChange={(e) => handleNestedChange('resumeHeader', 'githubUrl', e.target.value)}
          placeholder="https://github.com/yourusername"
        />
      </Section>

      {/* Resume Summary */}
      <Section title="Resume - Summary">
        <TextareaField
          label="Professional Summary"
          value={formData.resumeSummary || ''}
          onChange={(e) => handleInputChange('resumeSummary', e.target.value)}
          rows={6}
        />
      </Section>

      {/* Resume Experience */}
      <Section title="Resume - Experience">
        {(formData.resumeExperience || []).map((exp, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleArrayRemove('resumeExperience', index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Role"
                value={exp.role || ''}
                onChange={(e) => handleArrayItemChange('resumeExperience', index, 'role', e.target.value)}
              />
              <FormField
                label="Company"
                value={exp.company || ''}
                onChange={(e) => handleArrayItemChange('resumeExperience', index, 'company', e.target.value)}
              />
              <FormField
                label="Date From"
                value={exp.dateFrom || ''}
                onChange={(e) => handleArrayItemChange('resumeExperience', index, 'dateFrom', e.target.value)}
                placeholder="MM/YYYY"
              />
              <FormField
                label="Date To"
                value={exp.dateTo || ''}
                onChange={(e) => handleArrayItemChange('resumeExperience', index, 'dateTo', e.target.value)}
                placeholder="MM/YYYY or Present"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bullet Points
              </label>
              {(exp.bulletPoints || []).map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => handleBulletPointChange('resumeExperience', index, bulletIndex, e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Bullet point"
                  />
                  <button
                    type="button"
                    onClick={() => handleBulletPointRemove('resumeExperience', index, bulletIndex)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleBulletPointAdd('resumeExperience', index)}
                className="text-sm text-indigo-600 hover:text-indigo-800 mt-2"
              >
                + Add Bullet Point
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleArrayAdd('resumeExperience', { role: '', company: '', dateFrom: '', dateTo: '', bulletPoints: [] })}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Add Experience
        </button>
      </Section>

      {/* Resume Education */}
      <Section title="Resume - Education">
        {(formData.resumeEducation || []).map((edu, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleArrayRemove('resumeEducation', index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Degree"
                value={edu.degree || ''}
                onChange={(e) => handleArrayItemChange('resumeEducation', index, 'degree', e.target.value)}
              />
              <FormField
                label="University"
                value={edu.university || ''}
                onChange={(e) => handleArrayItemChange('resumeEducation', index, 'university', e.target.value)}
              />
              <FormField
                label="Year From"
                value={edu.yearFrom || ''}
                onChange={(e) => handleArrayItemChange('resumeEducation', index, 'yearFrom', e.target.value)}
              />
              <FormField
                label="Year To"
                value={edu.yearTo || ''}
                onChange={(e) => handleArrayItemChange('resumeEducation', index, 'yearTo', e.target.value)}
              />
              <FormField
                label="CGPA (Optional)"
                value={edu.cgpa || ''}
                onChange={(e) => handleArrayItemChange('resumeEducation', index, 'cgpa', e.target.value)}
              />
              <TextareaField
                label="Relevant Coursework (Optional)"
                value={edu.relevantCoursework || ''}
                onChange={(e) => handleArrayItemChange('resumeEducation', index, 'relevantCoursework', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleArrayAdd('resumeEducation', { degree: '', university: '', yearFrom: '', yearTo: '', cgpa: '', relevantCoursework: '' })}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Add Education
        </button>
      </Section>

      {/* Resume Skills */}
      <Section title="Resume - Skills">
        <SkillsEditor
          skills={formData.resumeSkills || {}}
          onChange={handleSkillsChange}
        />
      </Section>

      {/* Resume Projects */}
      <Section title="Resume - Projects">
        {(formData.resumeProjects || []).map((project, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Project {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleArrayRemove('resumeProjects', index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Project Name"
                value={project.name || ''}
                onChange={(e) => handleArrayItemChange('resumeProjects', index, 'name', e.target.value)}
              />
              <FormField
                label="Link"
                type="url"
                value={project.link || ''}
                onChange={(e) => handleArrayItemChange('resumeProjects', index, 'link', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <TextareaField
              label="Description"
              value={project.description || ''}
              onChange={(e) => handleArrayItemChange('resumeProjects', index, 'description', e.target.value)}
              rows={3}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleArrayAdd('resumeProjects', { name: '', description: '', link: '' })}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Add Project
        </button>
      </Section>

      {/* Resume Achievements */}
      <Section title="Resume - Achievements">
        {(formData.resumeAchievements || []).map((achievement, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={achievement}
              onChange={(e) => handleAchievementChange(index, e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Achievement"
            />
            <button
              type="button"
              onClick={() => {
                const achievements = [...(formData.resumeAchievements || [])];
                achievements.splice(index, 1);
                setFormData((prev: any) => ({ ...prev, resumeAchievements: achievements }));
              }}
              className="text-red-600 hover:text-red-800 px-2"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const achievements = [...(formData.resumeAchievements || []), ''];
            setFormData((prev: any) => ({ ...prev, resumeAchievements: achievements }));
          }}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Add Achievement
        </button>
      </Section>

      {/* Resume Certifications */}
      <Section title="Resume - Certifications">
        {(formData.resumeCertifications || []).map((cert, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Certification {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleArrayRemove('resumeCertifications', index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name"
                value={cert.name || ''}
                onChange={(e) => handleArrayItemChange('resumeCertifications', index, 'name', e.target.value)}
              />
              <FormField
                label="Issuer"
                value={cert.issuer || ''}
                onChange={(e) => handleArrayItemChange('resumeCertifications', index, 'issuer', e.target.value)}
              />
              <FormField
                label="Date"
                value={cert.date || ''}
                onChange={(e) => handleArrayItemChange('resumeCertifications', index, 'date', e.target.value)}
                placeholder="MM/YYYY"
              />
              <FormField
                label="Link (Optional)"
                type="url"
                value={cert.link || ''}
                onChange={(e) => handleArrayItemChange('resumeCertifications', index, 'link', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleArrayAdd('resumeCertifications', { name: '', issuer: '', date: '', link: '' })}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Add Certification
        </button>
      </Section>

      {/* Contact Items */}
      <Section title="Contact Items">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Polaroid</h4>
            <FormField
              label="Text"
              value={formData.contactPolaroid?.text || ''}
              onChange={(e) => handleNestedChange('contactPolaroid', 'text', e.target.value)}
            />
            <FormField
              label="Link"
              type="url"
              value={formData.contactPolaroid?.link || ''}
              onChange={(e) => handleNestedChange('contactPolaroid', 'link', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Envelope</h4>
            <FormField
              label="Text"
              value={formData.contactEnvelope?.text || ''}
              onChange={(e) => handleNestedChange('contactEnvelope', 'text', e.target.value)}
            />
            <FormField
              label="Link"
              type="url"
              value={formData.contactEnvelope?.link || ''}
              onChange={(e) => handleNestedChange('contactEnvelope', 'link', e.target.value)}
              placeholder="mailto:..."
            />
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">PCB</h4>
            <FormField
              label="Text"
              value={formData.contactPCB?.text || ''}
              onChange={(e) => handleNestedChange('contactPCB', 'text', e.target.value)}
            />
            <FormField
              label="Link"
              type="url"
              value={formData.contactPCB?.link || ''}
              onChange={(e) => handleNestedChange('contactPCB', 'link', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Sticky Note</h4>
            <FormField
              label="Text"
              value={formData.contactStickyNote?.text || ''}
              onChange={(e) => handleNestedChange('contactStickyNote', 'text', e.target.value)}
            />
            <FormField
              label="Link"
              type="url"
              value={formData.contactStickyNote?.link || ''}
              onChange={(e) => handleNestedChange('contactStickyNote', 'link', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </Section>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
    </>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
    </div>
  );
}

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: { [category: string]: string[] };
  onChange: (category: string, skills: string[]) => void;
}) {
  const [newCategory, setNewCategory] = useState('');
  const categories = Object.keys(skills);

  const handleSkillChange = (category: string, index: number, value: string) => {
    const categorySkills = [...(skills[category] || [])];
    categorySkills[index] = value;
    onChange(category, categorySkills);
  };

  const handleSkillAdd = (category: string) => {
    const categorySkills = [...(skills[category] || []), ''];
    onChange(category, categorySkills);
  };

  const handleSkillRemove = (category: string, index: number) => {
    const categorySkills = [...(skills[category] || [])];
    categorySkills.splice(index, 1);
    onChange(category, categorySkills);
  };

  const handleCategoryAdd = () => {
    if (newCategory.trim()) {
      onChange(newCategory.trim(), []);
      setNewCategory('');
    }
  };

  const handleCategoryRemove = (category: string) => {
    const newSkills = { ...skills };
    delete newSkills[category];
    // Update all categories
    Object.keys(newSkills).forEach((cat) => {
      onChange(cat, newSkills[cat]);
    });
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-900">{category}</h4>
            <button
              type="button"
              onClick={() => handleCategoryRemove(category)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove Category
            </button>
          </div>
          {(skills[category] || []).map((skill, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={skill}
                onChange={(e) => handleSkillChange(category, index, e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Skill"
              />
              <button
                type="button"
                onClick={() => handleSkillRemove(category, index)}
                className="text-red-600 hover:text-red-800 px-2"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleSkillAdd(category)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Add Skill
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCategoryAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={handleCategoryAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          Add Category
        </button>
      </div>
    </div>
  );
}
