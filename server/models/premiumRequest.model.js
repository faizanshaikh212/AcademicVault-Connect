import mongoose from "mongoose";

const premiumRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    paymentMethodId: {
      type: String,
      required: true,
      match: [/^[a-zA-Z0-9]+@[a-zA-Z]+$/, "Please provide a valid payment ID"], // Basic format validation
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one user can only have one pending request at a time
premiumRequestSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

const PremiumRequest = mongoose.model("PremiumRequest", premiumRequestSchema);

export default PremiumRequest;
