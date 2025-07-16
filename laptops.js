// Hàm chuyển đổi chuỗi có dấu thành không dấu
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

document.addEventListener('DOMContentLoaded', () => {
    // === Lấy các phần tử cần thiết ===
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const paginationControls = document.getElementById('pagination-controls');
    const platformFilterControls = document.querySelector('.platform-filter-controls');

    // === Biến trạng thái ===
    let allLaptopProducts = []; // Chỉ chứa sản phẩm laptop
    let currentPage = 1;
    const productsPerPage = 10;

    // === HÀM CHÍNH: RENDER TRANG LAPTOP ===
    const renderLaptops = () => {
        // Không cần lọc nữa vì chúng ta đã lọc sẵn ở bước fetch

        // 1. Tính toán phân trang
        const totalPages = Math.ceil(allLaptopProducts.length / productsPerPage);
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsForCurrentPage = allLaptopProducts.slice(startIndex, endIndex);

        // 2. Hiển thị sản phẩm
        displayProductCards(productsForCurrentPage);

        // 3. Hiển thị các nút phân trang
        setupPagination(totalPages);
    };

    // === HÀM PHỤ: Hiển thị card sản phẩm ===
    const displayProductCards = (products) => {
        productGrid.innerHTML = '';
        if (products.length === 0) {
            productGrid.innerHTML = '<p class="no-results">Chưa có sản phẩm laptop nào.</p>';
            return;
        }
        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            // Đảm bảo lấy ảnh từ mảng imageUrls
            card.innerHTML = `
                <div class="product-image-container">
                    <a href="product-detail.html?id=${product.id}">
                        <img src="${product.imageUrls ? product.imageUrls[0] : product.imageUrl}" 
                            alt="${product.name}" class="product-image">
                    </a>
                    <div class="product-name-overlay">
                        <h3 class="product-name">${product.name}</h3>
                    </div>
                </div>
                <div class="product-info">
                    <p class="product-price">${product.price}</p>
                    <a href="product-detail.html?id=${product.id}" class="product-link-fake">Xem chi tiết</a>
                </div>
            `;
            productGrid.appendChild(card);
        });
    };

    // === HÀM PHỤ: Tạo các nút phân trang ===
    const setupPagination = (totalPages) => {
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.classList.add('page-btn');
            pageBtn.textContent = i;
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderLaptops(); // Gọi hàm renderLaptops
                window.scrollTo(0, 0);
            });
            paginationControls.appendChild(pageBtn);
        }
    };

    // === TẢI DỮ LIỆU BAN ĐẦU ===
    fetch('./products.json')
        .then(response => response.json())
        .then(data => {
            allLaptopProducts = data
                .filter(product => product.category === 'Laptop')   // Lọc để chỉ lấy sản phẩm có category là "Laptop"
                .sort((a, b) => b.id - a.id);   // Sắp xếp mảng sản phẩm theo 'id' giảm dần (từ lớn đến bé)

            renderLaptops(); // Render lần đầu
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });
        
    // Sự kiện tìm kiếm
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // Khi tìm kiếm, chúng ta sẽ lọc từ danh sách laptop đã có
            const searchTerm = searchInput.value.toLowerCase();
            const filteredLaptops = allLaptopProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
            
            // Hiển thị hoặc ẩn nút X dựa trên việc ô input có nội dung hay không
            if (searchInput.value.length > 0) {
                clearSearchBtn.classList.add('visible');
            } else {
                clearSearchBtn.classList.remove('visible');
            }

            // Tái sử dụng hàm displayProductCards và setupPagination
            currentPage = 1;
            const totalPages = Math.ceil(filteredLaptops.length / productsPerPage);
            const productsForCurrentPage = filteredLaptops.slice(0, productsPerPage);

            displayProductCards(productsForCurrentPage);
            setupPagination(totalPages); // Cần điều chỉnh lại hàm này nếu muốn phân trang cho kết quả tìm kiếm
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