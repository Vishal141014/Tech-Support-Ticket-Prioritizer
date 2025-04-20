import Ticket from "../models/ticket.model.js";

export const createTicket = async (req, res) => {
  const { subject, description, dueDate } = req.body;
  const ticket = await Ticket.create({
    subject,
    description,
    user: req.user.id,
    dueDate,
  });
  res.json(ticket);
};

export const getMyTickets = async (req, res) => {
  const tickets = await Ticket.find({ user: req.user.id });
  res.json(tickets);
};

export const getAllTickets = async (req, res) => {
  const tickets = await Ticket.find().populate("user", "name email");
  res.json(tickets);
};
