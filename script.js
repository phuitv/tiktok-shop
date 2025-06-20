document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    let allProducts = [];   // Biến để lưu trữ toàn bộ sản phẩm

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

    // lấy dữ liệu sản phẩm từ file JSON
    fetch('products.json')
        .then(Response => Response.json())  // Chuyển đổi phản hồi thành JSON
        .then(products => {
            
        })
        .catch(Error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });

    // Lắng nghe sự kiện người dùng gõ vào ô tìm kiếm
    searchInput.addEventListener('input', (Event) => {
        // lấy từ khoá người dùng gõ vào, chuyển thành chữ thường để tìm kiếm không phân biệt hoa/thường
        const searchTerm = Event.target.value.toLowerCase();

        // lọc ra các sản phẩm có tên chứa từ khoá tìm kiếm
        const filteredProducts = allProducts.filter(product => {
            return product.name.toLowerCase().includes(searchTerm);
        });

        // hiển thị các sản phẩm đã được lọc
        displayProducts(filteredProducts);
    });
});
