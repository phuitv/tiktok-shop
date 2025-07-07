document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC PHẦN TỬ TRANG ===
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const paginationControls = document.getElementById('pagination-controls');
    const categoryDropdownBtn = document.getElementById('category-dropdown-btn');
    const categoryDropdownContent = document.getElementById('category-dropdown-content');

    // === BIẾN TRẠNG THÁI ===
    let allProducts = [];
    let currentPage = 1;
    const productsPerPage = 12; // Bạn có thể thay đổi số này

    // === HÀM RENDER CHÍNH ===
    // Chịu trách nhiệm lọc và hiển thị lại toàn bộ trang
    const render = () => {
        let filteredProducts = allProducts;
        const activeItem = categoryDropdownContent.querySelector('.dropdown-item.active');
        
        // Luôn có một activeItem như đã thiết lập trong HTML
        const currentCategory = activeItem.dataset.category;

        // 1. Lọc theo danh mục
        if (currentCategory !== 'Tất Cả') {
            filteredProducts = allProducts.filter(product => product.category === currentCategory);
        }

        // 2. Lọc tiếp theo từ khóa tìm kiếm
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(searchTerm));
        }

        // 3. Tính toán phân trang
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        // Đảm bảo currentPage không lớn hơn tổng số trang (quan trọng khi kết quả lọc ít đi)
        if (currentPage > totalPages) {
            currentPage = 1;
        }
        const startIndex = (currentPage - 1) * productsPerPage;
        const productsForCurrentPage = filteredProducts.slice(startIndex, startIndex + productsPerPage);

        // 4. Hiển thị sản phẩm và phân trang
        displayProductCards(productsForCurrentPage);
        setupPagination(totalPages, filteredProducts.length > 0);
    };

    // === HÀM HIỂN THỊ CARD SẢN PHẨM ===
    const displayProductCards = (products) => {
        productGrid.innerHTML = '';
        if (products.length === 0) {
            productGrid.innerHTML = '<p class="no-results">Không tìm thấy sản phẩm nào phù hợp.</p>';
            return;
        }
        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price}</p>
                    <a href="${product.tiktokLink}" target="_blank" rel="noopener noreferrer" class="product-link">Xem trên Tiktok</a>
                </div>
            `;
            productGrid.appendChild(card);
        });
    };
    
    // === HÀM PHÂN TRANG ===
    const setupPagination = (totalPages, hasProducts) => {
        paginationControls.innerHTML = '';
        if (!hasProducts || totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.classList.add('page-btn');
            pageBtn.textContent = i;
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                render();
                window.scrollTo(0, 0);
            });
            paginationControls.appendChild(pageBtn);
        }
    };

    // === LOGIC ĐỂ ĐIỀU KHIỂN DROPDOWN ===
    document.addEventListener('click', event => {
        // Kiểm tra xem có phải click vào nút dropdown hay không
        const isDropdownButton = event.target.closest('.dropdown-btn');
        // Tìm menu content gần nhất với nút được click (nếu có)
        const dropdownContent = isDropdownButton ? isDropdownButton.nextElementSibling : null;

        // 1. Mở/đóng menu khi click vào nút chính
        if (isDropdownButton) {
            // Toggle menu tương ứng với nút vừa click
            dropdownContent.classList.toggle('show');
        }
        
        // 2. Đóng TẤT CẢ các menu khác đang mở (nếu có nhiều menu)
        document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
            if (openDropdown !== dropdownContent) {
                openDropdown.classList.remove('show');
            }
        });

        // 3. Xử lý khi click vào một mục trong menu
        const targetItem = event.target.closest('.dropdown-item');
        if (targetItem && targetItem.closest('.dropdown-content.show')) {
            // Nếu là link lọc
            if (targetItem.getAttribute('href') === '#') {
                event.preventDefault();

                // Cập nhật giao diện
                const currentDropdown = targetItem.closest('.dropdown-content');
                currentDropdown.querySelector('.dropdown-item.active')?.classList.remove('active');
                targetItem.classList.add('active');
                
                const btn = currentDropdown.previousElementSibling;
                if (btn) {
                    btn.firstChild.textContent = targetItem.textContent.trim() + ' ';
                }
                
                // Render lại
                currentPage = 1; 
                render();
            }
            // Nếu là link thật, cứ để nó chuyển trang bình thường
        }
    });
    
    // === SỰ KIỆN TÌM KIẾM ===
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        render();
    });

    // === TẢI DỮ LIỆU BAN ĐẦU ===
    fetch('./products.json')
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            render();
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });
});