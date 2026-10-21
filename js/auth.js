// ==========================================
// TechCare Pro - Authentication & Helpers
// ==========================================

/**
 * Handle Login with Email and Password
 * Automatically routes admin/staff to admin/dashboard.html and customer to user/dashboard.html
 */
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Fetch user document from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            // If user doc doesn't exist, check if default admin or fallback
            if (email.toLowerCase().includes('admin')) {
                // Auto create admin doc if it's the master account
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    fullName: 'Quản trị viên Hệ thống',
                    role: 'admin',
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.href = 'admin/dashboard.html';
                return;
            } else {
                // Default to customer
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    fullName: user.displayName || user.email.split('@')[0],
                    role: 'khachhang',
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.href = 'user/dashboard.html';
                return;
            }
        }

        const userData = userDoc.data();

        // Check if account is locked
        if (userData.status === 'locked' || userData.status === 'inactive') {
            await auth.signOut();
            throw new Error('Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động. Vui lòng liên hệ Admin!');
        }

        const role = userData.role || 'khachhang';

        // Role-based routing
        const adminRoles = ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'];
        if (adminRoles.includes(role)) {
            window.location.href = 'admin/dashboard.html';
        } else {
            window.location.href = 'user/dashboard.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        let msg = error.message;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            msg = 'Email hoặc mật khẩu không chính xác!';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Định dạng email không hợp lệ!';
        } else if (error.code === 'auth/too-many-requests') {
            msg = 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút!';
        }
        throw new Error(msg);
    }
}

/**
 * Handle Registration (Customers ONLY - role is always 'khachhang')
 * Customers CANNOT register as admin or staff
 */
async function registerCustomer(fullName, email, phone, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update profile displayName
        await user.updateProfile({
            displayName: fullName
        });

        // Send Email Verification (US.07)
        try {
            await user.sendEmailVerification();
        } catch (evErr) {
            console.warn('Email verification send notice:', evErr);
        }

        // Save into Firestore 'users' collection with role 'khachhang'
        await db.collection('users').doc(user.uid).set({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            role: 'khachhang', // KHÁCH HÀNG LUÔN LÀ KHACHHANG, KHÔNG THỂ LÀM ADMIN
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create welcome notification
        await db.collection('notifications').add({
            userId: user.uid,
            title: 'Chào mừng bạn đến với TechCare Pro! 🎉',
            message: 'Tài khoản khách hàng của bạn đã được đăng ký thành công. Hãy khám phá và sử dụng dịch vụ bảo hành PC & Laptop của chúng tôi.',
            type: 'system',
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return user;
    } catch (error) {
        console.error('Registration error:', error);
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') {
            msg = 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác!';
        } else if (error.code === 'auth/weak-password') {
            msg = 'Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Định dạng email không hợp lệ!';
        }
        throw new Error(msg);
    }
}

/**
 * Initialize default Master Admin account for first-time setup
 */
async function initDefaultAdminAccount(adminEmail = 'admin@techcare.vn', adminPassword = 'admin123') {
    try {
        let userCredential;
        try {
            userCredential = await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
        } catch (authErr) {
            if (authErr.code === 'auth/email-already-in-use') {
                userCredential = await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
            } else {
                throw authErr;
            }
        }

        const user = userCredential.user;

        // Set master admin role in Firestore
        await db.collection('users').doc(user.uid).set({
            fullName: 'Quản trị viên Hệ thống (Master Admin)',
            email: adminEmail,
            phone: '0901234567',
            role: 'admin',
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return user;
    } catch (err) {
        console.error('Init Admin error:', err);
        throw err;
    }
}

/**
 * Send password reset email (US.06)
 */
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email.trim());
    } catch (error) {
        console.error('Reset password error:', error);
        let msg = error.message;
        if (error.code === 'auth/user-not-found') {
            msg = 'Không tìm thấy tài khoản với email này!';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Định dạng email không hợp lệ!';
        }
        throw new Error(msg);
    }
}

/**
 * Check Authentication for Customer Pages
 */
function checkCustomerAuth(redirectUrl = '../index.html') {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = redirectUrl;
                return;
            }
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    window.location.href = redirectUrl;
                    return;
                }
                const userData = userDoc.data();
                if (userData.status === 'locked' || userData.status === 'inactive') {
                    alert('Tài khoản của bạn đã bị khóa!');
                    await auth.signOut();
                    window.location.href = redirectUrl;
                    return;
                }
                // If user is admin/staff trying to access user page, redirect to admin
                const adminRoles = ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'];
                if (adminRoles.includes(userData.role)) {
                    window.location.href = '../admin/dashboard.html';
                    return;
                }
                resolve({ user, userData });
            } catch (err) {
                console.error('Customer auth check error:', err);
                window.location.href = redirectUrl;
            }
        });
    });
}

