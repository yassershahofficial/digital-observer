import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getSession, isSuperadmin } from '@/lib/auth';

// GET - Retrieve all admins (superadmin only)
export async function GET(request: NextRequest) {
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

    const admins = await Admin.find().sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Admins retrieved successfully',
        data: admins,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      {
        message: 'Error fetching admins',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create new admin (superadmin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { email, role } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [{ field: 'email', message: 'Email is required' }],
        },
        { status: 400 }
      );
    }

    // Validate email format
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

    // Validate role
    const validRoles = ['admin', 'superadmin'];
    if (role && !validRoles.includes(role)) {
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

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [{ field: 'email', message: 'Admin with this email already exists' }],
        },
        { status: 400 }
      );
    }

    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      role: role || 'admin',
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Admin created successfully',
        data: admin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating admin:', error);

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
        message: 'Error creating admin',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
