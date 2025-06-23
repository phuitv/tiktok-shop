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
                render_js: true
            }
        });
        
        // --- PHÂN TÍCH HTML BẰNG CHEERIO ---
        console.log("Got HTML response, parsing with Cheerio...");
        const $ = cheerio.load(response.data); // Tải HTML vào Cheerio

        // Lấy thông tin sản phẩm bằng cú pháp giống jQuery
        // === LOGIC SCRAPING MỚI NHẤT: TỪ BIẾN __PDP_INITIAL_STATE__ ===
        let scriptContent = '';
        // Lặp qua tất cả các thẻ script để tìm thẻ chứa biến của chúng ta
        $('script').each((index, element) => {
            const scriptText = $(element).html();
            if (scriptText && scriptText.includes('window.__PDP_INITIAL_STATE__')) {
                scriptContent = scriptText;
                return false; // Dừng vòng lặp khi đã tìm thấy
            }
        });

        if (!scriptContent) {
            throw new Error("Không tìm thấy script chứa __PDP_INITIAL_STATE__.");
        }

        // Tách chuỗi JSON ra khỏi script
        // Bỏ đi "window.__PDP_INITIAL_STATE__ = " ở đầu và dấu ";" ở cuối
        const jsonString = scriptContent.replace('window.__PDP_INITIAL_STATE__ = ', '').slice(0, -1);
        const pageData = JSON.parse(jsonString);

        // Truy cập vào dữ liệu sản phẩm
        const productDetail = pageData?.product?.productDetail;

        if (!productDetail) {
            throw new Error("Không tìm thấy 'productDetail' trong dữ liệu __PDP_INITIAL_STATE__.");
        }

        const productName = productDetail.name;
        const productPriceNumber = productDetail.price?.salePrice;
        const imageUrl = productDetail.mainPictures?.[0]?.url;

        const productPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(productPriceNumber);

        console.log("Data scraped successfully from __PDP_INITIAL_STATE__:", { productName, productPrice, imageUrl });

        if (!productName || !productPriceNumber || !imageUrl) {
            throw new Error("Không thể trích xuất đủ thông tin từ dữ liệu __PDP_INITIAL_STATE__.");
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