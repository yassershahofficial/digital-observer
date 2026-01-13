import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getSession, isSuperadmin } from '@/lib/auth';
import mongoose from 'mongoose';

// PUT - Update admin (superadmin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and superadmin role
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isSuper = await isSuperadmin();
    if (!isSuper) {
      return NextResponse.json(
        { message: 'Forbidden: Superadmin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid admin ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role, email } = body;

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'superadmin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          {
            message: 'Validation error',
            errors: [
              {
                field: 'role',
                message: `Role must be one of: ${validRoles.join(', ')}`,
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Validate email if provided
    if (email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return NextResponse.json(
          {
            message: 'Validation error',
            errors: [{ field: 'email', message: 'Invalid email format' }],
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (email) updateData.email = email.toLowerCase().trim();

    const admin = await Admin.findByIdAndUpdate(
      params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin updated successfully',
        data: admin,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating admin:', error);

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

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [{ field: 'email', message: 'Admin with this email already exists' }],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Error updating admin',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and superadmin role
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isSuper = await isSuperadmin();
    if (!isSuper) {
      return NextResponse.json(
        { message: 'Forbidden: Superadmin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid admin ID' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    const currentUserEmail = session.user?.email?.toLowerCase().trim();
    const adminToDelete = await Admin.findById(params.id);
    
    if (adminToDelete && adminToDelete.email.toLowerCase() === currentUserEmail) {
      return NextResponse.json(
        { message: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    const admin = await Admin.findByIdAndDelete(params.id);

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin deleted successfully',
        data: admin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      {
        message: 'Error deleting admin',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
