import { Router } from "express";
import multer from "multer";
import {
  productController,
  CreateProductSchema,
  UpdateProductSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateVariantSchema,
  UpdateVariantSchema,
} from "../controllers/product.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Configure Multer for in-memory file uploads (for Cloudinary / Mock upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file limit
  },
});

// Apply authentication and tenant isolation globally to all product catalog endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// ==========================================
// CATEGORY ROUTES
// (Must be defined BEFORE /:id to avoid routing collision)
// ==========================================

// GET /api/products/categories
router.get(
  "/categories",
  requirePermission("products:read") as any,
  (req: any, res: any, next: any) => productController.getCategories(req, res, next)
);

// POST /api/products/categories
router.post(
  "/categories",
  requirePermission("products:create") as any,
  validateRequest(CreateCategorySchema),
  (req: any, res: any, next: any) => productController.createCategory(req, res, next)
);

// GET /api/products/categories/:id
router.get(
  "/categories/:id",
  requirePermission("products:read") as any,
  (req: any, res: any, next: any) => productController.getCategoryById(req, res, next)
);

// PUT /api/products/categories/:id
router.put(
  "/categories/:id",
  requirePermission("products:update") as any,
  validateRequest(UpdateCategorySchema),
  (req: any, res: any, next: any) => productController.updateCategory(req, res, next)
);

// DELETE /api/products/categories/:id
router.delete(
  "/categories/:id",
  requirePermission("products:delete") as any,
  (req: any, res: any, next: any) => productController.deleteCategory(req, res, next)
);

// ==========================================
// VARIANT ROUTES
// (Must be defined BEFORE /:id to avoid routing collision)
// ==========================================

// GET /api/products/variants
router.get(
  "/variants",
  requirePermission("products:read") as any,
  (req: any, res: any, next: any) => productController.getVariants(req, res, next)
);

// POST /api/products/variants
router.post(
  "/variants",
  requirePermission("products:create") as any,
  validateRequest(CreateVariantSchema),
  (req: any, res: any, next: any) => productController.createVariant(req, res, next)
);

// GET /api/products/variants/:id
router.get(
  "/variants/:id",
  requirePermission("products:read") as any,
  (req: any, res: any, next: any) => productController.getVariantById(req, res, next)
);

// PUT /api/products/variants/:id
router.put(
  "/variants/:id",
  requirePermission("products:update") as any,
  validateRequest(UpdateVariantSchema),
  (req: any, res: any, next: any) => productController.updateVariant(req, res, next)
);

// DELETE /api/products/variants/:id
router.delete(
  "/variants/:id",
  requirePermission("products:delete") as any,
  (req: any, res: any, next: any) => productController.deleteVariant(req, res, next)
);

// ==========================================
// PRODUCT CATALOG ROUTES
// ==========================================

// GET /api/products
router.get(
  "/",
  requirePermission("products:read") as any,
  (req: any, res: any, next: any) => productController.getProducts(req, res, next)
);

// POST /api/products
router.post(
  "/",
  requirePermission("products:create") as any,
  validateRequest(CreateProductSchema),
  (req: any, res: any, next: any) => productController.createProduct(req, res, next)
);

// POST /api/products/:id/image (Product Image Upload)
router.post(
  "/:id/image",
  requirePermission("products:update") as any,
  upload.single("image"),
  (req: any, res: any, next: any) => productController.uploadProductImage(req, res, next)
);

// DELETE /api/products/:id/image (Product Image Delete)
router.delete(
  "/:id/image",
  requirePermission("products:update") as any,
  (req: any, res: any, next: any) => productController.deleteProductImage(req, res, next)
);

// POST /api/products/:id/documents (Document Attachment Upload)
router.post(
  "/:id/documents",
  requirePermission("documents:create") as any,
  upload.single("file"),
  (req: any, res: any, next: any) => productController.uploadProductDocument(req, res, next)
);

// DELETE /api/products/:id/documents/:docId (Document Attachment Delete)
router.delete(
  "/:id/documents/:docId",
  requirePermission("documents:delete") as any,
  (req: any, res: any, next: any) => productController.deleteProductDocument(req, res, next)
);

// GET /api/products/:id (Product Details)
router.get(
  "/:id",
  requirePermission("products:read") as any,
  (req: any, res: any, next: any) => productController.getProductById(req, res, next)
);

// PUT /api/products/:id (Update Product Details)
router.put(
  "/:id",
  requirePermission("products:update") as any,
  validateRequest(UpdateProductSchema),
  (req: any, res: any, next: any) => productController.updateProduct(req, res, next)
);

// DELETE /api/products/:id (Deactivate / Delete Product)
router.delete(
  "/:id",
  requirePermission("products:delete") as any,
  (req: any, res: any, next: any) => productController.deleteProduct(req, res, next)
);

export default router;
