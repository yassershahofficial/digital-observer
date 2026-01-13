import { NextRequest, NextResponse } from 'next/server';
import { ensureSingleSiteConfig, getLatestSiteConfig } from '@/lib/seedSiteConfig';
import { getSession } from '@/lib/auth';

// POST - Manual cleanup endpoint (admin only)
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

    const config = await ensureSingleSiteConfig();
    const latestConfig = await getLatestSiteConfig();

    return NextResponse.json(
      {
        message: 'Cleanup completed. Only the latest siteConfig document remains.',
        data: {
          keptConfig: latestConfig,
          configId: latestConfig?._id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cleaning up site config:', error);
    return NextResponse.json(
      {
        message: 'Error cleaning up site config',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
