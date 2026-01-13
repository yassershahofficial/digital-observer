import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InteractionStat, { EventType, ItemType } from '@/models/InteractionStat';
import Project from '@/models/Project';
import { getSession } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Retrieve interaction statistics (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType') as EventType | null;
    const projectId = searchParams.get('projectId');
    const itemType = searchParams.get('itemType') as ItemType | null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = {};
    if (eventType) query.eventType = eventType;
    if (projectId) query.projectId = projectId;
    if (itemType) query.itemType = itemType;

    // Get stats
    const stats = await InteractionStat.find(query)
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    // Get aggregated counts
    const eventCounts = await InteractionStat.aggregate([
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get project popularity (for TAPE_INSERTED and LAUNCH_CLICKED)
    const projectPopularity = await InteractionStat.aggregate([
      {
        $match: {
          eventType: { $in: ['TAPE_INSERTED', 'LAUNCH_CLICKED'] },
          projectId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$projectId',
          tapeInserted: {
            $sum: { $cond: [{ $eq: ['$eventType', 'TAPE_INSERTED'] }, 1, 0] },
          },
          launchClicked: {
            $sum: { $cond: [{ $eq: ['$eventType', 'LAUNCH_CLICKED'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Populate project names
    const projectIds = projectPopularity.map((p) => p._id);
    const projects = await Project.find({ _id: { $in: projectIds } });
    const projectMap = new Map(projects.map((p) => [p._id.toString(), p.name]));

    const projectPopularityWithNames = projectPopularity.map((p) => ({
      projectId: p._id,
      projectName: projectMap.get(p._id.toString()) || 'Unknown',
      tapeInserted: p.tapeInserted,
      launchClicked: p.launchClicked,
      total: p.total,
    }));

    // Get contact item statistics
    const contactItemStats = await InteractionStat.aggregate([
      {
        $match: {
          eventType: 'ITEM_INSPECTED',
          itemType: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get visitor statistics (PAGE_VISIT events)
    const visitorStats = await InteractionStat.aggregate([
      {
        $match: {
          eventType: 'PAGE_VISIT',
        },
      },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          uniqueVisitors: {
            $addToSet: {
              $ifNull: ['$metadata.visitorId', null],
            },
          },
        },
      },
      {
        $project: {
          totalVisits: 1,
          uniqueVisitors: {
            $size: {
              $filter: {
                input: '$uniqueVisitors',
                as: 'visitor',
                cond: { $ne: ['$$visitor', null] },
              },
            },
          },
        },
      },
    ]);

    // Get daily visitor trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyVisits = await InteractionStat.aggregate([
      {
        $match: {
          eventType: 'PAGE_VISIT',
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const visitorData = visitorStats.length > 0 
      ? visitorStats[0] 
      : { totalVisits: 0, uniqueVisitors: 0 };

    return NextResponse.json(
      {
        message: 'Stats retrieved successfully',
        data: {
          stats,
          summary: {
            eventCounts,
            projectPopularity: projectPopularityWithNames,
            contactItemStats,
            visitorStats: {
              totalVisits: visitorData.totalVisits,
              uniqueVisitors: visitorData.uniqueVisitors,
              dailyVisits,
            },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        message: 'Error fetching stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create interaction stat (public, for tracking)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { eventType, projectId, itemType, metadata } = body;

    // Validate required fields
    if (!eventType) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [{ field: 'eventType', message: 'Event type is required' }],
        },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes: EventType[] = ['PAGE_VISIT', 'TAPE_INSERTED', 'LAUNCH_CLICKED', 'ITEM_INSPECTED'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [
            {
              field: 'eventType',
              message: `Event type must be one of: ${validEventTypes.join(', ')}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate projectId for certain event types
    if (['TAPE_INSERTED', 'LAUNCH_CLICKED'].includes(eventType) && !projectId) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [
            {
              field: 'projectId',
              message: 'Project ID is required for this event type',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate itemType for ITEM_INSPECTED
    if (eventType === 'ITEM_INSPECTED' && !itemType) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [
            {
              field: 'itemType',
              message: 'Item type is required for ITEM_INSPECTED events',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate projectId format if provided
    if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: [{ field: 'projectId', message: 'Invalid project ID format' }],
        },
        { status: 400 }
      );
    }

    const stat = await InteractionStat.create({
      eventType,
      projectId: projectId || undefined,
      itemType: itemType || undefined,
      metadata: metadata || {},
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Interaction stat created successfully',
        data: stat,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating interaction stat:', error);

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
        message: 'Error creating interaction stat',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
