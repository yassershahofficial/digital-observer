import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getSession } from '@/lib/auth';

// POST - Trigger on-demand revalidation (admin only)
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

    const body = await request.json();
    const { path, tag } = body;

    // Revalidate by path
    if (path) {
      if (typeof path === 'string') {
        revalidatePath(path);
      } else if (Array.isArray(path)) {
        path.forEach((p: string) => revalidatePath(p));
      }
    }

    // Revalidate by tag
    if (tag) {
      if (typeof tag === 'string') {
        revalidateTag(tag);
      } else if (Array.isArray(tag)) {
        tag.forEach((t: string) => revalidateTag(t));
      }
    }

    // If no path or tag specified, revalidate home page
    if (!path && !tag) {
      revalidatePath('/');
    }

    return NextResponse.json(
      {
        message: 'Revalidation successful',
        data: {
          revalidated: true,
          now: Date.now(),
          path: path || null,
          tag: tag || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      {
        message: 'Error revalidating',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
