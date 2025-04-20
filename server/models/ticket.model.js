import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "low",
    },
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    subject: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      default: "", // e.g., Admin response or last update note
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // auto-creates createdAt & updatedAt
  }
);

// Optional virtual `id`
TicketSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

TicketSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (_doc, ret) {
    delete ret._id;
  },
});

const Ticket = mongoose.model("Ticket", TicketSchema);
export default Ticket;
