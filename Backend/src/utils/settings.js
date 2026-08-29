const Setting = require('../models/Setting');

const DEFAULT_SETTINGS = [
  {
    key: 'cafeteria_name',
    value: 'Smart Cafeteria',
    type: 'string',
    group: 'general',
    label: 'Cafeteria Name',
  },
  {
    key: 'currency',
    value: 'ETB',
    type: 'string',
    group: 'general',
    label: 'Currency',
  },
  {
    key: 'support_email',
    value: 'support@smartcafeteria.com',
    type: 'string',
    group: 'general',
    label: 'Support Email',
  },
  {
    key: 'support_phone',
    value: '+251 911 000 000',
    type: 'string',
    group: 'general',
    label: 'Support Phone',
  },
  {
    key: 'order_availability',
    value: true,
    type: 'boolean',
    group: 'operations',
    label: 'Order Availability',
  },
  {
    key: 'max_order_quantity',
    value: 10,
    type: 'number',
    group: 'operations',
    label: 'Maximum Order Quantity',
  },
  {
    key: 'maintenance_mode',
    value: false,
    type: 'boolean',
    group: 'operations',
    label: 'Maintenance Mode',
  },
];

async function ensureDefaultSettings() {
  for (const s of DEFAULT_SETTINGS) {
    await Setting.findOneAndUpdate(
      { key: s.key },
      { $setOnInsert: s },
      { upsert: true, new: true }
    );
  }
}

function coerceValue(key, value) {
  const def = DEFAULT_SETTINGS.find(s => s.key === key);
  if (!def) return value;
  if (def.type === 'boolean') return value === 'true' || value === true || value === 1 || value === '1';
  if (def.type === 'number') {
    const n = Number(value);
    return isNaN(n) ? def.value : n;
  }
  return String(value);
}

async function getSettingsMap({ includeProtected = false } = {}) {
  const filter = includeProtected ? {} : { protected: { $ne: true } };
  const settings = await Setting.find(filter).lean();
  const map = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  for (const def of DEFAULT_SETTINGS) {
    if (map[def.key] === undefined) {
      map[def.key] = def.value;
    }
  }
  return map;
}

async function getPublicSettings() {
  const map = await getSettingsMap({ includeProtected: false });
  return {
    cafeteriaName: map.cafeteria_name,
    currency: map.currency,
    orderAvailability: map.order_availability,
    maintenanceMode: map.maintenance_mode,
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  ensureDefaultSettings,
  coerceValue,
  getSettingsMap,
  getPublicSettings,
};