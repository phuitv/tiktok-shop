const axios = require('axios');
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productLink, category, password } = JSON.parse(event.body);

        if (password !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Sai mật khẩu!' }) };
        }

        const apiKey = process.env.SCRAPINGBEE_API_KEY;
        const scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';

        // BƯỚC 1: Lấy URL cuối cùng và trích xuất Product ID
        console.log("Resolving Product ID from:", productLink);
        const resolveResponse = await axios.get(scrapingBeeUrl, {
            params: {
                api_key: apiKey,
                url: productLink,
                forward_headers: true,
            }
        });
        const finalUrl = resolveResponse.headers['spb-resolved-url'];
        if (!finalUrl) { throw new Error("Không thể lấy được link sản phẩm đầy đủ."); }
        
        const match = finalUrl.match(/product\/(\d+)/);
        if (!match || !match[1]) { throw new Error("Không tìm thấy Product ID trong link sản phẩm."); }
        const productId = match[1];
        console.log("Product ID found:", productId);
        
        // BƯỚC 2: Xây dựng URL API chỉ với Product ID
        // Chúng ta đã thử &traffic_source_list=1 và nó không hoạt động, hãy thử lại mà không có nó
        // vì có thể các header của ScrapingBee đã đủ.
        const apiUrl = `https://www.tiktok.com/api/v1/shop/products/detail?product_id=${productId}®ion=VN&language=vi&traffic_source_list=1`;
        
        // BƯỚC 3: NHỜ SCRAPINGBEE GỌI API ĐÓ
        console.log("Asking ScrapingBee to call TikTok API:", apiUrl);
        const apiResponse = await axios.get(scrapingBeeUrl, {
            params: {
                api_key: apiKey,
                url: apiUrl,
            }
        });
        
        const responseData = apiResponse.data;
        const productData = responseData.data;

        if (!productData || responseData.code !== 0) {
            throw new Error(`API của TikTok trả về lỗi: ${responseData.msg || JSON.stringify(responseData)}`);
        }

        // BƯỚC 4: Trích xuất thông tin
        const productName = productData.name;
        const productPriceNumber = productData.price.sale_price;
        const imageUrl = productData.main_pictures[0].url_list[0];
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