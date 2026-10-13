"use strict";

const Joi = require("joi");

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required()
    .messages({ "string.empty": "First name is required" }),
  surname: Joi.string().trim().min(2).max(100).required()
    .messages({ "string.empty": "Surname is required" }),
  phoneNumber: Joi.string().pattern(/^\d{11}$/).required()
    .messages({
      "string.pattern.base": "Phone number must be exactly 11 digits",
      "string.empty": "Phone number is required",
    }),
  age: Joi.number().integer().min(18).max(120).required()
    .messages({
      "number.min": "You must be at least 18 years old to register",
      "any.required": "Age is required",
    }),
});

const setPinSchema = Joi.object({
  accountNumber: Joi.string().pattern(/^\d{10}$/).required()
    .messages({ "string.pattern.base": "Account number must be exactly 10 digits" }),
  pin: Joi.string().pattern(/^\d{4}$/).required()
    .messages({ "string.pattern.base": "PIN must be exactly 4 digits" }),
  confirmPin: Joi.string().valid(Joi.ref("pin")).required()
    .messages({ "any.only": "PINs do not match" }),
});

const loginSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\d{11}$/).required()
    .messages({ "string.pattern.base": "Phone number must be exactly 11 digits" }),
  pin: Joi.string().pattern(/^\d{4}$/).required()
    .messages({ "string.pattern.base": "PIN must be exactly 4 digits" }),
});

const changePinSchema = Joi.object({
  currentPin: Joi.string().pattern(/^\d{4}$/).required(),
  newPin: Joi.string().pattern(/^\d{4}$/).required()
    .messages({ "string.pattern.base": "New PIN must be exactly 4 digits" }),
  confirmPin: Joi.string().valid(Joi.ref("newPin")).required()
    .messages({ "any.only": "New PINs do not match" }),
});

// ─── Account Schemas ──────────────────────────────────────────────────────────

const withdrawalSchema = Joi.object({
  amount: Joi.number().positive().min(100).max(1000000).required()
    .messages({
      "number.min": "Minimum withdrawal is ₦100",
      "number.max": "Maximum withdrawal is ₦1,000,000",
    }),
  pin: Joi.string().pattern(/^\d{4}$/).required(),
  reference: Joi.string().max(100).optional(),
});

// ─── Transfer Schemas ─────────────────────────────────────────────────────────

const validateRecipientSchema = Joi.object({
  accountNumber: Joi.string().pattern(/^\d{10}$/).required()
    .messages({ "string.pattern.base": "Account number must be exactly 10 digits" }),
});

const transferSchema = Joi.object({
  accountNumber: Joi.string().pattern(/^\d{10}$/).required()
    .messages({ "string.pattern.base": "Recipient account number must be exactly 10 digits" }),
  amount: Joi.number().positive().min(100).max(1000000).required()
    .messages({
      "number.min": "Minimum transfer is ₦100",
      "number.max": "Maximum transfer is ₦1,000,000",
    }),
  pin: Joi.string().pattern(/^\d{4}$/).required()
    .messages({ "string.pattern.base": "PIN must be exactly 4 digits" }),
  narration: Joi.string().max(255).optional().allow(""),
  idempotencyKey: Joi.string().max(100).optional(),
});

// ─── Beneficiary Schemas ──────────────────────────────────────────────────────

const addBeneficiarySchema = Joi.object({
  accountNumber: Joi.string().pattern(/^\d{10}$/).required()
    .messages({ "string.pattern.base": "Account number must be exactly 10 digits" }),
  nickname: Joi.string().max(100).optional().allow(""),
});

// ─── Admin Schemas ────────────────────────────────────────────────────────────

const adminLoginSchema = Joi.object({
  username: Joi.string().required(),
  pin: Joi.string().pattern(/^\d{4}$/).required(),
});

const adminAdjustSchema = Joi.object({
  accountNumber: Joi.string().pattern(/^\d{10}$/).required(),
  amount: Joi.number().positive().min(100).max(10000000).required(),
  reason: Joi.string().min(5).max(500).required()
    .messages({ "string.min": "Reason must be at least 5 characters" }),
  reference: Joi.string().max(100).optional(),
});

const restrictAccountSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required(),
});

// ─── Validation Middleware Factory ────────────────────────────────────────────

/**
 * Returns an Express middleware that validates req.body against the given schema.
 * Returns 400 with the first validation error if invalid.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: true, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

module.exports = {
  registerSchema,
  setPinSchema,
  loginSchema,
  changePinSchema,
  withdrawalSchema,
  validateRecipientSchema,
  transferSchema,
  addBeneficiarySchema,
  adminLoginSchema,
  adminAdjustSchema,
  restrictAccountSchema,
  validate,
};
