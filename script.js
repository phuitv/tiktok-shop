document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC PHẦN TỬ TRANG ===
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const paginationControls = document.getElementById('pagination-controls');
    const categoryDropdownBtn = document.getElementById('category-dropdown-btn');
    const categoryDropdownContent = document.getElementById('category-dropdown-content');
    const platformFilterControls = document.querySelector('.platform-filter-controls');

    // === BIẾN TRẠNG THÁI ===
    let allProducts = [];
    let currentPage = 1;
    const productsPerPage = 12; // Bạn có thể thay đổi số này
    let activePlatformFilter = null; // null có nghĩa là không có bộ lọc nào được áp dụng

    // === HÀM RENDER CHÍNH ===
    // Chịu trách nhiệm lọc và hiển thị lại toàn bộ trang
    const render = () => {
        console.log(`Rendering with filters: Platform='${activePlatformFilter}', Category='${document.querySelector('.dropdown-item.active')?.dataset.category}'`);
        let filteredProducts = allProducts;
        
        // Luôn có một activeItem như đã thiết lập trong HTML
//        const currentCategory = activeItem.dataset.category;

        // LỌC THEO NỀN TẢNG (NẾU CÓ)
        if (activePlatformFilter) {
            filteredProducts = filteredProducts.filter(product => product.platform === activePlatformFilter);
        }

        // Lọc theo danh mục
        const activeCategoryItem = categoryDropdownContent.querySelector('.dropdown-item.active');
        if (activeCategoryItem) {
            const currentCategory = activeCategoryItem.dataset.category;
            if (currentCategory && currentCategory !== 'Tất Cả') {
                filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
            }
        }

        // Lọc tiếp theo từ khóa tìm kiếm
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(searchTerm));
        }

        // Tính toán phân trang
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        // Đảm bảo currentPage không lớn hơn tổng số trang (quan trọng khi kết quả lọc ít đi)
        if (currentPage > totalPages) {
            currentPage = 1;
        }
        const startIndex = (currentPage - 1) * productsPerPage;
        const productsForCurrentPage = filteredProducts.slice(startIndex, startIndex + productsPerPage);

        // Hiển thị sản phẩm và phân trang
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

            // Xác định text và class cho nút dựa trên platform
            let platformText = 'Xem chi tiết';
            let platformClass = '';
            if (product.platform === 'tiktok') {
                platformText = 'Xem trên TikTok';
                platformClass = 'platform-tiktok';
            } else if (product.platform === 'shopee') {
                platformText = 'Xem trên Shopee';
                platformClass = 'platform-shopee';
            }
            
            card.innerHTML = `
                <a href="${product.affiliateLink}" target="_blank" class="card-link-wrapper">
                    <img src="${product.imageUrls ? product.imageUrls[0] : product.imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${product.price}</p>
                        <span class="product-link ${platformClass}">${platformText}</span>
                    </div>
                </a>
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
        const dropdownBtn = event.target.closest('.dropdown-btn');
        const dropdownItem = event.target.closest('.dropdown-item');

        // Trường hợp 1: Click vào một mục trong menu con
        if (dropdownItem) {
            const dropdownContent = dropdownItem.closest('.dropdown-content');
            
            // Nếu là link lọc (#)
            if (dropdownItem.getAttribute('href') === '#') {
                event.preventDefault();

                // Cập nhật giao diện active
                const currentActive = dropdownContent.querySelector('.dropdown-item.active');
                if (currentActive) currentActive.classList.remove('active');
                dropdownItem.classList.add('active');
                
                // Cập nhật text nút cha
                const mainBtn = dropdownContent.previousElementSibling;
                if (mainBtn) {
                    mainBtn.firstChild.textContent = mainBtn.firstChild.textContent.replace(/.*(?= )/, dropdownItem.textContent.trim());
                }

                // Render lại sản phẩm
                currentPage = 1;
                render();
            }
            // Nếu là link thật, trình duyệt sẽ tự chuyển trang

            // Luôn đóng menu sau khi click, nhưng với một chút trì hoãn
            setTimeout(() => {
                dropdownContent.classList.remove('show');
            }, 10);
            
            return; // Kết thúc, không làm gì thêm
        }

        // Trường hợp 2: Click vào nút chính để mở/đóng menu
        if (dropdownBtn) {
            const dropdownContentToShow = dropdownBtn.nextElementSibling;
            // Đóng tất cả các menu khác trước khi mở menu mới
            document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
                if (openDropdown !== dropdownContentToShow) {
                    openDropdown.classList.remove('show');
                }
            });
            // Sau đó toggle menu hiện tại
            dropdownContentToShow.classList.toggle('show');
            return; // Kết thúc, không làm gì thêm
        }
        
        // Trường hợp 3: Click ra ngoài
        // Nếu không click vào nút chính hoặc mục con, đóng tất cả các menu đang mở
        document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
            openDropdown.classList.remove('show');
        });
    });

    // === LẮNG NGHE SỰ KIỆN CHỌN NỀN TẢNG ===
    if (platformFilterControls) {
        platformFilterControls.addEventListener('click', (event) => {
            const clickedBtn = event.target.closest('.platform-filter-btn');
            if (!clickedBtn) return;

            const platform = clickedBtn.dataset.platform;

            if (clickedBtn.classList.contains('active')) {
                clickedBtn.classList.remove('active');
                activePlatformFilter = null;
            } else {
                platformFilterControls.querySelectorAll('.platform-filter-btn').forEach(btn => btn.classList.remove('active'));
                clickedBtn.classList.add('active');
                activePlatformFilter = platform;
            }
            currentPage = 1;
            render();
        });
    }

    // === SỰ KIỆN TÌM KIẾM ===
    if(searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            render();
        });
    }

    // === TẢI DỮ LIỆU BAN ĐẦU ===
    fetch('./products.json')
        .then(response => response.json())
        .then(data => {
            // Sắp xếp mảng sản phẩm theo 'id' giảm dần (từ lớn đến bé)
            const sortedProducts = data.sort((a, b) => b.id - a.id);
            
            allProducts = sortedProducts;
            render();
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });
});