/**
 * Check Authentication for Admin/Staff Pages
 */
function checkAdminAuth(redirectUrl = '../index.html') {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = redirectUrl;
                return;
            }
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    window.location.href = redirectUrl;
                    return;
                }
                const userData = userDoc.data();
                if (userData.status === 'locked' || userData.status === 'inactive') {
                    alert('Tài khoản của bạn đã bị khóa!');
                    await auth.signOut();
                    window.location.href = redirectUrl;
                    return;
                }

                const adminRoles = ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'];
                if (!adminRoles.includes(userData.role)) {
                    // It's a regular customer trying to access admin
                    alert('Bạn không có quyền truy cập trang quản trị!');
                    window.location.href = '../user/dashboard.html';
                    return;
                }

                resolve({ user, userData });
            } catch (err) {
                console.error('Admin auth check error:', err);
                window.location.href = redirectUrl;
            }
        });
    });
}

/**
 * Sign out helper
 */
async function handleSignOut(redirectUrl = '../index.html') {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        try {
            await auth.signOut();
            window.location.href = redirectUrl;
        } catch (err) {
            console.error('Sign out error:', err);
        }
    }
}

/**
 * Toast notification
 */
function showToast(message, type = 'success', duration = 3500) {
    const existing = document.querySelectorAll('.toast-notification');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Format currency VND
 */
function formatVND(amount) {
    if (amount === undefined || amount === null) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
}

/**
 * Format date
 */
function formatDate(timestamp) {
    if (!timestamp) return '---';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Format datetime
 */
function formatDateTime(timestamp) {
    if (!timestamp) return '---';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Status mapping helper
 */
function getStatusBadge(status) {
    const statusMap = {
        'cho_xu_ly': { label: 'Chờ tiếp nhận', class: 'badge-warning' },
        'dang_kiem_tra': { label: 'Đang kiểm tra', class: 'badge-info' },
        'cho_bao_gia': { label: 'Chờ duyệt giá', class: 'badge-warning' },
        'dang_sua': { label: 'Đang sửa chữa', class: 'badge-primary' },
        'cho_linh_kien': { label: 'Chờ linh kiện', class: 'badge-danger' },
        'hoan_thanh': { label: 'Đã sửa xong', class: 'badge-success' },
        'da_ban_giao': { label: 'Đã bàn giao máy', class: 'badge-success' },
        'da_huy': { label: 'Đã hủy', class: 'badge-secondary' }
    };
    const info = statusMap[status] || { label: status || 'Không xác định', class: 'badge-secondary' };
    return `<span class="badge ${info.class}">${info.label}</span>`;
}

/**
 * Role mapping helper
 */
function getRoleBadge(role) {
    const roleMap = {
        'admin': { label: 'Quản trị viên (Admin)', class: 'badge-danger' },
        'nhanvien_tiepnhan': { label: 'NV Tiếp nhận / CSKH', class: 'badge-primary' },
        'ktv': { label: 'Kỹ thuật viên (KTV)', class: 'badge-info' },
        'thungan': { label: 'Thu ngân', class: 'badge-warning' },
        'quanlykho': { label: 'Quản lý kho', class: 'badge-purple' },
        'khachhang': { label: 'Khách hàng', class: 'badge-success' }
    };
    const info = roleMap[role] || { label: role, class: 'badge-secondary' };
    return `<span class="badge ${info.class}">${info.label}</span>`;
}
