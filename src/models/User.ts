import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // 只存 bcrypt 雜湊後的密碼；select: false 讓一般查詢預設不會取出這個欄位
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

// 開發模式熱更新時，避免重複註冊同名 Model 而報錯
export const User = (models.User as Model<UserDoc>) || model("User", userSchema);
