document.addEventListener('DOMContentLoaded', () => {
    // === Lấy các phần tử trên trang ===
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const categoryMenu = document.getElementById('category-menu');
    const paginationControls = document.getElementById('pagination-controls');

    // === Biến trạng thái ===
    let allProducts = []; // Lưu trữ toàn bộ sản phẩm từ JSON
    let currentPage = 1;  // Trang hiện tại, mặc định là 1
    const productsPerPage = 12; // Số sản phẩm trên mỗi trang

    // === HÀM CHÍNH: RENDER MỌI THỨ ===
    // Hàm này sẽ được gọi mỗi khi có thay đổi (tải trang, tìm kiếm, lọc, chuyển trang)
    const render = () => {
        // 1. Lọc sản phẩm theo danh mục và từ khóa
        let filteredProducts = allProducts;
        const currentCategory = document.querySelector('.category-btn.active').dataset.category;
        if (currentCategory !== 'Tất Cả') {
            filteredProducts = allProducts.filter(product => product.category === currentCategory);
        }
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(searchTerm));
        }

        // 2. Tính toán phân trang
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsForCurrentPage = filteredProducts.slice(startIndex, endIndex);

        // 3. Hiển thị sản phẩm của trang hiện tại
        displayProductCards(productsForCurrentPage);

        // 4. Hiển thị các nút điều khiển phân trang
        setupPagination(totalPages, filteredProducts.length > 0);
    };

    // === HÀM PHỤ: Chỉ để hiển thị card sản phẩm ===
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

    // === HÀM PHỤ: Tạo và quản lý các nút phân trang ===
    const setupPagination = (totalPages, hasProducts) => {
        paginationControls.innerHTML = '';
        if (!hasProducts || totalPages <= 1) return; // Không hiển thị nếu không có SP hoặc chỉ có 1 trang

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.classList.add('page-btn');
            pageBtn.textContent = i;
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                render(); // Gọi lại hàm render chính để cập nhật mọi thứ
                window.scrollTo(0, 0); // Tự động cuộn lên đầu trang
            });
            paginationControls.appendChild(pageBtn);
        }
    };

    // === LẮNG NGHE SỰ KIỆN ===
    // Tìm kiếm
    searchInput.addEventListener('input', () => {
        currentPage = 1; // Khi tìm kiếm, luôn quay về trang 1
        render();
    });

    // Lọc danh mục
    categoryMenu.addEventListener('click', (event) => {
        if (event.target.classList.contains('category-btn')) {
            document.querySelector('.category-btn.active').classList.remove('active');
            event.target.classList.add('active');
            currentPage = 1; // Khi lọc, luôn quay về trang 1
            render();
        }
    });

    // === TẢI DỮ LIỆU BAN ĐẦU ===
    fetch('./products.json')
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            render(); // Lần render đầu tiên sau khi có dữ liệu
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });
});