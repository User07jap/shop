// Admin Dashboard JavaScript
let currentRejectionProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is admin
    checkAdminAuth();
    // Ensure rejection modal is hidden on load
    const modal = document.getElementById('rejection-modal');
    if (modal) modal.classList.add('hidden');
    
    // Setup navigation
    setupNavigation();
    
    // Load initial data
    loadStats();
    loadPendingProducts();
});

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    // Verify admin role
    fetch('/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.user || data.user.role !== 'admin') {
            localStorage.removeItem('token');
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        window.location.href = '/';
    });
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Always hide the rejection modal when switching tabs
            const modal = document.getElementById('rejection-modal');
            if (modal) modal.classList.add('hidden');
            const tab = button.dataset.tab;
            
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Show selected tab
            const selectedTab = document.getElementById(`${tab}-tab`);
            if (selectedTab) {
                selectedTab.classList.remove('hidden');
                
                // Load data for the selected tab
                switch(tab) {
                    case 'pending':
                        loadPendingProducts();
                        break;
                    case 'approved':
                        loadApprovedProducts();
                        break;
                    case 'rejected':
                        loadRejectedProducts();
                        break;
                    case 'stats':
                        loadStats();
                        break;
                }
            }
        });
    });
}

async function loadStats() {
    try {
        const [pendingRes, approvedRes, rejectedRes, allRes] = await Promise.all([
            fetch('/api/admin/products?status=pending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/api/admin/products?status=approved', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/api/admin/products?status=rejected', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/api/admin/products', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);
        
        const pending = await pendingRes.json();
        const approved = await approvedRes.json();
        const rejected = await rejectedRes.json();
        const all = await allRes.json();
        
        document.getElementById('total-pending').textContent = pending.total || 0;
        document.getElementById('total-approved').textContent = approved.total || 0;
        document.getElementById('total-rejected').textContent = rejected.total || 0;
        document.getElementById('total-products').textContent = all.total || 0;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadPendingProducts() {
    try {
        const response = await fetch('/api/admin/products/pending', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        displayProducts(data.items, 'pending-products');
    } catch (error) {
        console.error('Failed to load pending products:', error);
    }
}

async function loadApprovedProducts() {
    try {
        const response = await fetch('/api/admin/products?status=approved', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        displayProducts(data.items, 'approved-products');
    } catch (error) {
        console.error('Failed to load approved products:', error);
    }
}

async function loadRejectedProducts() {
    try {
        const response = await fetch('/api/admin/products?status=rejected', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        displayProducts(data.items, 'rejected-products');
    } catch (error) {
        console.error('Failed to load rejected products:', error);
    }
}

function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">No products found.</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-header">
                <h3 class="product-title">${product.title}</h3>
                <span class="product-status status-${product.status}">${product.status}</span>
            </div>
            
            <div class="product-details">
                <div>
                    <p><strong>Price:</strong> $${product.price}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Style:</strong> ${product.style}</p>
                </div>
                <div>
                    <p><strong>Colors:</strong> ${product.colors.join(', ')}</p>
                    <p><strong>Sizes:</strong> ${product.sizes.join(', ')}</p>
                    <p><strong>Created:</strong> ${new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            
            <p><strong>Description:</strong> ${product.description}</p>
            
            ${product.status === 'pending' ? `
                <div class="product-actions">
                    <button class="btn-approve" onclick="approveProduct('${product.id}')">
                        Approve Product
                    </button>
                    <button class="btn-reject" onclick="showRejectionModal('${product.id}')">
                        Reject Product
                    </button>
                </div>
            ` : ''}
            
            ${product.status === 'rejected' && product.rejectionReason ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #f8d7da; border-radius: 6px;">
                    <strong>Rejection Reason:</strong> ${product.rejectionReason}
                </div>
            ` : ''}
            
            ${product.approvedAt ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #d4edda; border-radius: 6px;">
                    <strong>Approved:</strong> ${new Date(product.approvedAt).toLocaleDateString()}
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function approveProduct(productId) {
    if (!confirm('Are you sure you want to approve this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/products/${productId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            alert('Product approved successfully!');
            loadPendingProducts();
            loadStats();
        } else {
            const error = await response.json();
            alert('Failed to approve product: ' + error.message);
        }
    } catch (error) {
        console.error('Failed to approve product:', error);
        alert('Failed to approve product. Please try again.');
    }
}

function showRejectionModal(productId) {
    currentRejectionProductId = productId;
    document.getElementById('rejection-modal').classList.remove('hidden');
    document.getElementById('rejection-reason').focus();
}

function closeRejectionModal() {
    document.getElementById('rejection-modal').classList.add('hidden');
    document.getElementById('rejection-reason').value = '';
    currentRejectionProductId = null;
}

async function confirmRejection() {
    const reason = document.getElementById('rejection-reason').value.trim();
    
    if (!reason) {
        alert('Please provide a reason for rejection.');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/products/${currentRejectionProductId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            alert('Product rejected successfully!');
            closeRejectionModal();
            loadPendingProducts();
            loadStats();
        } else {
            const error = await response.json();
            alert('Failed to reject product: ' + error.message);
        }
    } catch (error) {
        console.error('Failed to reject product:', error);
        alert('Failed to reject product. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Close modal when clicking outside
document.getElementById('rejection-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeRejectionModal();
    }
});
