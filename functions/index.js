const admin = require('firebase-admin');

admin.initializeApp();

// ─── APP — Chat (httpsCallable) ───────────────────────────────────────────────
const chat = require('./app/chat/chatv2');
exports.listChannels                    = chat.listChannels;
exports.listChannelsWithFilters         = chat.listChannelsWithFilters;
exports.createChannel                   = chat.createChannel;
exports.markAsRead                      = chat.markAsRead;
exports.markUserAsTypingInChannel       = chat.markUserAsTypingInChannel;
exports.deleteMessage                   = chat.deleteMessage;
exports.listMessages                    = chat.listMessages;
exports.deleteGroup                     = chat.deleteGroup;
exports.leaveGroup                      = chat.leaveGroup;
exports.updateGroup                     = chat.updateGroup;
exports.addMessageReaction              = chat.addMessageReaction;
exports.insertMessage                   = chat.insertMessage;

// ─── APP — OpenAI / Chat AI (httpsCallable) ───────────────────────────────────
const chatAI = require('./app/openai/openai');
exports.insertMessageAI                 = chatAI.insertMessageAI;
exports.createChannelAI                 = chatAI.createChannelAI;

// ─── APP — Driver: Tickets (httpsCallable) ────────────────────────────────────
const processJobTicket = require('./app/tickets/processJobTicket');
exports.processJobTicket                = processJobTicket.processJobTicket;

// ─── APP — Finder: Trip Request (httpsCallable) ───────────────────────────────
const tripRequest = require('./app/tripRequest/tripRequest');
exports.triprequest                     = tripRequest.getFullTripRequest;

// ─── APP — Carrier: Projects (httpsCallable) ──────────────────────────────────
const assignCarrierProjectJob = require('./app/jobs/assignCarrierProjectJob');
exports.assignCarrierProjectJob         = assignCarrierProjectJob.assignCarrierProjectJob;

const vendorUser = require('./app/vendorUser/createVendorUser');
exports.createVendorUser                = vendorUser.createVendorUser;

const carrier = require('./app/carrier/createCarrier');
exports.createCarrier                   = carrier.createCarrier;

// ─── TRIGGERS — Chat ──────────────────────────────────────────────────────────
exports.syncChatFeedStatusOnChannelUpdate = chat.syncChatFeedStatusOnChannelUpdate;
exports.syncChatFeedStatusOnChannelCreate = chat.syncChatFeedStatusOnChannelCreate;

// ─── TRIGGERS — Users ─────────────────────────────────────────────────────────
const triggers = require('./triggers/triggers');
exports.propagateUserProfileUpdates     = triggers.propagateUserProfileUpdates;

// ─── TRIGGERS — Inspections ───────────────────────────────────────────────────
const inspections = require('./triggers/inspections/inspections');
exports.onVehicleInspectionCreated      = inspections.onVehicleInspectionCreated;
exports.onVehicleInspectionUpdated      = inspections.onVehicleInspectionUpdated;

const driverChange = require('./triggers/inspections/driverChange');
exports.onVehicleAssignedDriverChanged  = driverChange.onVehicleAssignedDriverChanged;

// ─── TRIGGERS — Requests / Deals ──────────────────────────────────────────────
exports.onRequestCreated = require('./triggers/distributeRequest/distributeRequest').onRequestCreated;

exports.onRequestUpdated        = require('./triggers/deels/onRequestUpdated').onRequestUpdated;
exports.onVendorRequestUpdated  = require('./triggers/deels/onVendorRequestUpdated').onVendorRequestUpdated;

// ─── TRIGGERS — Projects ──────────────────────────────────────────────────────
exports.onSetupFlagWritten = require('./triggers/projects/onSetupFlagWritten').onSetupFlagWritten;

// ─── LANDING — Investor Agent ────────────────────────────────────────────────
exports.getLogiTruckInvestorContext = require('./landing/openai/investorContext').getLogiTruckInvestorContext;
exports.getLogiTruckMarketStudy     = require('./landing/openai/marketStudy').getLogiTruckMarketStudy;
exports.saveLogiTruckInvestorTurn   = require('./landing/saveInvestorTurn').saveLogiTruckInvestorTurn;
exports.finalizeInvestorSession     = require('./landing/finalizeInvestorSession').finalizeInvestorSession;
