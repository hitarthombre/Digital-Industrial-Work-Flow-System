import { Request, Response, NextFunction } from "express";
import z from "zod";
import { documentService } from "../services/document.service";
import { DOCUMENT_CATEGORIES, DOCUMENT_LINK_MODULES } from "../models/Document";

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const documentFields = {
  title: z.string().min(1, "Document title is required").max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  documentNumber: z.string().max(60).optional(),
  version: z.string().max(20).optional(),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("A valid file URL is required"),
  fileType: z.string().optional(),
  fileSize: z.number().min(0).max(10 * 1024 * 1024, "Files must be 10MB or smaller").optional(),
  linkedModule: z.enum(DOCUMENT_LINK_MODULES).optional(),
  linkedRecordId: z.string().optional(),
  linkedRecordLabel: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
};

export const CreateDocumentSchema = z.object(documentFields);
export const UpdateDocumentSchema = z.object(documentFields).partial();

// ==========================================
// CONTROLLER CLASS
// ==========================================

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class DocumentController {
  // GET /api/documents
  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await documentService.getDocuments(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/documents/stats
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await documentService.getStats(ctx(req).companyId));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/documents
  async createDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const document = await documentService.createDocument(companyId, userId, req.body);
      res.status(201).json({ success: true, message: "Document saved to library", data: document });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/documents/:id
  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const document = await documentService.getDocumentById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/documents/:id
  async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const document = await documentService.updateDocument(companyId, userId, req.params.id, req.body);
      res.status(200).json({ success: true, message: "Document updated", data: document });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/documents/:id
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      await documentService.deleteDocument(companyId, userId, req.params.id);
      res.status(200).json({ success: true, message: "Document removed from library" });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
export default documentController;
