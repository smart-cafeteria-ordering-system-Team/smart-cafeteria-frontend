const ActivityLog = require('../models/ActivityLog');

const MAX_LENGTH = 400;

function cleanText(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim().slice(0, MAX_LENGTH);
}

/**
 * Append an audit trail entry for an administrative action.
 *
 * NEVER pass passwords, JWT tokens, API keys or hashed credentials here -
 * only safe human-readable descriptions.
 *
 * @param {object}   options
 * @param {object}   options.req        Express request (provides actor + ip)
 * @param {string}   options.action     e.g. 'USER_CREATED', 'FOOD_UPDATED'
 * @param {string}   [options.entityType]
 * @param {string}   [options.entityId]
 * @param {string}   [options.description]
 * @param {object}   [options.metadata]
 * @returns {Promise<object|null>} the created ActivityLog, or null on failure
 */
async function logAction({ req, action, entityType = '', entityId = '', description = '', metadata = {} }) {
  try {
    if (!req || !req.user || !req.user.id) return null;

    const safeMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};

    const log = await ActivityLog.create({
      actorId: req.user.id,
      actorName: cleanText(req.user.name) || 'Admin',
      action: cleanText(action),
      entity: cleanText(entityType),
      entityId: cleanText(entityId),
      description: cleanText(description),
      metadata: Object.assign({}, safeMetadata),
      ip: cleanText(req.ip || '').replace('::ffff:', ''),
    });

    return log;
  } catch (error) {
    // Audit logging must never break an admin flow.
    console.error('❌ Audit Log Error:', error.message);
    return null;
  }
}

module.exports = { logAction };