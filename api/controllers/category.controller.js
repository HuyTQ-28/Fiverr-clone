import Category from "../models/category.model.js";
import createError from "../utils/createError.js";
import Gig from "../models/gig.model.js";
import mongoose from "mongoose";

export const createCategory = async (req, res, next) => {
  try {
    console.log("Request body:", req.body);
    const { name, slug: rawSlug, description, imgUrl } = req.body;

    console.log("Extracted values:", { name, rawSlug, description, imgUrl });

    // Validate required name field
    if (!name) {
      return next(createError(400, "Category name is required"));
    }

    // Generate slug from input or fallback to slugified name
    const slugValue = rawSlug
      ? rawSlug.toLowerCase().trim()
      : name.toLowerCase().trim().replace(/\s+/g, "-");

    const newCategory = new Category({
      name,
      slug: slugValue,
      description,
      imgUrl,
    });

    await newCategory.save();
    res.status(201).send(newCategory);
  } catch (error) {
    if (error.code === 11000) {
      next(createError(400, "Category already exists"));
    } else if (error.name === "ValidationError") {
      next(createError(400, error.message));
      console.log(error);
    } else {
      next(error);
    }
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).send(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne(
      mongoose.Types.ObjectId.isValid(req.params.identifier)
        ? { _id: req.params.identifier }
        : { slug: req.params.identifier.toLowerCase() }
    );

    if (!category) {
      return next(createError(404, "Category not found"));
    }
    res.status(200).send(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description, imgUrl } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug.toLowerCase().trim();
    if (description !== undefined) updates.description = description;
    if (imgUrl !== undefined) updates.imgUrl = imgUrl;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.identifier,
      updates,
      { new: true }
    );

    if (!updatedCategory) {
      return next(createError(404, "Category not found"));
    }
    res.status(200).send(updatedCategory);
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(createError(400, error.message));
    }
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const gigCount = await Gig.countDocuments({
      categoryId: req.params.identifier,
    });
    if (gigCount > 0) {
      return next(
        createError(
          400,
          `Cannot delete category. It still has ${gigCount} Gigs associated with it.`
        )
      );
    }
    await Category.findByIdAndDelete(req.params.identifier);
    res.status(200).send({ message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};
