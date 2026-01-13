import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { getSession } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Retrieve single project (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findById(params.id);

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Project retrieved successfully',
        data: project,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      {
        message: 'Error fetching project',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update project (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, youtubeUrl, order } = body;

    // Validate YouTube URL if provided
    if (youtubeUrl) {
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
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl.trim();
    if (order !== undefined) updateData.order = order;

    const project = await Project.findByIdAndUpdate(
      params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Project updated successfully',
        data: project,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating project:', error);

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
        message: 'Error updating project',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete project (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findByIdAndDelete(params.id);

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Project deleted successfully',
        data: project,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      {
        message: 'Error deleting project',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
