/**
 * Pagination Utility
 * Provides standardized query parsing, limits enforcement, and metadata generation.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses and sanitizes pagination query parameters.
 * Enforces page >= 1, 1 <= limit <= 100.
 */
function parsePaginationParams(query = {}) {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  } else if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Builds standard pagination response metadata.
 */
function buildPaginationMetadata(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Paginates an in-memory array (used for devStore compatibility).
 */
function paginateArray(items, page, limit) {
  const total = items.length;
  const skip = (page - 1) * limit;
  const paginatedItems = items.slice(skip, skip + limit);
  const pagination = buildPaginationMetadata(total, page, limit);
  return { items: paginatedItems, paginatedItems, pagination };
}

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePaginationParams,
  buildPaginationMetadata,
  paginateArray,
};
