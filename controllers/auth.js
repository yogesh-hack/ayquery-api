import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import users from "../models/auth.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import { sendCompanyAgentIdEmail } from "../utils/sendCompanyAgentIdEmail.js";

// In-memory storage for temporary signups (consider Redis or DB in prod)
const tempUsers = new Map(); // key: email, value: { name, email, password, otp, otpExpires }

export const signup = async (req, res) => {
  const { name, email, password, role, companyName, companyGSTNo, companyCINNo } = req.body;

  try {
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    // Check if OTP already sent
    if (tempUsers.has(email)) {
      return res.status(400).json({ message: "OTP already sent. Please verify." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    tempUsers.set(email, {
      name,
      email,
      password: hashedPassword,
       role,
      companyName,
      companyGSTNo,companyCINNo,
      otp,
      otpExpires,
    });

    await sendOTPEmail(name,email, otp);

    res.status(200).json({
      message: "OTP sent to email. Please verify to complete signup.",
      email,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong..." });
  }
};

function generateCompanyAgentId(companyName) {
  const prefix = companyName?.slice(0, 3)?.toUpperCase() || "CMPAY";
  const uniqueSuffix = Math.floor(1000 + Math.random() * 9000); // e.g., 4321
  return `${prefix}-${uniqueSuffix}`;
}

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const tempUser = tempUsers.get(email);
    const tempusername = tempUser?.name || "User"; 

    // Generate a new OTP and update the stored user
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    tempUser.otp = newOtp;
    tempUser.otpExpires = otpExpires;
    tempUsers.set(email, tempUser);

    await sendOTPEmail(tempusername,email, newOtp);

    res.status(200).json({ message: "OTP resent successfully." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to resend OTP." });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, fullOtp } = req.body;
  console.log("Received OTP verification request:", { email, fullOtp });

  try {
    const tempUser = tempUsers.get(email);

    if (!tempUser) {
      return res.status(404).json({ message: "No pending signup found." });
    }

    if (tempUser.otp !== fullOtp || tempUser.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Prepare new user data
    const newUserData = {
      email: tempUser.email,
      password: tempUser.password,
      role: tempUser.role || "User",
      isVerified: true,
      name: tempUser.role === "Company" ? tempUser.companyName : tempUser.name, // ✅ Always provide 'name'
    };

    if (tempUser.role === "Company") {
      newUserData.companyName = tempUser.companyName;
      newUserData.companyRegNo = tempUser.companyRegNo;
      newUserData.companyAgentId = generateCompanyAgentId(tempUser.companyName);
    }

    const newUser = await users.create(newUserData);

    if (tempUser.role === "Company") {
      await sendCompanyAgentIdEmail(
        newUser.companyName,
        newUser.email,
        newUser.companyAgentId
      );
    }

    tempUsers.delete(email); // Clean up

    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message:
        tempUser.role === "Company"
          ? "Email verified and company account created successfully. Received your Company AygenID via email."
          : "Email verified and account created successfully.",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        companyAgentId: newUser.companyAgentId || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const login = async (req, res) => {
  const { email, password, companyAgentId } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "User does not exist." });
    }

    if (!existingUser.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    // Check companyAgentId for company logins
    if (existingUser.role === "Company" && existingUser.companyAgentId !== companyAgentId) {
      return res.status(401).json({ message: "Invalid Company AygenID." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful.",
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        companyAgentId: existingUser.companyAgentId || null,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

