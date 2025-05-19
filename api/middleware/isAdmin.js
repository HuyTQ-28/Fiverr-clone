import createError from "../utils/createError.js";

export const isAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return next(createError(403, "You are not authorized!"));
  }
  next();
};
