import express from "express";
import { createOrder, getPaymentDetails } from "../controllers/Payment.js"; // Import the controller methods

const router = express.Router();

// Route to create an order (payment request)
router.post("/create-order", createOrder);

// Route to fetch payment details by payment ID
router.get("/get/:paymentId", getPaymentDetails);

export default router;
