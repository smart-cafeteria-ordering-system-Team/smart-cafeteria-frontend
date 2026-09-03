const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const { MESSAGES, HTTP_STATUS } = require('../config/constants');
const { processImageValue, deleteUploadedImage } = require('../utils/imageUpload');
const { logAction } = require('../utils/audit');

const VALID_CATEGORIES = [
  'breakfast',
  'mains',
  'main-meals',
  'fasting',
  'beverages',
  'snacks',
  'Lunch',
  'Dinner',
  'Drinks'
];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

function sanitize(item) {
  return {
    id: item._id,
    name: { en: item.name.en, am: item.name.am },
    category: item.category,
    price: item.price,
    description: { en: item.description.en || '', am: item.description.am || '' },
    icon: item.icon,
    image: item.image,
    preparationTime: item.preparationTime,
    availability: item.availability,
    isAvailable: item.isAvailable,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function assertValidCategory(category) {
  if (!category || !VALID_CATEGORIES.includes(category)) {
    const error = new Error(`Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}`);
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }
}

function assertValidPrice(price) {
  const parsed = Number(price);
  if (isNaN(parsed) || parsed < 0) {
    const error = new Error('Price must be a non-negative number');
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }
  return parsed;
}

/**
 * @desc    Get all menu items (admin) - search / filter / paginate / sort
 * @route   GET /api/v1/admin/menu
 * @access  Private/Admin
 * Query: search, category, availability, sort, page, limit
 * sort:   newest | oldest | name | price-asc | price-desc
 */
exports.getAllMenuItems = async (req, res) => {
  try {
    const { search, category, availability, sort = 'newest', page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const availabilityValue = String(availability || '').toLowerCase();
    if (availabilityValue && availabilityValue !== 'all') {
      const isAvailable =
        availabilityValue === 'available' ||
        availabilityValue === '1' ||
        availabilityValue === 'true';
      const isOut =
        availabilityValue === 'out_of_stock' ||
        availabilityValue === 'unavailable' ||
        availabilityValue === '0' ||
        availabilityValue === 'false';
      if (isAvailable) {
        filter.$and = [{ $or: [{ availability: true }, { isAvailable: true }] }];
      } else if (isOut) {
        filter.$and = [{ $or: [{ availability: false }, { isAvailable: false }] }];
      }
    }

    if (search) {
      const searchFilter = {
        $or: [
          { 'name.en': { $regex: search, $options: 'i' } },
          { 'name.am': { $regex: search, $options: 'i' } },
          { 'description.en': { $regex: search, $options: 'i' } },
          { 'description.am': { $regex: search, $options: 'i' } }
        ]
      };
      filter.$and = filter.$and ? filter.$and.concat(searchFilter) : [searchFilter];
    }

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name':
        sortOption = { 'name.en': 1 };
        break;
      case 'price-asc':
      case 'low-to-high':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
      case 'high-to-low':
        sortOption = { price: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const items = await MenuItem.find(filter).sort(sortOption).skip(skip).limit(limitNum);
    const total = await MenuItem.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: items.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      items: items.map(sanitize)
    });
  } catch (error) {
    console.error('❌ Admin Get Menu Items Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get single menu item (admin)
 * @route   GET /api/v1/admin/menu/:id
 * @access  Private/Admin
 */
exports.getMenuItemById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid menu item id' });
    }
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Menu item not found' });
    }
    res.status(HTTP_STATUS.OK).json({ success: true, item: sanitize(item) });
  } catch (error) {
    console.error('❌ Admin Get Menu Item By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Create menu item (admin)
 * @route   POST /api/v1/admin/menu
 * @access  Private/Admin
 * Body: { name: {en, am}, category, price, description: {en, am}, image | imageUrl,
 *         preparationTime, available | isAvailable }
 */
exports.createMenuItem = async (req, res) => {
  try {
    console.log('Incoming body:', req.body);
    console.log('Incoming file:', req.file);

    const {
      name,
      category,
      price,
      description,
      image,
      imageUrl,
      icon,
      preparationTime,
      available,
      isAvailable
    } = req.body;

    const nameEn = name && (name.en !== undefined ? name.en : name);
    const nameAm = name && name.am;
    if (!nameEn || !String(nameEn).trim() || !nameAm || !String(nameAm).trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Both English and Amharic names are required'
      });
    }

    let categoryValue;
    try {
      assertValidCategory(category);
      categoryValue = category;
    } catch (e) {
      return res.status(e.statusCode || HTTP_STATUS.BAD_REQUEST).json({ success: false, error: e.message });
    }

    let priceValue;
    try {
      priceValue = assertValidPrice(price);
    } catch (e) {
      return res.status(e.statusCode || HTTP_STATUS.BAD_REQUEST).json({ success: false, error: e.message });
    }

    let imageValue;
    try {
      if (req.file && req.file.filename) {
        imageValue = `/uploads/menu/${req.file.filename}`;
      } else {
        imageValue = processImageValue(image !== undefined ? image : imageUrl);
      }
    } catch (e) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: e.message });
    }

    const avail =
      available !== undefined ? Boolean(available) : isAvailable !== undefined ? Boolean(isAvailable) : true;

    const item = await MenuItem.create({
      name: { en: String(nameEn).trim(), am: String(nameAm).trim() },
      category: categoryValue,
      price: priceValue,
      description: {
        en: description && description.en ? String(description.en).trim() : '',
        am: description && description.am ? String(description.am).trim() : ''
      },
      icon: icon || '🍽️',
      image: imageValue,
      preparationTime: preparationTime || 10,
      availability: avail,
      isAvailable: avail
    });

    await logAction({
      req,
      action: 'FOOD_CREATED',
      entityType: 'MenuItem',
      entityId: String(item._id),
      description: `Created menu item "${item.name.en}" - ${item.category} (${item.price} ETB)`
    });

    res.status(HTTP_STATUS.CREATED).json({ success: true, item: sanitize(item) });
  } catch (error) {
    console.error('❌ Admin Create Menu Item Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Update menu item (admin)
 * @route   PUT /api/v1/admin/menu/:id
 * @access  Private/Admin
 * Supports partial updates. Pass image / imageUrl to change the image,
 * image: '' or image: null to remove it, or omit to keep the current one.
 */
exports.updateMenuItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid menu item id' });
    }

    const {
      name,
      category,
      price,
      description,
      image,
      imageUrl,
      icon,
      preparationTime,
      available,
      isAvailable
    } = req.body;

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Menu item not found' });
    }

    if (name !== undefined) {
      if (name.en !== undefined) {
        if (!String(name.en).trim()) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'English name cannot be empty' });
        }
        item.name.en = String(name.en).trim();
      }
      if (name.am !== undefined) {
        if (!String(name.am).trim()) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Amharic name cannot be empty' });
        }
        item.name.am = String(name.am).trim();
      }
    }

    if (category !== undefined) {
      try {
        assertValidCategory(category);
        item.category = category;
      } catch (e) {
        return res.status(e.statusCode || HTTP_STATUS.BAD_REQUEST).json({ success: false, error: e.message });
      }
    }

    if (price !== undefined) {
      try {
        item.price = assertValidPrice(price);
      } catch (e) {
        return res.status(e.statusCode || HTTP_STATUS.BAD_REQUEST).json({ success: false, error: e.message });
      }
    }

    if (description !== undefined) {
      if (description.en !== undefined) item.description.en = String(description.en).trim();
      if (description.am !== undefined) item.description.am = String(description.am).trim();
    }

    if (icon !== undefined) item.icon = icon;

    // Image handling: explicit "provided" check to support clearing.
    const fileUploaded = req.file && req.file.filename;
    const imageProvided = fileUploaded || req.body.image !== undefined || req.body.imageUrl !== undefined;
    if (imageProvided) {
      const rawImage = req.body.image !== undefined ? req.body.image : req.body.imageUrl;
      const previous = item.image;
      try {
        item.image = fileUploaded ? `/uploads/menu/${req.file.filename}` : processImageValue(rawImage);
      } catch (e) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: e.message });
      }
      // Clean up replaced uploaded file
      if (item.image !== previous) deleteUploadedImage(previous);
    }

    if (preparationTime !== undefined) {
      const parsed = Number(preparationTime);
      if (isNaN(parsed) || parsed < 1) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Preparation time must be at least 1 minute' });
      }
      item.preparationTime = parsed;
    }

    if (available !== undefined) {
      item.availability = Boolean(available);
      item.isAvailable = Boolean(available);
    } else if (isAvailable !== undefined) {
      item.isAvailable = Boolean(isAvailable);
      item.availability = Boolean(isAvailable);
    }

    await item.save();

    await logAction({
      req,
      action: 'FOOD_UPDATED',
      entityType: 'MenuItem',
      entityId: String(item._id),
      description: `Updated menu item "${item.name.en}"`
    });

    res.status(HTTP_STATUS.OK).json({ success: true, item: sanitize(item) });
  } catch (error) {
    console.error('❌ Admin Update Menu Item Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Toggle menu item availability (admin)
 * @route   PATCH /api/v1/admin/menu/:id/availability
 * @access  Private/Admin
 * Body: { available: true | false }
 */
exports.toggleAvailability = async (req, res) => {
  try {
    const { available } = req.body;
    if (available === undefined || available === null) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Available status is required' });
    }
    if (!isValidObjectId(req.params.id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid menu item id' });
    }

    const boolAvailable = Boolean(available);
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Menu item not found' });
    }

    item.availability = boolAvailable;
    item.isAvailable = boolAvailable;
    await item.save();

    await logAction({
      req,
      action: 'FOOD_AVAILABILITY_CHANGED',
      entityType: 'MenuItem',
      entityId: String(item._id),
      description: `Marked "${item.name.en}" as ${boolAvailable ? 'available' : 'unavailable'}`
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: boolAvailable ? `"${item.name.en}" is now available` : `"${item.name.en}" is now unavailable`,
      item: sanitize(item)
    });
  } catch (error) {
    console.error('❌ Admin Toggle Availability Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Delete menu item (admin)
 * @route   DELETE /api/v1/admin/menu/:id
 * @access  Private/Admin
 */
exports.deleteMenuItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid menu item id' });
    }
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Menu item not found' });
    }
    deleteUploadedImage(item.image);

    await logAction({
      req,
      action: 'FOOD_DELETED',
      entityType: 'MenuItem',
      entityId: String(item._id),
      description: `Deleted menu item "${item.name.en}" (${item.category})`
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('❌ Admin Delete Menu Item Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Menu statistics (admin)
 * @route   GET /api/v1/admin/menu/stats
 * @access  Private/Admin
 */
exports.getMenuStats = async (req, res) => {
  try {
    const totalItems = await MenuItem.countDocuments();
    const availableItems = await MenuItem.countDocuments({ availability: true, isAvailable: true });
    const outOfStockItems = await MenuItem.countDocuments({
      $or: [{ availability: false }, { isAvailable: false }]
    });
    const totalCategories = await Category.countDocuments();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: { totalItems, availableItems, outOfStockItems, totalCategories }
    });
  } catch (error) {
    console.error('❌ Admin Get Menu Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: MESSAGES.SERVER_ERROR });
  }
};