"use strict";

const { randomUUID } = require("crypto");

/**
 * Generate a unique transaction reference.
 * Format: JPY-<timestamp>-<random6chars>
 */
const generateReference = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `JPY-${ts}-${rand}`;
};

/**
 * Convert naira (NGN float) to kobo (integer).
 * All API amounts are received in NGN and stored as kobo.
 * @param {number} naira
 * @returns {number} kobo (integer)
 */
const nairaToKobo = (naira) => Math.round(Number(naira) * 100);

/**
 * Convert kobo (integer) to naira (NGN) for display.
 * @param {number} kobo
 * @returns {string} e.g. "1500.00"
 */
const koboToNaira = (kobo) => (Number(kobo) / 100).toFixed(2);

/**
 * Format kobo amount for API responses.
 * Returns both the raw kobo value and the formatted NGN string.
 */
const formatAmount = (kobo) => ({
  kobo: Number(kobo),
  naira: koboToNaira(kobo),
  currency: "NGN",
});

/**
 * Standard success response shape.
 */
const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard error response shape.
 */
const errorResponse = (res, message, statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Standard pagination metadata.
 */
const paginationMeta = (total, page, limit) => ({
  total,
  page: Number(page),
  limit: Number(limit),
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

/**
 * Safe pagination params from query string.
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = {
  generateReference,
  nairaToKobo,
  koboToNaira,
  formatAmount,
  successResponse,
  errorResponse,
  paginationMeta,
  getPaginationParams,
};
