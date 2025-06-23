document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const categoryMenu = document.getElementById('category-menu');
    let allProducts = [];   // Biến để lưu trữ toàn bộ sản phẩm
    let currentCategory = 'Tất Cả'; // <-- Biến lưu trữ danh mục đang được chọn

    // hàm hiển thị sản phẩm lên màn hình
    const displayProducts = (productsToDisplay) => {
        // 1. Xoá sạch các sản phẩm đang hiển thị
        productGrid.innerHTML = '';

        // 2. Kiểm tra nếu ko có sản phẩm để hiển thị
        if (productsToDisplay.length === 0) {
            productGrid.innerHTML = '<p class="no-results">Không tìm thấy sản phẩm nào phù hợp.</p>';
            return;
        }

        // 3. Lặp qua và hiển thị các sản phẩm đc cung cấp
        productsToDisplay.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');

            card.innerHTML = `
                <img src ="${product.imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${product.price}</p>
                    <a href="${product.tiktokLink}" target="_blank" rel="noopener noreferrer" class="product-link">Xem trên Tiktok</a>
                </div>
            `;
            productGrid.appendChild(card);
        });
    };

    // === HÀM LỌC TỔNG HỢP ===
    // Hàm này sẽ lọc sản phẩm dựa trên cả danh mục và từ khóa tìm kiếm
    const filterAndDisplayProducts = () => {
        // Lọc theo danh mục
        let filterByCategory = allProducts;
        if (currentCategory !== 'Tất Cả') {
            filterByCategory = allProducts.filter(product => product.category === currentCategory);
        }

        // Lọc tiếp theo từ khóa tìm kiếm (từ kết quả đã lọc theo danh mục)
        const searchTerm = searchInput.value.toLowerCase();
        const finalFilteredProducts = filterByCategory.filter(product => {
            return product.name.toLowerCase().includes(searchTerm);
        });

        // Hiển thị kết quả cuối cùng
        displayProducts(finalFilteredProducts);
    };

    // lấy dữ liệu sản phẩm từ file JSON
    fetch('./products.json')
        .then(Response => Response.json())  // Chuyển đổi phản hồi thành JSON
        .then(products => {
            allProducts = products; // Lưu danh sách sản phẩm gốc
            filterAndDisplayProducts(); // Hiển thị sản phẩm ban đầu
        })
        .catch(Error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });

    // Lắng nghe sự kiện người dùng gõ vào ô tìm kiếm
    searchInput.addEventListener('input', () => {
        // lấy từ khoá người dùng gõ vào, chuyển thành chữ thường để tìm kiếm không phân biệt hoa/thường
        // const searchTerm = Event.target.value.toLowerCase();

        // lọc ra các sản phẩm có tên chứa từ khoá tìm kiếm
        //const filteredProducts = allProducts.filter(product => {
        //    return product.name.toLowerCase().includes(searchTerm);
        //});

        // hiển thị các sản phẩm đã được lọc
        //displayProducts(filteredProducts);

        filterAndDisplayProducts(); // Gọi hàm lọc tổng hợp mỗi khi gõ
    });

    // === LẮNG NGHE SỰ KIỆN CLICK MENU ===
    categoryMenu.addEventListener('click', (Event) => {
        // Chỉ xử lý khi người dùng click vào một nút (có class 'category-btn')
        if (Event.target.classList.contains('category-btn')) {
            // 1. Lấy tên danh mục từ thuộc tính data-category
            const selectedCategory = Event.target.dataset.category;

            // 2. Cập nhật biến trạng thái
            currentCategory = selectedCategory;

            // 3. Cập nhật giao diện cho nút (xóa 'active' ở nút cũ, thêm vào nút mới)
            document.querySelector('.category-btn.active').classList.remove('active');
            Event.target.classList.add('active');

            // 4. Lọc và hiển thị lại sản phẩm
            filterAndDisplayProducts();
        }
    });
});