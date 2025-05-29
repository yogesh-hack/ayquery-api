import mongoose from "mongoose";

const userSchema = mongoose.Schema({
 name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['User', 'Company'], default: 'User' },
  about: { type: String },
  tags: { type: [String] },
  joinedOn: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  companyName: { type: String },
  companyGStNo: { type: String },
  companyCINNo: { type: String },
  companyAgentId: { type: String }, // Generated after OTP verification
});


export default mongoose.model("User", userSchema);
