import { Router } from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  addCustomerDocument,
  removeCustomerDocument,
} from "../controllers/customer.controller";

const router = Router();

router.get("/", getCustomers);
router.post("/", createCustomer);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

router.get("/:id/orders", getCustomerOrders);
router.post("/:id/documents", addCustomerDocument);
router.delete("/:id/documents/:docId", removeCustomerDocument);

export default router;
