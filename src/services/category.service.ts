import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types/category.types";
import { generateSlug } from "../utils/slug.util";

/**
 * Mendapatkan daftar kategori dengan pencarian dan pagination (Admin).
 */
export const getCategories = async () => {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

/**
 * Membuat kategori produk baru (Admin).
 */
export const createCategory = async (data: CreateCategoryInput) => {
  const { name } = data;

  // Check kalau ada kategori duplikat
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) {
    throw new AppError(
      409,
      `Category "${name}" already exists`,
      true,
      "CATEGORY_DUPLICATE",
    );
  }

  const slug = generateSlug(name);

  // Create category
  const category = await prisma.category.create({
    data: {
      name,
      slug,
    },
  });

  return category;
};

/**
 * Memperbarui data kategori (Admin).
 */
export const updateCategory = async (
  categoryId: string,
  data: UpdateCategoryInput,
) => {
  // Check kalau kategori ada
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    throw new AppError(404, "Category not found", true, "CATEGORY_NOT_FOUND");
  }

  // Jika nama diupdate, cek kalau ada kategori duplikat
  if (data.name && data.name !== existingCategory.name) {
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: "insensitive",
        },
        id: {
          not: categoryId,
        },
      },
    });

    if (duplicateCategory) {
      throw new AppError(
        409,
        `Category "${data.name}" already exists`,
        true,
        "CATEGORY_DUPLICATE",
      );
    }
  }

  const slug = data.name ? generateSlug(data.name) : existingCategory.slug;

  // Update category
  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      slug,
    },
  });

  return updatedCategory;
};

/**
 * Menghapus kategori produk (Admin).
 */
export const deleteCategory = async (categoryId: string) => {
  // check kalau kategori ada
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    throw new AppError(404, "Category not found", true, "CATEGORY_NOT_FOUND");
  }

  // Check kalau kategori ada produk
  const productCount = await prisma.product.count({
    where: { categoryId },
  });

  if (productCount > 0) {
    throw new AppError(
      400,
      `Cannot delete category with ${productCount} product(s). Remove or reassign products first.`,
      true,
      "CATEGORY_HAS_PRODUCTS",
    );
  }

  // Delete category
  await prisma.category.delete({
    where: { id: categoryId },
  });

  return { success: true, message: "Category deleted successfully" };
};
