import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import { getSession } from '@/lib/auth';
import { seedSiteConfig, getLatestSiteConfig, ensureSingleSiteConfig } from '@/lib/seedSiteConfig';

// GET - Retrieve site config (public, for frontend)
export async function GET() {
  try {
    await connectDB();

    // Ensure only one config exists and get the latest one
    let siteConfig = await getLatestSiteConfig();

    // If no config exists, seed default values
    if (!siteConfig) {
      try {
        siteConfig = await seedSiteConfig();
      } catch (seedError) {
        console.error('Error seeding site config:', seedError);
        // Continue even if seeding fails
      }
    }

    // If still no config after seeding attempt, return null
    if (!siteConfig) {
      return NextResponse.json(
        {
          message: 'No site config found',
          data: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Site config retrieved successfully',
        data: siteConfig,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json(
      {
        message: 'Error fetching site config',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update site config (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // First, ensure only one config exists (cleanup duplicates)
    // This ensures we always work with the latest one
    await ensureSingleSiteConfig();

    const body = await request.json();

    // Get the latest config's ID (or null if none exists)
    const latestConfig = await SiteConfig.findOne().sort({ updatedAt: -1 });

    // Update or create site config
    // If no config exists, create one; otherwise update the latest one
    const siteConfig = latestConfig
      ? await SiteConfig.findByIdAndUpdate(
          latestConfig._id,
          {
            ...body,
            updatedAt: new Date(),
          },
          {
            new: true,
            runValidators: true,
          }
        )
      : await SiteConfig.create({
          ...body,
          updatedAt: new Date(),
        });

    return NextResponse.json(
      {
        message: 'Site config updated successfully',
        data: siteConfig,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating site config:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Error updating site config',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
