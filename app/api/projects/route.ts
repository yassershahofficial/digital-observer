import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { getSession } from '@/lib/auth';

// GET - Retrieve all projects (public, for frontend)
export async function GET() {
  try {
    await connectDB();

    const projects = await Project.find().sort({ order: 1, createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Projects retrieved successfully',
        data: projects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        message: 'Error fetching projects',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create new project (admin only)
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

    await connectDB();

    const body = await request.json();
    const { name, youtubeUrl, order } = body;

    // Validate required fields
    if (!name || !youtubeUrl) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [
            { field: 'name', message: 'Name is required' },
            { field: 'youtubeUrl', message: 'YouTube URL is required' },
          ],
        },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeUrlPattern.test(youtubeUrl)) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [
            { field: 'youtubeUrl', message: 'Please provide a valid YouTube URL' },
          ],
        },
        { status: 400 }
      );
    }

    // Get the highest order value if order not provided
    let projectOrder = order;
    if (projectOrder === undefined || projectOrder === null) {
      const highestOrderProject = await Project.findOne().sort({ order: -1 });
      projectOrder = highestOrderProject ? highestOrderProject.order + 1 : 0;
    }

    const project = await Project.create({
      name: name.trim(),
      youtubeUrl: youtubeUrl.trim(),
      order: projectOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Project created successfully',
        data: project,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating project:', error);

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
        message: 'Error creating project',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
