document.addEventListener("DOMContentLoaded", () => {
    
    /* ==========================================================================
       1. Header Dropdown Menu Logic (Works across all pages)
       ========================================================================== */
    const userMenuBtn = document.getElementById("user-menu-btn");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");

    if (userMenuBtn && userDropdownMenu) {
        // Toggle dropdown open/close on click
        userMenuBtn.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevents instant closing
            userDropdownMenu.classList.toggle("show");
        });

        // Close dropdown when clicking anywhere outside
        document.addEventListener("click", (event) => {
            if (!userMenuBtn.contains(event.target) && !userDropdownMenu.contains(event.target)) {
                userDropdownMenu.classList.remove("show");
            }
        });
    }


    /* ==========================================================================
       2. Profile Page Form & LocalStorage Logic
       ========================================================================== */
    const profileForm = document.getElementById("profile-form");

    // Only run profile logic if the profile form actually exists on the current page
    if (profileForm) {
        // Form & UI Elements
        const nameInput = document.getElementById("customer-name");
        const phoneInput = document.getElementById("customer-phone");
        const emailInput = document.getElementById("customer-email");
        const langSelect = document.getElementById("preferred-language");
        const diningTypeSelect = document.getElementById("default-dining-type");
        const tableInput = document.getElementById("default-table-number");

        // Sidebar Displays
        const sidebarName = document.getElementById("sidebar-user-name");
        const sidebarPhone = document.getElementById("sidebar-user-phone");
        const avatarPreview = document.getElementById("avatar-preview");
        const avatarUpload = document.getElementById("avatar-upload");
        const alertBox = document.getElementById("profile-alert");

        // Default Profile Fallback Data
        const defaultProfile = {
            name: "Abebe Kebede",
            phone: "0911234567",
            email: "abebe.k@example.com",
            language: "en",
            diningType: "dine-in",
            tableNumber: "Table 04",
            avatar: "https://via.placeholder.com/100"
        };

        // Load Saved Profile Data
        function loadProfileData() {
            const savedData = JSON.parse(localStorage.getItem("userProfile")) || defaultProfile;

            // Populate Form Controls
            if (nameInput) nameInput.value = savedData.name || "";
            if (phoneInput) phoneInput.value = savedData.phone || "";
            if (emailInput) emailInput.value = savedData.email || "";
            if (langSelect) langSelect.value = savedData.language || "en";
            if (diningTypeSelect) diningTypeSelect.value = savedData.diningType || "dine-in";
            if (tableInput) tableInput.value = savedData.tableNumber || "";

            // Update Sidebar Labels
            if (sidebarName) sidebarName.textContent = savedData.name || "Customer";
            if (sidebarPhone) sidebarPhone.textContent = savedData.phone || "No phone added";
            if (avatarPreview && savedData.avatar) {
                avatarPreview.src = savedData.avatar;
            }
        }

        // Handle Form Submission
        profileForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const updatedProfile = {
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                email: emailInput.value.trim(),
                language: langSelect.value,
                diningType: diningTypeSelect.value,
                tableNumber: tableInput.value.trim(),
                avatar: avatarPreview ? avatarPreview.src : defaultProfile.avatar
            };

            // Save to LocalStorage
            localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

            // Update Sidebar UI Immediately
            if (sidebarName) sidebarName.textContent = updatedProfile.name;
            if (sidebarPhone) sidebarPhone.textContent = updatedProfile.phone;

            // Update Header Name (if present on navbar)
            const headerUserName = document.querySelector(".user-name");
            if (headerUserName) {
                headerUserName.textContent = updatedProfile.name;
            }

            // Show Success Notification
            showAlert("Profile updated successfully!", "success");
        });

        // Handle Avatar Image Upload & Live Preview
        if (avatarUpload && avatarPreview) {
            avatarUpload.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        avatarPreview.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Alert Helper Function
        function showAlert(message, type = "success") {
            if (!alertBox) return;

            alertBox.textContent = message;
            alertBox.className = `alert-box alert-${type}`;
            alertBox.style.display = "block";

            setTimeout(() => {
                alertBox.style.display = "none";
            }, 3500);
        }

        // Initialize Profile Data
        loadProfileData();
    }


    /* ==========================================================================
       3. Global Logout Handler (Clears auth status and redirects)
       ========================================================================== */
    const logoutLinks = document.querySelectorAll(".logout-link, .logout");

    logoutLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // 1. Clear session flag from localStorage
            localStorage.removeItem("isLoggedIn");

            // 2. Redirect to the link's target page (or login.html by default)
            const redirectUrl = link.getAttribute("href") || "login.html";
            window.location.href = redirectUrl;
        });
    });

});