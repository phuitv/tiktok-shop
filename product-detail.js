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

function setupSlider() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function showSlide(index) {
        // Ẩn slide hiện tại
        slides[currentSlide].classList.remove('active');
        // Cập nhật chỉ số slide mới
        currentSlide = index;
        // Hiện slide mới
        slides[currentSlide].classList.add('active');
    }

    prevBtn.addEventListener('click', () => {
        let newIndex = currentSlide - 1;
        if (newIndex < 0) {
            newIndex = slides.length - 1; // Quay về ảnh cuối
        }
        showSlide(newIndex);
    });

    nextBtn.addEventListener('click', () => {
        let newIndex = currentSlide + 1;
        if (newIndex >= slides.length) {
            newIndex = 0; // Quay về ảnh đầu
        }
        showSlide(newIndex);
    });
}

// Hàm để hiển thị chi tiết sản phẩm
function displayProductDetails(product) {
    const detailContainer = document.getElementById('detail-container');
    document.title = product.name;

    // Tạo HTML cho các ảnh trong slider
    const imagesHtml = product.imageUrls.map((url, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}">
            <img src="${url}" alt="${product.name} - ảnh ${index + 1}">
        </div>
    `).join('');

    // Cập nhật cấu trúc HTML cho trang chi tiết
    detailContainer.innerHTML = `
        <div class="product-detail-image">
            <div class="slider-container">
                <div class="slider">
                    ${imagesHtml}
                </div>
                <!-- Chỉ hiển thị nút nếu có nhiều hơn 1 ảnh -->
                ${product.imageUrls.length > 1 ? `
                    <button class="slider-btn prev" id="prev-btn">‹</button>
                    <button class="slider-btn next" id="next-btn">›</button>
                ` : ''}
            </div>
        </div>
        <div class="product-detail-info">
            <h1 class="product-detail-name">${product.name}</h1>
            <p class="product-detail-price">${product.price}</p>
            <p class="product-detail-description">${product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
            <a href="${product.tiktokLink}" target="_blank" rel="noopener noreferrer" class="product-link buy-button">
                Mua ngay
            </a>
            <a href="javascript:history.back()" class="back-link">← Quay lại</a>
        </div>
    `;

    // Sau khi HTML được tạo, thêm logic cho slider
    if (product.imageUrls.length > 1) {
        setupSlider();
    }
}