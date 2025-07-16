// Hàm chuyển đổi chuỗi có dấu thành không dấu
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

document.addEventListener('DOMContentLoaded', () => {
    // === LẤY CÁC PHẦN TỬ TRANG ===
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const paginationControls = document.getElementById('pagination-controls');
    const categoryDropdownBtn = document.getElementById('category-dropdown-btn');
    const categoryDropdownContent = document.getElementById('category-dropdown-content');
    const platformFilterControls = document.querySelector('.platform-filter-controls');

    // === BIẾN TRẠNG THÁI ===
    let allProducts = [];
    let currentPage = 1;
    const productsPerPage = 12; // Số sp hiển thị trên 1 trang
    let activePlatformFilter = null; // null có nghĩa là không có bộ lọc nào được áp dụng

    // === HÀM RENDER CHÍNH ===
    // Chịu trách nhiệm lọc và hiển thị lại toàn bộ trang
    const render = () => {
        console.log(`Rendering with filters: Platform='${activePlatformFilter}', Category='${document.querySelector('.dropdown-item.active')?.dataset.category}'`);
        let filteredProducts = allProducts;
        
        // LỌC THEO NỀN TẢNG (NẾU CÓ)
        if (activePlatformFilter) {
            filteredProducts = filteredProducts.filter(product => product.platform === activePlatformFilter);
        }

        // Lọc theo danh mục
        const activeCategoryItem = categoryDropdownContent.querySelector('.dropdown-item.active');
        if (activeCategoryItem) {
            const currentCategory = activeCategoryItem.dataset.category;
            if (currentCategory && currentCategory !== 'Tất Cả') {
                // Lọc những sản phẩm mà mảng 'category' của nó CÓ CHỨA 'currentCategory'
                filteredProducts = filteredProducts.filter(product => 
                    product.category && product.category.includes(currentCategory)
                );
            }
        }

        // Lọc tiếp theo từ khóa tìm kiếm (hỗ trợ ko dấu)
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            // Chuyển từ khóa tìm kiếm sang không dấu
            const unaccentedSearchTerm = removeAccents(searchTerm);

            filteredProducts = filteredProducts.filter(product => {
                // Chuyển tên sản phẩm sang không dấu và chữ thường
                const unaccentedProductName = removeAccents(product.name.toLowerCase());
                
                // So sánh hai chuỗi đã được chuẩn hóa
                return unaccentedProductName.includes(unaccentedSearchTerm);
            });
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

            // --- LOGIC ĐỂ XỬ LÝ GIÁ ---
            let priceHtml = '';
            priceHtml = '<div class="price-line">';
            priceHtml += `<p class="product-price sale">${product.price}</p>`;
            if (product.originalPrice && product.originalPrice > 0) {
                const originalPriceFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice);
                priceHtml += `<span class="product-price original">${originalPriceFormatted}</span>`;
                priceHtml += '</div>';
            } else {
                priceHtml = `<p class="product-price">${product.price}</p>`;
            }

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
                <div class="product-image-container">
                    <a href="${product.affiliateLink}" target="_blank">
                        <img src="${product.imageUrls ? product.imageUrls[0] : product.imageUrl}" alt="${product.name}" class="product-image">
                    </a>
                    <div class="product-name-overlay">
                        <h3 class="product-name">${product.name}</h3>
                    </div>
                </div>
                <div class="product-info">
                    ${priceHtml}
                    <a href="${product.affiliateLink}" target="_blank" rel="noopener noreferrer" class="product-link ${platformClass}">
                        ${platformText}
                    </a>
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
            // Hiển thị hoặc ẩn nút X dựa trên việc ô input có nội dung hay không
            if (searchInput.value.length > 0) {
                clearSearchBtn.classList.add('visible');
            } else {
                clearSearchBtn.classList.remove('visible');
            }

            currentPage = 1;
            render();
        });
    }

    // Listener cho nút X
    clearSearchBtn.addEventListener('click', () => {
        // 1. Xóa nội dung trong ô tìm kiếm
        searchInput.value = '';

        // 2. Ẩn nút X đi
        clearSearchBtn.classList.remove('visible');

        // 3. Tự động "focus" lại vào ô tìm kiếm để người dùng có thể gõ ngay
        searchInput.focus();
        
        // 4. Render lại trang để hiển thị tất cả sản phẩm
        currentPage = 1;
        render();
    });

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

    // === LOGIC CHO NÚT LÊN ĐẦU TRANG ===
    const backToTopBtn = document.getElementById('back-to-top-btn');

    if (backToTopBtn) {
        // Hàm để ẩn/hiện nút
        const scrollFunction = () => {
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        };

        // === HÀM SCROLL MƯỢT MÀ TÙY CHỈNH ===
        const smoothScrollToTop = () => {
            const startY = window.pageYOffset; // Vị trí bắt đầu cuộn
            const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();
            const duration = 800; // Thời gian cuộn (800ms = 0.8 giây)

            const scroll = () => {
                const currentTime = 'now' in window.performance ? performance.now() : new Date().getTime();
                const time = Math.min(1, ((currentTime - startTime) / duration));

                // Hàm easing để tạo hiệu ứng chậm dần ở cuối
                const easeInOutCubic = t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

                window.scrollTo(0, startY * (1 - easeInOutCubic(time)));

                if (time < 1) {
                    requestAnimationFrame(scroll); // Tiếp tục gọi hàm scroll cho đến khi hoàn tất
                }
            };
            
            requestAnimationFrame(scroll); // Bắt đầu vòng lặp hoạt ảnh
        };
        // === KẾT THÚC HÀM SCROLL ===


        // Gán sự kiện
        window.onscroll = () => scrollFunction(); 
        // Nút sẽ gọi hàm tùy chỉnh
        backToTopBtn.addEventListener('click', smoothScrollToTop); 
    }
    // === KẾT THÚC LOGIC ===
});