import razorpay from "../utils/razorpayInstance.js";  // Import the Razorpay instance

// Create an order for payment
export const createOrder = async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // Amount in paisa (1 INR = 100 paisa)
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    // Create an order using the Razorpay API
    const order = await razorpay.orders.create(options);
    res.status(200).json(order); // Send the order details as the response
  } catch (err) {
    res.status(500).json({ message: "Error creating Razorpay order", error: err });
  }
};

// Get payment details by payment ID
export const getPaymentDetails = async (req, res) => {
  const { paymentId } = req.params;  // Extract payment ID from URL params

  try {
    // Fetch payment details using the Razorpay SDK
    const paymentDetails = await razorpay.payments.fetch(paymentId);
    res.status(200).json(paymentDetails);  // Send the payment details as response
  } catch (err) {
    res.status(500).json({
      message: "Error fetching payment details",
      error: err.message,
    });
  }
};
