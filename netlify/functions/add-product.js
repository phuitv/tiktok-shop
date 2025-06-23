// netlify/functions/add-product.js
const axios = require('axios');
const cheerio = require('cheerio'); // <-- Thư viện mới
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

        console.log("Calling ScrapingBee API for URL:", productLink);

        const scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';
        const apiKey = process.env.SCRAPINGBEE_API_KEY;
        
        // --- YÊU CẦU HTML THÔ TỪ SCRAPINGBEE ---
        const response = await axios.get(scrapingBeeUrl, {
            params: {
                api_key: apiKey,
                url: productLink,
                // KHÔNG CÓ extract_rules ở đây
            }
        });
        
        // --- PHÂN TÍCH HTML BẰNG CHEERIO ---
        console.log("Got HTML response, parsing with Cheerio...");
        const $ = cheerio.load(response.data); // Tải HTML vào Cheerio

        // Lấy thông tin sản phẩm bằng cú pháp giống jQuery
        const productName = $('h1[class*="pdp-product-name"]').text().trim();
        const productPrice = $('div[class*="pdp-price_format-product"]').text().trim();
        const imageUrl = $('div[class*="pdp-main-image-item"] img').attr('src');

        console.log("Data scraped successfully:", { productName, productPrice, imageUrl });

        if (!productName || !productPrice || !imageUrl) {
            throw new Error("Không thể lấy đủ thông tin sản phẩm. Link hoặc selector trên trang TikTok có thể đã thay đổi.");
        }

        // --- Phần cập nhật file trên GitHub (Giữ nguyên) ---
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = 'phuitv'; // NHỚ THAY BẰNG USERNAME CỦA BẠN
        const repo = 'tiktok-shop'; // NHỚ THAY BẰNG TÊN REPO MỚI CỦA BẠN NẾU CÓ
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
            body: JSON.stringify({ message: `Thêm sản phẩm "${newProduct.name}" thành công!` })
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