document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');

    // Dùng fetch để đọc file products.json
    fetch('products.json')
        .then(Response => Response.json())  // Chuyển đổi phản hồi thành JSON
        .then(products => {
            // lặp qua mỗi sản phẩm trong mảng
            products.forEach(product => {
                // tạo 1 thẻ div cho card sản phẩm
                const card = document.createElement('div');
                card.classList.add('product-card');

                // chèn nội dung HTML vào card
                card.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${product.price}</p>
                        <a href="${product.tiktokLink}" target="_blank" rel="noopener noreferrer" class="product-link">Xem trên Tiktok</a>
                    </div>
                `;

                // thêm card sản phẩm vào lưới
                productGrid.appendChild(card);
            });
        })
        .catch(Error => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
            productGrid.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng thử lại sau.</p>';
        });
});
