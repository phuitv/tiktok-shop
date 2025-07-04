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

    // === LOGIC MỚI CHO POP-UP ===
    function initializeModal() {
        const modal = document.getElementById('contact-modal');
        const openBtn = document.getElementById('open-contact-btn');
        const closeBtn = document.getElementById('close-modal-btn');

        // Nếu không tìm thấy các phần tử thì không làm gì cả
        if (!modal || !openBtn || !closeBtn) {
            console.error('Modal elements not found!');
            return;
        }

        // Hàm để mở pop-up
        const openModal = () => {
            modal.style.display = 'flex';
        };

        // Hàm để đóng pop-up
        const closeModal = () => {
            modal.style.display = 'none';
        };

        // Gán sự kiện cho các nút
        openBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);

        // Đóng pop-up khi nhấn vào lớp phủ nền
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Đóng pop-up khi nhấn phím Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
    }
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

    // --- LOGIC MỚI CHO PHẦN MÔ TẢ ---
    let descriptionHtml = '';
    // Kiểm tra xem 'description' có tồn tại và có phải là một mảng không
    if (product.description && Array.isArray(product.description)) {
        // Nếu là mảng, tạo ra một danh sách <ul>
        const listItems = product.description.map(item => `<li>${item}</li>`).join('');
        descriptionHtml = `<ul class="product-description-list">${listItems}</ul>`;
    } else if (product.description) {
        // Nếu là chuỗi (string), hiển thị như một đoạn văn <p>
        descriptionHtml = `<p class="product-detail-description">${product.description}</p>`;
    } else {
        // Nếu không có mô tả
        descriptionHtml = '<p class="product-detail-description">Chưa có mô tả cho sản phẩm này.</p>';
    }
    // --- KẾT THÚC LOGIC MỚI ---

    // Tạo HTML cho các ảnh trong slider (giữ nguyên)
    const imagesHtml = product.imageUrls.map((url, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}">
            <img src="${url}" alt="${product.name} - ảnh ${index + 1}">
        </div>
    `).join('');

    // Cập nhật cấu trúc HTML cho trang chi tiết, chèn descriptionHtml vào đúng vị trí
    detailContainer.innerHTML = `
        <div class="product-detail-image">
            <div class="slider-container">
                <div class="slider">
                    ${imagesHtml}
                </div>
                ${product.imageUrls.length > 1 ? `
                    <button class="slider-btn prev" id="prev-btn">‹</button>
                    <button class="slider-btn next" id="next-btn">›</button>
                ` : ''}
            </div>
        </div>
        <div class="product-detail-info">
            <h1 class="product-detail-name">${product.name}</h1>
            <p class="product-detail-price">${product.price}</p>
            
            <!-- Chèn biến descriptionHtml vào đây -->
            ${descriptionHtml}
            
            <button id="open-contact-btn" class="product-link buy-button">
                Liên hệ mua ngay
            </button>
            <a href="javascript:history.back()" class="back-link">← Quay lại</a>
        </div>
    `;

    // Khởi tạo slider và modal (giữ nguyên)
    if (product.imageUrls.length > 1) {
        setupSlider();
    }
    initializeModalLogic(); 
}

// TẠO HÀM KHỞI TẠO LOGIC RIÊNG
function initializeModalLogic() {
    const modal = document.getElementById('contact-modal');
    const openBtn = document.getElementById('open-contact-btn');
    const closeBtn = document.getElementById('close-modal-btn');

    if (!modal || !openBtn || !closeBtn) return;

    openBtn.addEventListener('click', () => modal.style.display = 'flex');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}