import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  email: string;
  name?: string;
  image?: string;
  googleId?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookChannelId?: string;
  webhookResourceId?: string;
}

const UserSchema: Schema<User> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    image: { type: String },
    googleId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    webhookChannelId: { type: String },
    webhookResourceId: { type: String },
  },
  { timestamps: true }
);

const UserModel =
  mongoose.models.User || mongoose.model<User>("User", UserSchema);
export default UserModel as mongoose.Model<User>;
