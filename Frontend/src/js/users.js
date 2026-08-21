// frontend/src/js/users.js

document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    fetchUsersData();

    // DOM Elements
    const userSearchInput = document.getElementById('userSearchInput');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const openAddUserModalBtn = document.getElementById('openAddUserModalBtn');
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    const cancelUserModalBtn = document.getElementById('cancelUserModalBtn');
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');

    // Event Listeners for Filters & Search
    if (userSearchInput) userSearchInput.addEventListener('input', filterUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);
    if (statusFilter) statusFilter.addEventListener('change', filterUsers);

    // Modal Triggers
    if (openAddUserModalBtn) {
        openAddUserModalBtn.addEventListener('click', () => openUserModal());
    }
    if (closeUserModalBtn) {
        closeUserModalBtn.addEventListener('click', closeUserModal);
    }
    if (cancelUserModalBtn) {
        cancelUserModalBtn.addEventListener('click', closeUserModal);
    }

    // Form Submission
    if (userForm) {
        userForm.addEventListener('submit', handleUserFormSubmit);
    }
});

let allUsersData = [];

/**
 * Fetch all users from backend API
 */
async function fetchUsersData() {
    try {
        // Replace with your actual backend endpoint from api.js if defined
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        allUsersData = await response.json();
        
        updateUserMetrics(allUsersData);
        renderUsersTable(allUsersData);
    } catch (error) {
        console.error('Error loading users:', error);
        // Fallback demo data if API is offline
        allUsersData = getFallbackUsers();
        updateUserMetrics(allUsersData);
        renderUsersTable(allUsersData);
    }
}

/**
 * Update Metric Cards
 */
function updateUserMetrics(users) {
    const totalUsers = users.length;
    const activeStudents = users.filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE').length;
    const staffCount = users.filter(u => u.role === 'STAFF').length;
    const blockedCount = users.filter(u => u.status === 'BLOCKED').length;

    document.getElementById('metricTotalUsers').textContent = totalUsers;
    document.getElementById('metricActiveStudents').textContent = activeStudents;
    document.getElementById('metricStaff').textContent = staffCount;
    document.getElementById('metricBlockedUsers').textContent = blockedCount;
}

/**
 * Render Users Table
 */
function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No users found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = users.map(user => `
        <tr>
            <td><strong>#${user.id}</strong></td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-role-${user.role.toLowerCase()}">${user.role}</span></td>
            <td>${user.balance ? user.balance.toFixed(2) : '0.00'} ETB</td>
            <td>
                <span class="status-badge ${user.status === 'ACTIVE' ? 'status-active' : 'status-blocked'}">
                    ${user.status}
                </span>
            </td>
            <td>
                <button class="btn-icon-action" onclick="editUser('${user.id}')" title="Edit User">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon-action ${user.status === 'ACTIVE' ? 'text-danger' : 'text-success'}" 
                        onclick="toggleUserStatus('${user.id}', '${user.status}')" 
                        title="${user.status === 'ACTIVE' ? 'Block User' : 'Activate User'}">
                    <i class="fa-solid ${user.status === 'ACTIVE' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter users by Search Input, Role, and Status
 */
function filterUsers() {
    const searchVal = document.getElementById('userSearchInput').value.toLowerCase();
    const roleVal = document.getElementById('roleFilter').value;
    const statusVal = document.getElementById('statusFilter').value;

    const filtered = allUsersData.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchVal) || 
                              user.email.toLowerCase().includes(searchVal) || 
                              user.id.toString().includes(searchVal);
        const matchesRole = roleVal === '' || user.role === roleVal;
        const matchesStatus = statusVal === '' || user.status === statusVal;

        return matchesSearch && matchesRole && matchesStatus;
    });

    renderUsersTable(filtered);
}

/**
 * Modal Management
 */
function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (user) {
        modalTitle.textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userBalance').value = user.balance || 0;
    } else {
        modalTitle.textContent = 'Add New User';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
    }

    modal.style.display = 'flex';
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.style.display = 'none';
}

/**
 * Add / Edit Form Handler
 */
async function handleUserFormSubmit(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value;
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        balance: parseFloat(document.getElementById('userBalance').value) || 0
    };

    try {
        const method = userId ? 'PUT' : 'POST';
        const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error('Failed to save user');

        closeUserModal();
        fetchUsersData();
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Action complete (Simulated).');
        
        // Mock UI Update if no live backend response
        if (userId) {
            const idx = allUsersData.findIndex(u => u.id == userId);
            if (idx !== -1) allUsersData[idx] = { ...allUsersData[idx], ...userData };
        } else {
            allUsersData.push({ id: Date.now(), ...userData, status: 'ACTIVE' });
        }
        
        closeUserModal();
        updateUserMetrics(allUsersData);
        renderUsersTable(allUsersData);
    }
}

/**
 * Edit User Action
 */
window.editUser = function(id) {
    const user = allUsersData.find(u => u.id == id);
    if (user) openUserModal(user);
};

/**
 * Toggle Block/Active Status
 */
window.toggleUserStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) return;

    try {
        await fetch(`/api/admin/users/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ status: newStatus })
        });
    } catch (error) {
        console.error('Status update error:', error);
    }

    // Update locally
    const user = allUsersData.find(u => u.id == id);
    if (user) user.status = newStatus;
    
    updateUserMetrics(allUsersData);
    renderUsersTable(allUsersData);
};

/**
 * Mock Fallback Data
 */
function getFallbackUsers() {
    return [
        { id: '1001', name: 'Abebe Bikila', email: 'abebe@cafeteria.com', role: 'STUDENT', balance: 250.00, status: 'ACTIVE' },
        { id: '1002', name: 'Tigist Assefa', email: 'tigist@cafeteria.com', role: 'STUDENT', balance: 50.00, status: 'ACTIVE' },
        { id: '1003', name: 'Kebede Michael', email: 'kebede@cafeteria.com', role: 'STAFF', balance: 500.00, status: 'ACTIVE' },
        { id: '1004', name: 'Marta Hailu', email: 'marta@cafeteria.com', role: 'STUDENT', balance: 0.00, status: 'BLOCKED' },
        { id: '1005', name: 'Admin Demo', email: 'admin@cafeteria.com', role: 'ADMIN', balance: 1000.00, status: 'ACTIVE' }
    ];
}