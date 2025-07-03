document.addEventListener('DOMContentLoaded', () => {
    const detailContainer = document.getElementById('detail-container');

    // 1. Lấy ID sản phẩm từ URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        detailContainer.innerHTML = '<p class="error">Không tìm thấy ID sản phẩm. Vui lòng quay lại.</p>';
        return;
    }

    // 2. Tải toàn bộ dữ liệu sản phẩm
    fetch('./products.json')
        .then(response => response.json())
        .then(allProducts => {
            // 3. Tìm sản phẩm có ID tương ứng
            // Dùng '==' vì ID từ URL là chuỗi, ID trong JSON là số
            const product = allProducts.find(p => p.id == productId);

            // 4. Hiển thị thông tin hoặc báo lỗi
            if (product) {
                displayProductDetails(product);
            } else {
                detailContainer.innerHTML = `<p class="error">Không tìm thấy sản phẩm với ID: ${productId}</p>`;
                document.title = 'Không tìm thấy sản phẩm';
            }
        })
        .catch(error => {
            console.error('Lỗi tải dữ liệu:', error);
            detailContainer.innerHTML = '<p class="error">Lỗi khi tải dữ liệu sản phẩm.</p>';
        });
});

// Hàm để hiển thị chi tiết sản phẩm
function displayProductDetails(product) {
    const detailContainer = document.getElementById('detail-container');

    // Cập nhật tiêu đề trang
    document.title = product.name;

    // Tạo cấu trúc HTML cho trang chi tiết
    detailContainer.innerHTML = `
        <div class="product-detail-image">
            <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
            <h1 class="product-detail-name">${product.name}</h1>
            <p class="product-detail-price">${product.price}</p>
            <p class="product-detail-description">${product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
            <a href="${product.tiktokLink}" target="_blank" rel="noopener noreferrer" class="product-link buy-button">
                Mua ngay trên TikTok
            </a>
            <a href="javascript:history.back()" class="back-link">← Quay lại</a>
        </div>
    `;
}