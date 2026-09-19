import { Request, Response } from "express";
import { customerService } from "../services/customer.service";

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const result = await customerService.getCustomers(companyId, req.query as any);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const customer = await customerService.getCustomerById(req.params.id, companyId);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found." });
      return;
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const userId = (req as any).user?._id || "60d0fe4f5311236168a109cb";
    const customer = await customerService.createCustomer(req.body, companyId, userId);
    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const customer = await customerService.updateCustomer(req.params.id, req.body, companyId);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found." });
      return;
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const success = await customerService.deleteCustomer(req.params.id, companyId);
    if (!success) {
      res.status(404).json({ success: false, message: "Customer not found." });
      return;
    }
    res.status(200).json({ success: true, message: "Customer removed successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const orders = await customerService.getCustomerOrders(req.params.id, companyId);
    res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCustomerDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const userId = (req as any).user?._id;
    const docPayload = {
      title: req.body.title || "Document Attachment",
      category: req.body.category || "OTHER",
      fileName: req.file?.originalname || req.body.fileName || "attachment.pdf",
      fileUrl: req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl || "https://example.com/doc.pdf",
      fileSize: req.file?.size || req.body.fileSize || 102400,
      mimeType: req.file?.mimetype || req.body.mimeType || "application/pdf",
      uploadedBy: userId,
      uploadedAt: new Date(),
      notes: req.body.notes,
    };
    const customer = await customerService.addCustomerDocument(req.params.id, docPayload, companyId);
    res.status(201).json({ success: true, data: customer?.documents });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeCustomerDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId || "60d0fe4f5311236168a109ca";
    const customer = await customerService.removeCustomerDocument(req.params.id, req.params.docId, companyId);
    res.status(200).json({ success: true, data: customer?.documents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
