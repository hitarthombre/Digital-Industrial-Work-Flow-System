import { Product, IProduct, IUom, ICustomAttribute, IProductDocument, IProductImage, IEmbeddedVariant } from "../models/Product";
import { Category, ICategory } from "../models/Category";
import { Variant, IVariant } from "../models/Variant";
import { auditService } from "./audit.service";
import cloudinary from "../config/cloudinary";
import { Types } from "mongoose";

export interface CreateCategoryInput {
  name: string;
  code: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string;
  status?: "active" | "inactive";
  icon?: string;
  image?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  code?: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string | null;
  status?: "active" | "inactive";
  icon?: string;
  image?: string;
}

export interface GetCategoriesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateVariantInput {
  productId?: string;
  name: string;
  sku: string;
  barcode?: string;
  attributes?: Array<{ key: string; value: string }>;
  price?: number;
  costPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  status?: "active" | "discontinued" | "out_of_stock";
  image?: string;
}

export interface UpdateVariantInput {
  name?: string;
  sku?: string;
  barcode?: string;
  attributes?: Array<{ key: string; value: string }>;
  price?: number;
  costPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  status?: "active" | "discontinued" | "out_of_stock";
  image?: string;
}

export interface GetVariantsOptions {
  productId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  type?: "finished_good" | "raw_material" | "semi_finished" | "component" | "packaging" | "service" | "other";
  status?: "active" | "draft" | "discontinued" | "archived";
  price?: number;
  costPrice?: number;
  taxRate?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  reorderQuantity?: number;
  uom: IUom;
  attributes?: ICustomAttribute[];
  variants?: IEmbeddedVariant[];
  imageUrl?: string;
  tags?: string[];
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  categoryId?: string | null;
  categoryName?: string;
  type?: "finished_good" | "raw_material" | "semi_finished" | "component" | "packaging" | "service" | "other";
  status?: "active" | "draft" | "discontinued" | "archived";
  price?: number;
  costPrice?: number;
  taxRate?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  reorderQuantity?: number;
  uom?: IUom;
  attributes?: ICustomAttribute[];
  variants?: IEmbeddedVariant[];
  imageUrl?: string;
  tags?: string[];
}

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class ProductService {
  // ==========================================
  // CATEGORY MANAGEMENT
  // ==========================================

  async createCategory(
    companyId: string,
    userId: string,
    data: CreateCategoryInput
  ): Promise<ICategory> {
    const code = data.code.trim().toUpperCase();

    const existingCode = await Category.findOne({ companyId, code, isDeleted: false });
    if (existingCode) {
      throw new Error(`Category with code '${code}' already exists`);
    }

    let categoryName = data.name.trim();
    const slug = data.slug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    let parentId: Types.ObjectId | undefined;
    if (data.parentCategoryId) {
      if (!Types.ObjectId.isValid(data.parentCategoryId)) {
        throw new Error("Invalid Parent Category ID format");
      }
      const parent = await Category.findOne({ _id: data.parentCategoryId, companyId, isDeleted: false });
      if (!parent) {
        throw new Error("Parent category not found");
      }
      parentId = parent._id as Types.ObjectId;
    }

    const category = await Category.create({
      companyId,
      name: categoryName,
      code,
      slug,
      description: data.description?.trim(),
      parentCategoryId: parentId,
      status: data.status || "active",
      icon: data.icon,
      image: data.image,
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "CATEGORY_CREATED",
      module: "products",
      referenceId: category._id.toString(),
      after: category.toObject(),
    });

    return category;
  }

  async getCategories(
    companyId: string,
    options: GetCategoriesOptions = {}
  ): Promise<{ categories: ICategory[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.limit || 50, 1), 200);
    const skip = (page - 1) * limit;

    const filter: any = { companyId, isDeleted: false };
    if (options.status) filter.status = options.status;
    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      filter.$or = [{ name: searchRegex }, { code: searchRegex }, { description: searchRegex }];
    }

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate("parentCategoryId", "name code"),
      Category.countDocuments(filter),
    ]);

    return {
      categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getCategoryById(categoryId: string, companyId: string): Promise<ICategory | null> {
    if (!Types.ObjectId.isValid(categoryId)) return null;
    return Category.findOne({ _id: categoryId, companyId, isDeleted: false }).populate("parentCategoryId", "name code");
  }

  async updateCategory(
    categoryId: string,
    companyId: string,
    userId: string,
    data: UpdateCategoryInput
  ): Promise<ICategory> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid Category ID format");
    }

    const category = await Category.findOne({ _id: categoryId, companyId, isDeleted: false });
    if (!category) {
      throw new Error("Category not found or access denied");
    }

    const beforeState = category.toObject();

    if (data.code && data.code.trim().toUpperCase() !== category.code) {
      const code = data.code.trim().toUpperCase();
      const existing = await Category.findOne({ companyId, code, isDeleted: false, _id: { $ne: categoryId } });
      if (existing) {
        throw new Error(`Category with code '${code}' already exists`);
      }
      category.code = code;
    }

    if (data.name) {
      category.name = data.name.trim();
      category.slug = data.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (data.description !== undefined) category.description = data.description?.trim();
    if (data.status !== undefined) category.status = data.status;
    if (data.icon !== undefined) category.icon = data.icon;
    if (data.image !== undefined) category.image = data.image;

    if (data.parentCategoryId !== undefined) {
      if (!data.parentCategoryId) {
        category.parentCategoryId = undefined;
      } else {
        if (!Types.ObjectId.isValid(data.parentCategoryId)) {
          throw new Error("Invalid Parent Category ID format");
        }
        if (data.parentCategoryId === categoryId) {
          throw new Error("Category cannot be its own parent");
        }
        const parent = await Category.findOne({ _id: data.parentCategoryId, companyId, isDeleted: false });
        if (!parent) throw new Error("Parent category not found");
        category.parentCategoryId = parent._id as Types.ObjectId;
      }
    }

    await category.save();

    await auditService.log({
      companyId,
      userId,
      action: "CATEGORY_UPDATED",
      module: "products",
      referenceId: category._id.toString(),
      before: beforeState,
      after: category.toObject(),
    });

    return category;
  }

  async deleteCategory(categoryId: string, companyId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid Category ID format");
    }

    const category = await Category.findOne({ _id: categoryId, companyId, isDeleted: false });
    if (!category) {
      throw new Error("Category not found or access denied");
    }

    category.isDeleted = true;
    category.status = "inactive";
    await category.save();

    await auditService.log({
      companyId,
      userId,
      action: "CATEGORY_DELETED",
      module: "products",
      referenceId: category._id.toString(),
      before: category.toObject(),
    });

    return true;
  }

  // ==========================================
  // VARIANT MANAGEMENT
  // ==========================================

  async createVariant(
    companyId: string,
    userId: string,
    data: CreateVariantInput
  ): Promise<IVariant> {
    const sku = data.sku.trim().toUpperCase();

    const existing = await Variant.findOne({ companyId, sku, isDeleted: false });
    if (existing) {
      throw new Error(`Variant with SKU '${sku}' already exists`);
    }

    let prodId: Types.ObjectId | undefined;
    if (data.productId) {
      if (!Types.ObjectId.isValid(data.productId)) {
        throw new Error("Invalid Product ID format");
      }
      const prod = await Product.findOne({ _id: data.productId, companyId, isDeleted: false });
      if (!prod) throw new Error("Associated product not found");
      prodId = prod._id as Types.ObjectId;
    }

    const variant = await Variant.create({
      companyId,
      productId: prodId,
      name: data.name.trim(),
      sku,
      barcode: data.barcode?.trim(),
      attributes: data.attributes || [],
      price: data.price,
      costPrice: data.costPrice,
      stockQuantity: data.stockQuantity || 0,
      minStockLevel: data.minStockLevel || 0,
      status: data.status || "active",
      image: data.image,
      createdBy: new Types.ObjectId(userId),
    });

    // If attached to product, sync with product's embedded variants array
    if (prodId) {
      await Product.updateOne(
        { _id: prodId },
        {
          $push: {
            variants: {
              _id: variant._id,
              name: variant.name,
              sku: variant.sku,
              barcode: variant.barcode,
              attributes: variant.attributes,
              price: variant.price,
              costPrice: variant.costPrice,
              stockQuantity: variant.stockQuantity,
              minStockLevel: variant.minStockLevel,
              status: variant.status,
              image: variant.image,
            },
          },
        }
      );
    }

    await auditService.log({
      companyId,
      userId,
      action: "VARIANT_CREATED",
      module: "products",
      referenceId: variant._id.toString(),
      after: variant.toObject(),
    });

    return variant;
  }

  async getVariants(
    companyId: string,
    options: GetVariantsOptions = {}
  ): Promise<{ variants: IVariant[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.limit || 50, 1), 200);
    const skip = (page - 1) * limit;

    const filter: any = { companyId, isDeleted: false };
    if (options.productId && Types.ObjectId.isValid(options.productId)) {
      filter.productId = new Types.ObjectId(options.productId);
    }
    if (options.status) filter.status = options.status;
    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      filter.$or = [{ name: searchRegex }, { sku: searchRegex }, { barcode: searchRegex }];
    }

    const [variants, total] = await Promise.all([
      Variant.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate("productId", "name sku price"),
      Variant.countDocuments(filter),
    ]);

    return {
      variants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getVariantById(variantId: string, companyId: string): Promise<IVariant | null> {
    if (!Types.ObjectId.isValid(variantId)) return null;
    return Variant.findOne({ _id: variantId, companyId, isDeleted: false }).populate("productId", "name sku price");
  }

  async updateVariant(
    variantId: string,
    companyId: string,
    userId: string,
    data: UpdateVariantInput
  ): Promise<IVariant> {
    if (!Types.ObjectId.isValid(variantId)) {
      throw new Error("Invalid Variant ID format");
    }

    const variant = await Variant.findOne({ _id: variantId, companyId, isDeleted: false });
    if (!variant) {
      throw new Error("Variant not found or access denied");
    }

    const beforeState = variant.toObject();

    if (data.sku && data.sku.trim().toUpperCase() !== variant.sku) {
      const sku = data.sku.trim().toUpperCase();
      const existing = await Variant.findOne({ companyId, sku, isDeleted: false, _id: { $ne: variantId } });
      if (existing) throw new Error(`Variant with SKU '${sku}' already exists`);
      variant.sku = sku;
    }

    if (data.name) variant.name = data.name.trim();
    if (data.barcode !== undefined) variant.barcode = data.barcode?.trim();
    if (data.attributes) variant.attributes = data.attributes;
    if (data.price !== undefined) variant.price = data.price;
    if (data.costPrice !== undefined) variant.costPrice = data.costPrice;
    if (data.stockQuantity !== undefined) variant.stockQuantity = data.stockQuantity;
    if (data.minStockLevel !== undefined) variant.minStockLevel = data.minStockLevel;
    if (data.status !== undefined) variant.status = data.status;
    if (data.image !== undefined) variant.image = data.image;

    await variant.save();

    await auditService.log({
      companyId,
      userId,
      action: "VARIANT_UPDATED",
      module: "products",
      referenceId: variant._id.toString(),
      before: beforeState,
      after: variant.toObject(),
    });

    return variant;
  }

  async deleteVariant(variantId: string, companyId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(variantId)) {
      throw new Error("Invalid Variant ID format");
    }

    const variant = await Variant.findOne({ _id: variantId, companyId, isDeleted: false });
    if (!variant) {
      throw new Error("Variant not found or access denied");
    }

    variant.isDeleted = true;
    variant.status = "discontinued";
    await variant.save();

    await auditService.log({
      companyId,
      userId,
      action: "VARIANT_DELETED",
      module: "products",
      referenceId: variant._id.toString(),
      before: variant.toObject(),
    });

    return true;
  }

  // ==========================================
  // PRODUCT CATALOG MANAGEMENT
  // ==========================================

  async createProduct(
    companyId: string,
    userId: string,
    data: CreateProductInput
  ): Promise<IProduct> {
    const sku = data.sku.trim().toUpperCase();

    const existingSKU = await Product.findOne({ companyId, sku, isDeleted: false });
    if (existingSKU) {
      throw new Error(`Product with SKU '${sku}' already exists in your company catalog`);
    }

    let categoryObjId: Types.ObjectId | undefined;
    let categoryName = data.categoryName?.trim();

    if (data.categoryId) {
      if (!Types.ObjectId.isValid(data.categoryId)) {
        throw new Error("Invalid Category ID format");
      }
      const category = await Category.findOne({ _id: data.categoryId, companyId, isDeleted: false });
      if (!category) {
        throw new Error("Selected category does not exist in your company");
      }
      categoryObjId = category._id as Types.ObjectId;
      categoryName = category.name;
    }

    const product = await Product.create({
      companyId,
      name: data.name.trim(),
      sku,
      barcode: data.barcode?.trim(),
      description: data.description?.trim(),
      categoryId: categoryObjId,
      categoryName,
      type: data.type || "finished_good",
      status: data.status || "active",
      price: data.price || 0,
      costPrice: data.costPrice || 0,
      taxRate: data.taxRate || 0,
      stockQuantity: data.stockQuantity || 0,
      minStockLevel: data.minStockLevel || 0,
      reorderQuantity: data.reorderQuantity || 0,
      uom: data.uom || { unit: "pcs", conversionFactor: 1 },
      attributes: data.attributes || [],
      variants: data.variants || [],
      imageUrl: data.imageUrl,
      images: data.imageUrl ? [{ url: data.imageUrl, isPrimary: true, uploadedAt: new Date() }] : [],
      tags: data.tags || [],
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCT_CREATED",
      module: "products",
      referenceId: product._id.toString(),
      after: product.toObject(),
    });

    return (await Product.findById(product._id).populate("categoryId", "name code")) || product;
  }

  async getProducts(
    companyId: string,
    options: GetProductsOptions = {}
  ): Promise<{ products: IProduct[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.limit || 12, 1), 100);
    const skip = (page - 1) * limit;

    const filter: any = { companyId, isDeleted: false };

    if (options.status && options.status !== "ALL") {
      filter.status = options.status;
    }
    if (options.type && options.type !== "ALL") {
      filter.type = options.type;
    }
    if (options.categoryId && options.categoryId !== "ALL") {
      if (Types.ObjectId.isValid(options.categoryId)) {
        filter.categoryId = new Types.ObjectId(options.categoryId);
      }
    }
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      filter.price = {};
      if (options.minPrice !== undefined) filter.price.$gte = Number(options.minPrice);
      if (options.maxPrice !== undefined) filter.price.$lte = Number(options.maxPrice);
    }
    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { categoryName: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    const sortField = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name code icon")
        .populate("createdBy", "firstName lastName email"),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getProductById(productId: string, companyId: string): Promise<IProduct | null> {
    if (!Types.ObjectId.isValid(productId)) return null;

    return Product.findOne({
      _id: productId,
      companyId,
      isDeleted: false,
    })
      .populate("categoryId", "name code icon description")
      .populate("createdBy", "firstName lastName email");
  }

  async updateProduct(
    productId: string,
    companyId: string,
    userId: string,
    data: UpdateProductInput
  ): Promise<IProduct> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format");
    }

    const product = await Product.findOne({ _id: productId, companyId, isDeleted: false });
    if (!product) {
      throw new Error("Product not found or access denied");
    }

    const beforeState = product.toObject();

    if (data.sku && data.sku.trim().toUpperCase() !== product.sku) {
      const sku = data.sku.trim().toUpperCase();
      const existing = await Product.findOne({ companyId, sku, isDeleted: false, _id: { $ne: productId } });
      if (existing) {
        throw new Error(`Product with SKU '${sku}' already exists in your company catalog`);
      }
      product.sku = sku;
    }

    if (data.name) product.name = data.name.trim();
    if (data.barcode !== undefined) product.barcode = data.barcode?.trim();
    if (data.description !== undefined) product.description = data.description?.trim();

    if (data.categoryId !== undefined) {
      if (!data.categoryId) {
        product.categoryId = undefined;
        product.categoryName = undefined;
      } else {
        if (!Types.ObjectId.isValid(data.categoryId)) {
          throw new Error("Invalid Category ID format");
        }
        const category = await Category.findOne({ _id: data.categoryId, companyId, isDeleted: false });
        if (!category) throw new Error("Category not found");
        product.categoryId = category._id as Types.ObjectId;
        product.categoryName = category.name;
      }
    } else if (data.categoryName !== undefined) {
      product.categoryName = data.categoryName.trim();
    }

    if (data.type !== undefined) product.type = data.type;
    if (data.status !== undefined) product.status = data.status;
    if (data.price !== undefined) product.price = data.price;
    if (data.costPrice !== undefined) product.costPrice = data.costPrice;
    if (data.taxRate !== undefined) product.taxRate = data.taxRate;
    if (data.stockQuantity !== undefined) product.stockQuantity = data.stockQuantity;
    if (data.minStockLevel !== undefined) product.minStockLevel = data.minStockLevel;
    if (data.reorderQuantity !== undefined) product.reorderQuantity = data.reorderQuantity;

    if (data.uom) {
      product.uom = { ...product.uom, ...data.uom };
    }

    if (data.attributes) product.attributes = data.attributes;
    if (data.variants) product.variants = data.variants;
    if (data.tags) product.tags = data.tags;

    if (data.imageUrl !== undefined) {
      product.imageUrl = data.imageUrl;
      if (data.imageUrl && !product.images?.some((img) => img.url === data.imageUrl)) {
        product.images = product.images || [];
        product.images.unshift({ url: data.imageUrl, isPrimary: true, uploadedAt: new Date() });
      }
    }

    await product.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCT_UPDATED",
      module: "products",
      referenceId: product._id.toString(),
      before: beforeState,
      after: product.toObject(),
    });

    return (await Product.findById(product._id).populate("categoryId", "name code icon")) || product;
  }

  async deleteProduct(productId: string, companyId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format");
    }

    const product = await Product.findOne({ _id: productId, companyId, isDeleted: false });
    if (!product) {
      throw new Error("Product not found or access denied");
    }

    const beforeState = product.toObject();

    product.isDeleted = true;
    product.status = "archived";
    await product.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCT_DELETED",
      module: "products",
      referenceId: product._id.toString(),
      before: beforeState,
      after: product.toObject(),
    });

    return true;
  }

  // ==========================================
  // PRODUCT IMAGE & DOCUMENT ATTACHMENTS
  // ==========================================

  async uploadProductImage(
    productId: string,
    companyId: string,
    userId: string,
    file?: Express.Multer.File,
    isPrimary: boolean = true
  ): Promise<{ imageUrl: string; images: IProductImage[] }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format");
    }

    const product = await Product.findOne({ _id: productId, companyId, isDeleted: false });
    if (!product) {
      throw new Error("Product not found or access denied");
    }

    let fileUrl: string;
    let publicId: string | undefined;

    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (file && isCloudinaryConfigured) {
      const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(fileBase64, {
        folder: `diws/${companyId}/products/images`,
        resource_type: "image",
      });
      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    } else if (file) {
      // Mock fallback mode if Cloudinary env is not set
      fileUrl = `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
      console.warn("[Product Image Upload] Cloudinary credentials missing. Used mock URL.");
    } else {
      throw new Error("No image file provided for upload");
    }

    const newImage: IProductImage = {
      url: fileUrl,
      publicId,
      isPrimary,
      uploadedAt: new Date(),
    };

    product.images = product.images || [];
    if (isPrimary) {
      product.images.forEach((img) => (img.isPrimary = false));
      product.imageUrl = fileUrl;
    }
    product.images.unshift(newImage);

    await product.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCT_IMAGE_UPLOADED",
      module: "products",
      referenceId: product._id.toString(),
      after: { imageUrl: fileUrl },
    });

    return {
      imageUrl: product.imageUrl || fileUrl,
      images: product.images,
    };
  }

  async deleteProductImage(
    productId: string,
    companyId: string,
    userId: string,
    imageUrl: string
  ): Promise<IProduct> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format");
    }

    const product = await Product.findOne({ _id: productId, companyId, isDeleted: false });
    if (!product) {
      throw new Error("Product not found or access denied");
    }

    product.images = (product.images || []).filter((img) => img.url !== imageUrl);
    if (product.imageUrl === imageUrl) {
      product.imageUrl = product.images.length > 0 ? product.images[0].url : undefined;
      if (product.images.length > 0) product.images[0].isPrimary = true;
    }

    await product.save();
    return product;
  }

  async uploadProductDocument(
    productId: string,
    companyId: string,
    userId: string,
    file?: Express.Multer.File,
    metadata?: { title?: string; docType?: string; notes?: string }
  ): Promise<IProductDocument> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format");
    }

    const product = await Product.findOne({ _id: productId, companyId, isDeleted: false });
    if (!product) {
      throw new Error("Product not found or access denied");
    }

    let fileUrl: string;
    let publicId: string | undefined;

    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (file && isCloudinaryConfigured) {
      const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(fileBase64, {
        folder: `diws/${companyId}/products/documents`,
        resource_type: "auto",
      });
      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    } else {
      fileUrl = file
        ? `https://res.cloudinary.com/demo/image/upload/sample.jpg`
        : "/uploads/sample_document.pdf";
      console.warn("[Product Document Upload] Cloudinary credentials missing or mock upload.");
    }

    const docTypeVal = (metadata?.docType as any) || "datasheet";
    const validDocTypes = ["datasheet", "user_manual", "cad_drawing", "compliance", "other"];

    const newDoc: IProductDocument = {
      title: metadata?.title || file?.originalname || "Product Document",
      docType: validDocTypes.includes(docTypeVal) ? docTypeVal : "datasheet",
      fileName: file ? file.originalname : `${(metadata?.title || "document").toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileUrl,
      fileSize: file ? file.size : 1024 * 500,
      publicId,
      uploadedAt: new Date(),
      notes: metadata?.notes,
    };

    product.documents = product.documents || [];
    product.documents.unshift(newDoc);

    await product.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCT_DOCUMENT_UPLOADED",
      module: "products",
      referenceId: product._id.toString(),
      after: newDoc,
    });

    return product.documents[0];
  }

  async deleteProductDocument(
    productId: string,
    docId: string,
    companyId: string,
    userId: string
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid Product ID format");
    }

    const product = await Product.findOne({ _id: productId, companyId, isDeleted: false });
    if (!product) {
      throw new Error("Product not found or access denied");
    }

    if (product.documents) {
      product.documents = product.documents.filter((d: any) => d._id?.toString() !== docId);
      await product.save();
    }

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCT_DOCUMENT_DELETED",
      module: "products",
      referenceId: productId,
    });

    return true;
  }
}

export const productService = new ProductService();
export default productService;
