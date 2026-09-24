import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import z from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  code: z.string().min(2, "Category code is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentCategoryId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateVariantSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(2, "Variant SKU is required"),
  barcode: z.string().optional(),
  attributes: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional(),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  stockQuantity: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  status: z.enum(["active", "discontinued", "out_of_stock"]).optional(),
  image: z.string().optional(),
});

export const UpdateVariantSchema = CreateVariantSchema.partial();

export const UomSchemaZod = z.object({
  unit: z.string().min(1, "Primary unit of measurement is required"),
  baseUnit: z.string().optional(),
  conversionFactor: z.number().optional(),
  allowedUnits: z.array(z.string()).optional(),
});

export const CustomAttributeSchemaZod = z.object({
  key: z.string().min(1, "Attribute key is required"),
  value: z.any(),
  unit: z.string().optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(2, "Product SKU code is required"),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  type: z
    .enum([
      "finished_good",
      "raw_material",
      "semi_finished",
      "component",
      "packaging",
      "service",
      "other",
    ])
    .optional(),
  status: z.enum(["active", "draft", "discontinued", "archived"]).optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  costPrice: z.number().min(0, "Cost price cannot be negative").optional(),
  taxRate: z.number().min(0).optional(),
  stockQuantity: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  uom: UomSchemaZod.optional().default({ unit: "pcs", conversionFactor: 1 }),
  attributes: z.array(CustomAttributeSchemaZod).optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        sku: z.string(),
        barcode: z.string().optional(),
        attributes: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
        price: z.number().optional(),
        costPrice: z.number().optional(),
        stockQuantity: z.number().optional(),
        minStockLevel: z.number().optional(),
        status: z.enum(["active", "discontinued", "out_of_stock"]).optional(),
        image: z.string().optional(),
      })
    )
    .optional(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export class ProductController {
  // ==========================================
  // CATEGORIES
  // ==========================================

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { page, limit, search, status } = req.query;

      const result = await productService.getCategories(companyId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.categories,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const category = await productService.getCategoryById(id, companyId);
      if (!category) {
        res.status(404).json({ success: false, message: "Category not found" });
        return;
      }

      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const category = await productService.createCategory(companyId, userId, req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      if (error.message && error.message.includes("already exists")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      const category = await productService.updateCategory(id, companyId, userId, req.body);
      res.status(200).json({ success: true, data: category });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message && (error.message.includes("already exists") || error.message.includes("cannot be its own parent"))) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      await productService.deleteCategory(id, companyId, userId);
      res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // ==========================================
  // VARIANTS
  // ==========================================

  async getVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { productId, page, limit, search, status } = req.query;

      const result = await productService.getVariants(companyId, {
        productId: productId ? String(productId) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.variants,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getVariantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const variant = await productService.getVariantById(id, companyId);
      if (!variant) {
        res.status(404).json({ success: false, message: "Variant not found" });
        return;
      }

      res.status(200).json({ success: true, data: variant });
    } catch (error) {
      next(error);
    }
  }

  async createVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const variant = await productService.createVariant(companyId, userId, req.body);
      res.status(201).json({ success: true, data: variant });
    } catch (error: any) {
      if (error.message && error.message.includes("already exists")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      const variant = await productService.updateVariant(id, companyId, userId, req.body);
      res.status(200).json({ success: true, data: variant });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message && error.message.includes("already exists")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      await productService.deleteVariant(id, companyId, userId);
      res.status(200).json({ success: true, message: "Variant deleted successfully" });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, categoryId, type, status, minPrice, maxPrice, page, limit, sortBy, sortOrder } = req.query;

      const result = await productService.getProducts(companyId, {
        search: search ? String(search) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        type: type ? String(type) : undefined,
        status: status ? String(status) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy ? String(sortBy) : undefined,
        sortOrder: sortOrder === "asc" ? "asc" : "desc",
      });

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const product = await productService.getProductById(id, companyId);
      if (!product) {
        res.status(404).json({ success: false, message: "Product record not found" });
        return;
      }

      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const product = await productService.createProduct(companyId, userId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      if (error.message && (error.message.includes("already exists") || error.message.includes("does not exist"))) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      const product = await productService.updateProduct(id, companyId, userId, req.body);
      res.status(200).json({ success: true, data: product });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message && error.message.includes("already exists")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      await productService.deleteProduct(id, companyId, userId);
      res.status(200).json({ success: true, message: "Product catalog item deactivated successfully" });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // ==========================================
  // IMAGE & DOCUMENT ATTACHMENTS
  // ==========================================

  async uploadProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;
      const isPrimary = req.body?.isPrimary !== undefined ? Boolean(req.body.isPrimary) : true;

      const result = await productService.uploadProductImage(
        id,
        companyId,
        userId,
        req.file,
        isPrimary
      );

      res.status(200).json({
        success: true,
        message: "Product image uploaded successfully",
        data: result,
      });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        res.status(400).json({ success: false, message: "Image URL is required" });
        return;
      }

      const product = await productService.deleteProductImage(id, companyId, userId, imageUrl);
      res.status(200).json({ success: true, message: "Product image removed successfully", data: product });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async uploadProductDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;
      const { title, docType, notes } = req.body;

      const doc = await productService.uploadProductDocument(id, companyId, userId, req.file, {
        title,
        docType,
        notes,
      });

      res.status(201).json({
        success: true,
        message: "Product document uploaded successfully",
        data: doc,
      });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteProductDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id, docId } = req.params;

      await productService.deleteProductDocument(id, docId, companyId, userId);
      res.status(200).json({ success: true, message: "Product document deleted successfully" });
    } catch (error: any) {
      if (error.message && error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }
}

export const productController = new ProductController();
export default productController;
