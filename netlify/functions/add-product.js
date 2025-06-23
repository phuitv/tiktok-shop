// netlify/functions/add-product.js
const axios = require('axios');
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { productLink, category, password } = JSON.parse(event.body);

        // 1. --- BẢO MẬT: KIỂM TRA MẬT KHẨU ---
        if (password !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Sai mật khẩu!' }) };
        }

        // 2. --- LẤY DỮ LIỆU QUA API CỦA SCRAPINGBEE ---
        console.log("Calling ScrapingBee API for URL:", productLink);

        const scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';
        const apiKey = process.env.SCRAPINGBEE_API_KEY;

        // Cấu hình các yếu tố cần lấy (extract_rules)
        const extractRules = {
            "name": "h1[class*='pdp-product-name']",
            "price": "div[class*='pdp-price_format-product']",
            "imageUrl": {
                "selector": "div[class*='pdp-main-image-item'] img",
                "output": "attribute",
                "attribute": "src"
            }
        };
        
        // Gọi API
        const response = await axios.get(scrapingBeeUrl, {
            params: {
                api_key: apiKey,
                url: productLink,
                extract_rules: JSON.stringify(extractRules),
                wait_for: '.pdp-product-name' // Đợi cho đến khi tên sản phẩm xuất hiện
            }
        });

        // Lấy dữ liệu đã được xử lý
        const { name, price, imageUrl } = response.data;
        
        console.log("Data scraped successfully:", { name, price, imageUrl });

        if (!name || !price || !imageUrl) {
            throw new Error("Không thể lấy đủ thông tin sản phẩm. Link hoặc selector có thể đã sai.");
        }

        // 3. --- CẬP NHẬT FILE products.json TRÊN GITHUB (Giữ nguyên) ---
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = 'phuitv';       // THAY BẰNG USERNAME CỦA BẠN
        const repo = 'tiktok-shop'; // THAY BẰNG TÊN REPO CỦA BẠN
        const path = 'products.json';

        const { data: currentFile } = await octokit.repos.getContent({ owner, repo, path });
        const content = Buffer.from(currentFile.content, 'base64').toString('utf8');
        const products = JSON.parse(content);

        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name: name.trim(),
            price: price.trim(),
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
            body: JSON.stringify({ message: `Thêm sản phẩm "${newProduct.name}" thành công!` })
        };

    } catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Đã xảy ra lỗi: ${error.message}` })
        };
    }
};