import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISlot extends Document {
  doctorId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  maxCapacity: number;
  currentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema: Schema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (this: ISlot, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Max capacity is required'],
      min: [1, 'Max capacity must be at least 1'],
      default: 10,
    },
    currentCount: {
      type: Number,
      default: 0,
      min: [0, 'Current count cannot be negative'],
      validate: {
        validator: function (this: ISlot, value: number) {
          return value <= this.maxCapacity;
        },
        message: 'Current count cannot exceed max capacity',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient slot queries
SlotSchema.index({ doctorId: 1, startTime: 1 });
SlotSchema.index({ startTime: 1, endTime: 1 });

// Virtual property for availability
SlotSchema.virtual('isAvailable').get(function (this: ISlot) {
  return this.currentCount < this.maxCapacity;
});

// Virtual property for remaining slots
SlotSchema.virtual('remainingSlots').get(function (this: ISlot) {
  return this.maxCapacity - this.currentCount;
});

export default mongoose.model<ISlot>('Slot', SlotSchema);
