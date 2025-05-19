import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import createError from "../utils/createError.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import axios from "axios";

export const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, country, phone, desc, img } =
      req.body;

    const newUser = new User({
      username,
      email,
      password,
      fullName,
      country,
      phone,
      desc,
      img,
    });

    await newUser.save();
    res.status(201).send("User has been created.");
  } catch (error) {
    next(error);
  }
};

// export const login = async (req, res, next) => {
//   try {
//     const user = await User.findOne({ username: req.body.username });
//     if (!user) return next(createError(404, "User not found!"));

//     const isCorrect = await user.comparePassword(req.body.password);
//     if (!isCorrect) return next(createError(400, "Wrong password or username"));

//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role,
//       },
//       process.env.JWT_KEY,
//       { expiresIn: "1h" }
//     );

//     const { password, ...userInfo } = user._doc;
//     res
//       .cookie("accessToken", token, {
//         httpOnly: true,
//       })
//       .status(200)
//       .send(userInfo);
//   } catch (error) {
//     next(error);
//   }
// };

export const login = async (req, res, next) => {
  const { username, password, recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return next(
      createError(400, "Please complete the reCAPTCHA verification.")
    );
  }

  try {
    // 2. Xác minh reCAPTCHA token với Google
    const secretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify`;
    let googleResponse;

    try {
      googleResponse = await axios.post(verificationURL, null, {
        params: {
          secret: secretKey,
          response: recaptchaToken,
        },
      });
    } catch (recaptchaError) {
      return next(
        createError(
          500,
          "An error occurred while verifying reCAPTCHA. Please try again."
        )
      );
    }

    const { success, "error-codes": errorCodes } = googleResponse.data;

    if (!success) {
      console.warn("reCAPTCHA verification failed. Errors:", errorCodes);
      return next(
        createError(
          400,
          "reCAPTCHA verification failed. Please try solving it again."
        )
      );
    }

    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return next(createError(401, "Invalid username or password."));
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(createError(401, "Invalid username or password."));
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    const {
      password: _,
      __v,
      passwordResetToken,
      passwordResetExpires,
      stripeCustomerId,
      stripeAccountId,
      stripeAccountStatus,
      ...userInfo
    } = user.toObject();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true khi ở production (HTTPS)
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" cho cross-site
    };
    // Nếu sameSite là "none", 'secure' phải là true. Cấu hình trên đảm bảo điều này.

    res.cookie("accessToken", token, cookieOptions).status(200).json(userInfo);
  } catch (err) {
    next(
      createError(
        500,
        err.message || "An internal server error occurred during login."
      )
    );
  }
};

export const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logged out successfully.");
};

export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      const error = new createError(
        404,
        "We couldn't find an account with that email address."
      );
      return next(error);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

    const message = `We have received a password reset request. Please click the link below to reset your password: ${resetURL}\n\nThis link is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 minutes)",
        message: message,
      });

      res.status(200).send("Password reset link sent to user email");
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        createError(
          500,
          "There was an error sending the email. Try again later!"
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    if (password !== passwordConfirm)
      return next(createError(400, "Passwords do not match."));

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user)
      return next(createError(400, "Token is invalid or has expired."));

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res
      .status(200)
      .send("Password reset successful. Please log in with your new password.");
  } catch (error) {
    next(error);
  }
};
