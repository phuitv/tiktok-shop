// Hàm chuyển đổi chuỗi có dấu thành không dấu
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Hàm Chuyển chuỗi tiền tệ thành số
function parsePrice(priceString) {
    if (typeof priceString === 'number') {
        return priceString; // Nếu đã là số thì trả về luôn
    }
    if (typeof priceString !== 'string') {
        return 0; // Trả về 0 nếu không phải chuỗi
    }
    // Loại bỏ tất cả các ký tự không phải là số
    const numberString = priceString.replace(/[^\d]/g, '');
    return parseInt(numberString, 10) || 0;
}

// Hàm bắt đầu đồng hồ đếm ngược
function startCountdown(endTime, timerElement) {
    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            timerElement.innerHTML = "Đã kết thúc!";
            // Tùy chọn: Ẩn toàn bộ khu vực flash sale
            document.getElementById('flash-sale-section').style.display = 'none';
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Thêm số 0 đằng trước nếu nhỏ hơn 10
        const format = (num) => num.toString().padStart(2, '0');

        timerElement.innerHTML = `Kết thúc trong: <span>${format(hours)}:${format(minutes)}:${format(seconds)}</span>`;
    }, 1000);
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
    const flashSaleSection = document.getElementById('flash-sale-section');
    const flashSaleContainer = document.getElementById('flash-sale-container');
    const countdownTimer = document.getElementById('countdown-timer');

    // === BIẾN TRẠNG THÁI ===
    let allProducts = [];   //  Chứa sp thường (ko có flash sale)
    let searchableProducts = [];    // Chứa tất cả sp
    let currentPage = 1;
    const productsPerPage = 12; // Số sp hiển thị trên 1 trang
    let activePlatformFilter = null; // null có nghĩa là không có bộ lọc nào được áp dụng

    // === HÀM HIỂN THỊ SẢN PHẨM FLASH SALE ===
    const displayFlashSaleProducts = (products) => {
        // Ẩn section nếu không có sản phẩm flash sale
        if (products.length === 0) { 
            if(flashSaleSection) flashSaleSection.style.display = 'none';
            return;
        }

        // Cấu trúc HTML cho slider
        if (flashSaleContainer) {
            flashSaleContainer.innerHTML = `
                <div class="swiper my-flash-sale-swiper">
                    <div class="swiper-wrapper">
                        <!-- Slides sẽ được chèn vào đây -->
                    </div>
                </div>
                <div class="flash-sale-nav">
                    <div class="swiper-button-prev flash-sale-nav-btn"></div>
                    <div class="swiper-button-next flash-sale-nav-btn"></div>
                </div>
            `;
        }

        const swiperWrapper = flashSaleContainer.querySelector('.swiper-wrapper');
        if (!swiperWrapper) return; // Dừng lại nếu không tìm thấy wrapper
        let latestEndTime = 0;
        const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

        // CHÈN CARD SẢN PHẨM (SLIDES)
        products.forEach(product => {
            // Tìm thời gian kết thúc xa nhất để đặt cho đồng hồ
            const productEndTime = new Date(product.flashSaleEndTime).getTime();
            if (productEndTime > latestEndTime) {
                latestEndTime = productEndTime;
            }

            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');
            
            // Dùng logic hiển thị giá
            const salePriceNumber = parsePrice(product.price); // Chuyển giá bán (string) thành số
            const salePriceFormatted = currencyFormatter.format(salePriceNumber); // Định dạng lại cho đẹp
            
            let originalPriceFormatted = '';
            // So sánh hai con số
            if (product.originalPrice && product.originalPrice > salePriceNumber) {
                originalPriceFormatted = currencyFormatter.format(product.originalPrice);
            }

            // Xác định URL ảnh
            const imageUrl = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : (product.imageUrl || '');

            slide.innerHTML = `
                <a href="${product.affiliateLink}" target="_blank" class="flash-sale-card">
                    <div class="flash-sale-image-container">
                        <img src="${imageUrl}" alt="${product.name}" class="product-image">
                        <div class="flash-sale-price-overlay">
                            <div class="price-line">
                                <span class="product-price sale">${salePriceFormatted}</span>
                                ${originalPriceFormatted ? `<span class="product-price original">${originalPriceFormatted}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </a>
            `;
            swiperWrapper.appendChild(slide);
        });

        // KHỞI TẠO SWIPER
        if (typeof Swiper !== 'undefined') {    // Kiểm tra thư viện Swiper đã tồn tại trên window chưa
            new Swiper('.my-flash-sale-swiper', {
                effect: 'coverflow', // Bật hiệu ứng coverflow
                grabCursor: true,
                centeredSlides: true, // QUAN TRỌNG: Đặt slide active ở giữa
                slidesPerView: 'auto',
                loop: true, // Cho phép slider lặp lại vô tận
                
                // Cấu hình cho hiệu ứng coverflow
                coverflowEffect: {
                    rotate: 0, // Không xoay các slide
                    stretch: 0, // Không kéo dài các slide
                    depth: 100, // Độ sâu 3D (tạo cảm giác xa gần)
                    modifier: 1.5, // Tăng hiệu ứng
                    slideShadows: false, // Tắt bóng của slide
                },
                
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false, // Để nó tự chạy lại sau khi người dùng tương tác
                    pauseOnMouseEnter: true,
                },
                navigation: {
                    nextEl: '.flash-sale-nav .swiper-button-next',
                    prevEl: '.flash-sale-nav .swiper-button-prev',
                },
            });
        } else {
            console.error('Swiper library is not loaded!');
        }

        // Bắt đầu đồng hồ đếm ngược với thời gian xa nhất
        if (latestEndTime > 0) {
            const countdownTimer = document.getElementById('countdown-timer');
            startCountdown(latestEndTime, countdownTimer);
        }
    };

    // === HÀM HIỂN THỊ CARD SẢN PHẨM THƯỜNG ===
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
            const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
        
            const salePriceNumber = parsePrice(product.price);
            const salePriceFormatted = currencyFormatter.format(salePriceNumber);
            
            const hasDiscount = product.originalPrice && product.originalPrice > salePriceNumber;

            priceHtml = `
                <div class="price-container">
                    <div class="price-line">
                        <span class="product-price sale">${salePriceFormatted}</span>
                        ${hasDiscount ? `<span class="product-price original">${currencyFormatter.format(product.originalPrice)}</span>` : ''}
                    </div>
                </div>
            `;

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
            
            // Xác định URL ảnh
            const imageUrl = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : (product.imageUrl || '');

            card.innerHTML = `
                <div class="product-image-container">
                    <a href="${product.affiliateLink}" target="_blank">
                        <img src="${imageUrl}" alt="${product.name}" class="product-image">
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
  
    // === TẢI DỮ LIỆU BAN ĐẦU ===
    fetch('./products.json')
        .then(response => response.json())
        .then(data => {
            const now = new Date();

            // 1. "XỬ LÝ" DỮ LIỆU TRƯỚC KHI SẮP XẾP VÀ TÁCH
            const processedData = data.map(product => {
                const now = new Date();
                // Kiểm tra xem sản phẩm có phải là Flash Sale và đã hết hạn chưa
                if (product.flashSaleEndTime && new Date(product.flashSaleEndTime) <= now) {
                    // Ưu tiên lấy afterFlashSalePrice. Nếu không có, lấy originalPrice.
                    const newPrice = product.afterFlashSalePrice || product.originalPrice;
                    // Nếu đã hết hạn, tạo một bản sao của sản phẩm và "biến đổi" nó
                    return {
                        ...product, // Giữ lại tất cả các thuộc tính cũ
                        price: newPrice, // Cập nhật lại giá
                        // Nếu không có afterFlashSalePrice, không còn "giảm giá" nữa.
                        originalPrice: product.afterFlashSalePrice ? product.originalPrice : null,
                        flashSaleEndTime: null // Xóa thời gian Flash Sale
                    };
                }
                // Nếu không phải Flash Sale hết hạn, giữ nguyên sản phẩm
                return product; 
            });

            const sortedProducts = processedData.sort((a, b) => b.id - a.id);    // Sắp xếp mảng sản phẩm theo 'id' giảm dần (từ lớn đến bé)

            // TÁCH SẢN PHẨM
            const flashSaleProducts = sortedProducts.filter(p => 
                p.flashSaleEndTime && new Date(p.flashSaleEndTime) > now
            );
            const regularProducts = sortedProducts.filter(p => 
                !p.flashSaleEndTime || new Date(p.flashSaleEndTime) <= now
            );

            // Gán dữ liệu cho các phần tương ứng
            searchableProducts = sortedProducts; // CHỨA TOÀN BỘ SẢN PHẨM
            allProducts = regularProducts;  // Chứa các sp thường

            // Hiển thị
            displayFlashSaleProducts(flashSaleProducts);
            render();
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });

    // === HÀM RENDER CHÍNH ===
    // Chịu trách nhiệm lọc và hiển thị lại toàn bộ trang
        const render = () => {
            // Luôn bắt đầu với danh sách TÌM KIẾM được
        let sourceProducts = searchableProducts; 
        let isSearching = searchInput.value.length > 0;

        // Nếu người dùng KHÔNG tìm kiếm, chỉ hiển thị sản phẩm thường
        if (!isSearching) {
            sourceProducts = allProducts;
        }

        // Áp dụng các bộ lọc còn lại lên danh sách nguồn đã chọn
        let filteredProducts = sourceProducts;
        
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

        // ẨN KHU VỰC FLASH SALE KHI TÌM KIẾM
        if (isSearching) {
            flashSaleSection.style.display = 'none';
        } else {
            // Chỉ hiển thị lại nếu có sản phẩm flash sale
            const flashSaleProducts = searchableProducts.filter(p => 
                p.flashSaleEndTime && new Date(p.flashSaleEndTime) > new Date()
            );
            if (flashSaleProducts.length > 0) {
                flashSaleSection.style.display = 'block';
            }
        }

        // Tính toán phân trang
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        // Đảm bảo currentPage không lớn hơn tổng số trang (quan trọng khi kết quả lọc ít đi)
        if (currentPage > totalPages) currentPage = 1;
        const startIndex = (currentPage - 1) * productsPerPage;
        const productsForCurrentPage = filteredProducts.slice(startIndex, startIndex + productsPerPage);

        // Hiển thị sản phẩm và phân trang
        displayProductCards(productsForCurrentPage);
        setupPagination(totalPages, filteredProducts.length > 0);
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