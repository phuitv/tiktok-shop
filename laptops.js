// laptops.js - Phiên bản đã được đơn giản hóa
document.addEventListener('DOMContentLoaded', () => {
    // === Lấy các phần tử cần thiết ===
    const productGrid = document.getElementById('product-grid');
    const paginationControls = document.getElementById('pagination-controls');

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

    // === HÀM PHỤ: Hiển thị card sản phẩm (giữ nguyên) ===
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
                <a href="product-detail.html?id=${product.id}" class="card-link-wrapper">
                    <img src="${product.imageUrls[0]}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${product.price}</p>
                        <span class="product-link-fake">Xem chi tiết</span>
                    </div>
                </a>
            `;
            productGrid.appendChild(card);
        });
    };

    // === HÀM PHỤ: Tạo các nút phân trang (giữ nguyên) ===
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
        
    // Chúng ta có thể giữ lại ô tìm kiếm nếu muốn
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // Khi tìm kiếm, chúng ta sẽ lọc từ danh sách laptop đã có
            const searchTerm = searchInput.value.toLowerCase();
            const filteredLaptops = allLaptopProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
            
            // Tái sử dụng hàm displayProductCards và setupPagination
            currentPage = 1;
            const totalPages = Math.ceil(filteredLaptops.length / productsPerPage);
            const productsForCurrentPage = filteredLaptops.slice(0, productsPerPage);

            displayProductCards(productsForCurrentPage);
            setupPagination(totalPages); // Cần điều chỉnh lại hàm này nếu muốn phân trang cho kết quả tìm kiếm
        });
    }
});