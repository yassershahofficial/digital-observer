import mongoose, { Schema, Model, Types } from 'mongoose';

export type EventType = 'PAGE_VISIT' | 'TAPE_INSERTED' | 'LAUNCH_CLICKED' | 'ITEM_INSPECTED';
export type ItemType = 'Polaroid' | 'Envelope' | 'PCB' | 'Sticky Note';

export interface IInteractionStat {
  eventType: EventType;
  timestamp: Date;
  projectId?: Types.ObjectId;
  itemType?: ItemType;
  metadata?: Record<string, any>;
}

const InteractionStatSchema = new Schema<IInteractionStat>(
  {
    eventType: {
      type: String,
      enum: ['PAGE_VISIT', 'TAPE_INSERTED', 'LAUNCH_CLICKED', 'ITEM_INSPECTED'],
      required: [true, 'Event type is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: function (this: IInteractionStat) {
        // Required for TAPE_INSERTED and LAUNCH_CLICKED
        return ['TAPE_INSERTED', 'LAUNCH_CLICKED'].includes(this.eventType);
      },
    },
    itemType: {
      type: String,
      enum: ['Polaroid', 'Envelope', 'PCB', 'Sticky Note'],
      required: function (this: IInteractionStat) {
        // Required for ITEM_INSPECTED
        return this.eventType === 'ITEM_INSPECTED';
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false, // We only use timestamp field
  }
);

// Add indexes for better query performance
InteractionStatSchema.index({ eventType: 1, timestamp: -1 });
InteractionStatSchema.index({ projectId: 1 });
InteractionStatSchema.index({ itemType: 1 });

// Prevent model recompilation during development
const InteractionStat: Model<IInteractionStat> =
  mongoose.models.InteractionStat ||
  mongoose.model<IInteractionStat>('InteractionStat', InteractionStatSchema);

export default InteractionStat;
