const axios = require('axios');
const { Octokit } = require("@octokit/rest");

// Hàm để lấy URL đầy đủ sau khi chuyển hướng
async function getFinalUrl(shortUrl, apiKey) {
    const scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';
    const response = await axios.get(scrapingBeeUrl, {
        params: {
            api_key: apiKey,
            url: shortUrl,
            forward_headers: true // Yêu cầu ScrapingBee trả về header của trang cuối cùng
        }
    });
    // Trích xuất URL cuối cùng từ header 'Spb-Resolved-Url' mà ScrapingBee cung cấp
    return response.headers['spb-resolved-url'];
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productLink, category, password } = JSON.parse(event.body);

        if (password !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Sai mật khẩu!' }) };
        }

        console.log("Resolving final URL for:", productLink);
        const apiKey = process.env.SCRAPINGBEE_API_KEY;

        // 1. Lấy URL đầy đủ từ link rút gọn
        const finalUrl = await getFinalUrl(productLink, apiKey);
        if (!finalUrl) {
            throw new Error("Không thể lấy được link sản phẩm đầy đủ từ link rút gọn.");
        }
        console.log("Final URL resolved:", finalUrl);

        // 2. Trích xuất Product ID từ URL đầy đủ
        const match = finalUrl.match(/product\/(\d+)/);
        if (!match || !match[1]) {
            throw new Error("Không tìm thấy Product ID trong link sản phẩm.");
        }
        const productId = match[1];
        console.log("Product ID found:", productId);

        // 3. Xây dựng và gọi thẳng vào API của TikTok
        const apiUrl = `https://www.tiktok.com/api/v1/shop/products/detail?product_id=${productId}®ion=VN&language=vi`;
        console.log("Calling TikTok API:", apiUrl);

        // Cần giả mạo User-Agent và các header khác để trông giống một trình duyệt thật
        const apiResponse = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
            }
        });

        const productData = apiResponse.data.data;

        if (!productData || apiResponse.data.code !== 0) {
            throw new Error(`API của TikTok trả về lỗi: ${apiResponse.data.msg}`);
        }

        // 4. Trích xuất thông tin từ JSON của API
        const productName = productData.name;
        const productPriceNumber = productData.price.sale_price; // Giá là dạng số (ví dụ: 235000)
        const imageUrl = productData.main_pictures[0].url_list[0]; // Lấy ảnh đầu tiên

        const productPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(productPriceNumber);
        
        console.log("Data fetched from API successfully:", { productName, productPrice, imageUrl });
        
        // --- Phần cập nhật file trên GitHub (Giữ nguyên) ---
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = 'phuitv';
        const repo = 'tiktok-shop';
        const path = 'products.json';
        
        const { data: currentFile } = await octokit.repos.getContent({ owner, repo, path });
        const content = Buffer.from(currentFile.content, 'base64').toString('utf8');
        const products = JSON.parse(content);

        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name: productName,
            price: productPrice,
            imageUrl: imageUrl,
            tiktokLink: productLink,
            category: category
        };
        products.push(newProduct);
        
        await octokit.repos.createOrUpdateFileContents({
            owner, repo, path,
            message: `feat: Add new product - ${newProduct.name}`,
            content: Buffer.from(JSON.stringify(products, null, 2)).toString('base64'),
            sha: currentFile.sha,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Thêm sản phẩm "${productName}" thành công!` })
        };

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("An error occurred:", errorMessage);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Đã xảy ra lỗi: ${errorMessage}` })
        };
    }
};