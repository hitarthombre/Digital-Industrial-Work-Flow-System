import { Types } from "mongoose";
import { DocumentModel, DocumentCategory, DocumentLinkModule, DOCUMENT_CATEGORIES } from "../models/Document";
import { auditService } from "./audit.service";
import { notFound } from "../utils/httpError";
import { escapeRegex, paginate } from "../utils/docNumber";

export interface DocumentInput {
  title: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
  documentNumber?: string;
  version?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  linkedModule?: DocumentLinkModule;
  linkedRecordId?: string;
  linkedRecordLabel?: string;
  effectiveDate?: string;
  expiryDate?: string;
}

const normalizeTags = (tags?: string[]) =>
  [...new Set((tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 20);

export class DocumentService {
  async createDocument(companyId: string, userId: string, input: DocumentInput) {
    const document = await DocumentModel.create({
      companyId: new Types.ObjectId(companyId),
      title: input.title.trim(),
      description: input.description,
      category: input.category || "other",
      tags: normalizeTags(input.tags),
      documentNumber: input.documentNumber,
      version: input.version || "1.0",
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      fileSize: Number(input.fileSize) || 0,
      linkedModule: input.linkedRecordId ? input.linkedModule || "none" : "none",
      linkedRecordId: input.linkedRecordId ? new Types.ObjectId(input.linkedRecordId) : undefined,
      linkedRecordLabel: input.linkedRecordId ? input.linkedRecordLabel : undefined,
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : undefined,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      uploadedBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "DOCUMENT_UPLOADED",
      module: "documents",
      referenceId: document._id.toString(),
      after: { title: document.title, category: document.category, fileName: document.fileName },
    });

    return document;
  }

  async getDocuments(companyId: string, query: any) {
    const { page, limit, skip } = paginate(query);
    const filter: any = { companyId, isDeleted: { $ne: true } };

    if (query.category && query.category !== "all") filter.category = query.category;
    if (query.linkedModule) filter.linkedModule = query.linkedModule;
    if (query.linkedRecordId) filter.linkedRecordId = query.linkedRecordId;
    if (query.tag) filter.tags = String(query.tag).toLowerCase();
    if (query.fileType) filter.fileType = { $regex: `^${escapeRegex(String(query.fileType))}`, $options: "i" };
    if (query.expiring === "true") {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      filter.expiryDate = { $lte: in30Days };
    }
    if (query.search) {
      const rx = { $regex: escapeRegex(String(query.search)), $options: "i" };
      filter.$or = [
        { title: rx },
        { description: rx },
        { fileName: rx },
        { tags: rx },
        { documentNumber: rx },
        { linkedRecordLabel: rx },
      ];
    }

    const sortField = ["createdAt", "title", "fileSize", "expiryDate"].includes(query.sortBy) ? query.sortBy : "createdAt";
    const sortDir = query.sortOrder === "asc" ? 1 : -1;

    const [documents, total] = await Promise.all([
      DocumentModel.find(filter)
        .populate("uploadedBy", "firstName lastName email")
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      DocumentModel.countDocuments(filter),
    ]);

    return { success: true, data: documents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getStats(companyId: string) {
    const [byCategory, totals, expiring] = await Promise.all([
      DocumentModel.aggregate([
        { $match: { companyId: new Types.ObjectId(companyId), isDeleted: { $ne: true } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      DocumentModel.aggregate([
        { $match: { companyId: new Types.ObjectId(companyId), isDeleted: { $ne: true } } },
        { $group: { _id: null, count: { $sum: 1 }, size: { $sum: "$fileSize" } } },
      ]),
      DocumentModel.countDocuments({
        companyId,
        isDeleted: { $ne: true },
        expiryDate: { $lte: new Date(Date.now() + 30 * 86400000) },
      }),
    ]);

    const counts: Record<string, number> = {};
    DOCUMENT_CATEGORIES.forEach((c) => (counts[c] = 0));
    byCategory.forEach((c: any) => (counts[c._id] = c.count));

    return {
      success: true,
      data: {
        total: totals[0]?.count || 0,
        totalSize: totals[0]?.size || 0,
        expiringSoon: expiring,
        byCategory: counts,
      },
    };
  }

  async getDocumentById(companyId: string, id: string) {
    const document = await DocumentModel.findOne({ _id: id, companyId, isDeleted: { $ne: true } }).populate(
      "uploadedBy",
      "firstName lastName email"
    );
    if (!document) throw notFound("Document");
    return document;
  }

  async updateDocument(companyId: string, userId: string, id: string, input: Partial<DocumentInput>) {
    const document = await DocumentModel.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!document) throw notFound("Document");

    const before = { title: document.title, category: document.category, version: document.version, fileName: document.fileName };

    if (input.title !== undefined) document.title = input.title.trim();
    if (input.description !== undefined) document.description = input.description;
    if (input.category !== undefined) document.category = input.category;
    if (input.tags !== undefined) document.tags = normalizeTags(input.tags);
    if (input.documentNumber !== undefined) document.documentNumber = input.documentNumber;
    if (input.version !== undefined) document.version = input.version;
    if (input.fileUrl !== undefined) {
      // Replacing the file uploads a new revision
      document.fileUrl = input.fileUrl;
      if (input.fileName) document.fileName = input.fileName;
      if (input.fileType !== undefined) document.fileType = input.fileType;
      if (input.fileSize !== undefined) document.fileSize = Number(input.fileSize) || 0;
    }
    if (input.linkedModule !== undefined) document.linkedModule = input.linkedModule;
    if (input.linkedRecordId !== undefined) {
      document.linkedRecordId = input.linkedRecordId ? new Types.ObjectId(input.linkedRecordId) : undefined;
      if (!input.linkedRecordId) document.linkedModule = "none";
    }
    if (input.linkedRecordLabel !== undefined) document.linkedRecordLabel = input.linkedRecordLabel;
    if (input.effectiveDate !== undefined) document.effectiveDate = input.effectiveDate ? new Date(input.effectiveDate) : undefined;
    if (input.expiryDate !== undefined) document.expiryDate = input.expiryDate ? new Date(input.expiryDate) : undefined;

    await document.save();

    await auditService.log({
      companyId,
      userId,
      action: "DOCUMENT_UPDATED",
      module: "documents",
      referenceId: document._id.toString(),
      before,
      after: { title: document.title, category: document.category, version: document.version, fileName: document.fileName },
    });

    return document;
  }

  async deleteDocument(companyId: string, userId: string, id: string) {
    const document = await DocumentModel.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!document) throw notFound("Document");

    document.isDeleted = true;
    await document.save();

    await auditService.log({
      companyId,
      userId,
      action: "DOCUMENT_DELETED",
      module: "documents",
      referenceId: document._id.toString(),
      before: { title: document.title, category: document.category },
    });

    return true;
  }
}

export const documentService = new DocumentService();
export default documentService;
