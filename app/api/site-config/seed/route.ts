import { NextRequest, NextResponse } from 'next/server';
import { seedSiteConfig, ensureSingleSiteConfig } from '@/lib/seedSiteConfig';
import { getSession } from '@/lib/auth';

// POST - Seed initial site config (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First cleanup any duplicates
    await ensureSingleSiteConfig();

    const config = await seedSiteConfig();

    return NextResponse.json(
      {
        message: config ? 'Site config already exists (kept latest)' : 'Site config seeded successfully',
        data: config,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error seeding site config:', error);
    return NextResponse.json(
      {
        message: 'Error seeding site config',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
