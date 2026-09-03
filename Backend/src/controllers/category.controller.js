const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const { MESSAGES, HTTP_STATUS } = require('../config/constants');

/**
* @desc    Get all categories
* @route   GET /api/categories
* @access  Public
*
* Frontend: menu.html → Category

pills, admin/categories.html
* Response: { success, count, categories: [...] }
*/
exports.getAllCategories = async (req, res) => {
try {
const categories = await Category.find()
.sort({ sortOrder: 1, createdAt: 1 });

// Get item count for each category
const categoriesWithCount = await Promise.all(
categories.map(async (cat) => {

const count = await MenuItem.countDocuments({
category: cat.id
});
return {
id: cat.id,
name: cat.name,
icon: cat.icon,
description: cat.description,
isActive: cat.isActive,
itemCount: count,
sortOrder: cat.sortOrder
};
})
);



res.status(HTTP_STATUS.OK).json({
success: true,
count: categoriesWithCount.length,
categories: categoriesWithCount
});

} catch (error) {
console.error('❌ Get All Categories Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});

}
};

/**
* @desc    Get single category by ID
* @route   GET /api/categories/:id
* @access  Public
*
* Frontend: menu.html → Category filter
* Response: { success, category }
*/
exports.getCategoryById = async (req, res) => {
try {
const category = await Category.findOne({ id: req.params.id });


if (!category) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Category not found'
});
}

const count = await MenuItem.countDocuments({
category: category.id
});

res.status(HTTP_STATUS.OK).json({
success: true,

category: {
id: category.id,
name: category.name,
icon: category.icon,
description: category.description,
isActive: category.isActive,
itemCount: count,
sortOrder: category.sortOrder
}
});

} catch (error) {
console.error('❌ Get Category By ID Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Create new category (Admin only)
* @route   POST /api/categories
* @access  Private/Admin
*
* Frontend: admin/categories.html → Add New Category
* Expected Body: { id, name, icon, description, isActive }

* Response: { success, category }
*/
exports.createCategory = async (req, res) => {
try {
const { id, name, icon, description, isActive } = req.body;

// ✅ Validate required fields
if (!id || !name) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,
error: 'Category ID and name are required'
});
}


// ✅ Check if category exists
const existingCategory = await Category.findOne({ id: id.toLowerCase() });
if (existingCategory) {
return res.status(HTTP_STATUS.CONFLICT).json({
success: false,
error: 'Category with this ID already exists'
});
}

// ✅ Create category
const category = await Category.create({

id: id.toLowerCase(),
name: {
en: name.en || name,
am: name.am || name
},
icon: icon || '🍽️',
description: {
en: description?.en || '',
am: description?.am || ''
},
isActive: isActive !== undefined ? isActive : true,
sortOrder: await Category.countDocuments()
});

res.status(HTTP_STATUS.CREATED)

.json({
success: true,
category: {
id: category.id,
name: category.name,
icon: category.icon,
description: category.description,
isActive: category.isActive,
sortOrder: category.sortOrder
}
});

} catch (error) {
console.error('❌ Create Category Error:', error);


res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Update category (Admin only)
* @route   PUT /api/categories/:id
* @access  Private/Admin
*
* Frontend: admin/categories.html → Edit Category
* Expected Body: { name, icon,

description, isActive }
* Response: { success, category }
*/
exports.updateCategory = async (req, res) => {
try {
const { name, icon, description, isActive } = req.body;

const category = await Category.findOne({ id: req.params.id });
if (!category) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Category not found'

});
}

// ✅ Update fields
if (name) {
category.name = {
en: name.en || category.name.en,
am: name.am || category.name.am
};
}
if (icon) category.icon = icon;
if (description) {
category.description = {
en: description.en || category.description.en,
am: description.am ||

category.description.am
};
}
if (isActive !== undefined) category.isActive = isActive;

await category.save();

res.status(HTTP_STATUS.OK).json({
success: true,
category: {
id: category.id,
name: category.name,
icon: category.icon,
description: category.description,
isActive: category.isActive,

sortOrder: category.sortOrder
}
});

} catch (error) {
console.error('❌ Update Category Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Delete category (Admin only)
* @route   DELETE /api/categories/:id
* @access  Private/Admin
*
* Frontend: admin/categories.html → Delete Category
* Response: { success, message }
*/
exports.deleteCategory = async (req, res) => {
try {
const category = await Category.findOne({ id: req.params.id });
if (!category) {

return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Category not found'
});
}

// ✅ Check if category has items
const itemCount = await MenuItem.countDocuments({
category: category.id
});
if (itemCount > 0) {
return res.status(HTTP_STATUS.CONFLICT).json({

success: false,
error: `Cannot delete category with ${itemCount} menu items. Remove items first.`
});
}

await Category.findOneAndDelete({ id: req.params.id });

res.status(HTTP_STATUS.OK).json({
success: true,
message: 'Category deleted successfully'
});

} catch (error) {
console.error('❌ Delete Category Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};

/**
* @desc    Toggle category status (Admin only)
* @route   PATCH /api/categories/:id/status

* @access  Private/Admin
*
* Frontend: admin/categories.html → Toggle Active
* Expected Body: { isActive: true/false }
* Response: { success, category }
*/
exports.toggleCategoryStatus = async (req, res) => {
try {
const { isActive } = req.body;

if (isActive === undefined) {
return res.status(HTTP_STATUS.BAD_REQUEST).json({
success: false,

error: 'Status is required'
});
}

const category = await Category.findOneAndUpdate(
{ id: req.params.id },
{ isActive: isActive },
{ returnDocument: 'after' }
);

if (!category) {
return res.status(HTTP_STATUS.NOT_FOUND).json({
success: false,
error: 'Category not found'
});

}

res.status(HTTP_STATUS.OK).json({
success: true,
category: {
id: category.id,
name: category.name,
icon: category.icon,
isActive: category.isActive
}
});

} catch (error) {
console.error('❌ Toggle Category Status Error:', error);
res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
success: false,
error: MESSAGES.SERVER_ERROR
});
}
};
