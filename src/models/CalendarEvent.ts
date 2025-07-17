import mongoose, { Schema, Document } from "mongoose";

export interface CalendarEvent extends Document {
  googleEventId: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

const CalendarEventSchema: Schema<CalendarEvent> = new Schema(
  {
    googleEventId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String },
  },
  { timestamps: true }
);

CalendarEventSchema.index({ userId: 1, googleEventId: 1 }, { unique: true });

const CalendarEventModel =
  mongoose.models.CalendarEvent ||
  mongoose.model<CalendarEvent>("CalendarEvent", CalendarEventSchema);
export default CalendarEventModel as mongoose.Model<CalendarEvent>;
