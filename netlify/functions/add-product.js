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

        // BƯỚC 1: Dùng ScrapingBee để lấy URL cuối cùng
        console.log("Resolving final URL from:", productLink);
        const resolveResponse = await axios.get(scrapingBeeUrl, {
            params: {
                api_key: apiKey,
                url: productLink,
                forward_headers: true,
            }
        });
        const finalUrl = resolveResponse.headers['spb-resolved-url'];
        if (!finalUrl) {
            throw new Error("Không thể lấy được link sản phẩm đầy đủ.");
        }
        console.log("Final URL resolved:", finalUrl);

        // BƯỚC 2: Trích xuất các ID cần thiết từ URL cuối cùng
        const urlParams = new URL(finalUrl).searchParams;
        const productId = urlParams.get('product_id');
        const sellerId = urlParams.get('seller_id');
        
        if (!productId || !sellerId) {
            // Thử cách trích xuất khác nếu URL không có dạng query param
            const productMatch = finalUrl.match(/product\/(\d+)/);
            const sellerMatch = finalUrl.match(/seller_id=(\d+)/) || finalUrl.match(/sellerId=(\d+)/);

            const finalProductId = productId || (productMatch ? productMatch[1] : null);
            const finalSellerId = sellerId || (sellerMatch ? sellerMatch[1] : null);

            if (!finalProductId || !finalSellerId) {
                 throw new Error(`Không tìm thấy đủ ID trong link: ProductID=${finalProductId}, SellerID=${finalSellerId}`);
            }
            console.log(`IDs found: ProductID=${finalProductId}, SellerID=${finalSellerId}`);
            
            // BƯỚC 3: Xây dựng URL API với cả hai ID
            const apiUrl = `https://www.tiktok.com/api/v1/shop/products/detail?product_id=${finalProductId}&seller_id=${finalSellerId}®ion=VN&language=vi&traffic_source_list=1`;
            
            // BƯỚC 4: NHỜ SCRAPINGBEE GỌI API ĐÓ
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

            // BƯỚC 5: Trích xuất thông tin
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
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("An error occurred:", errorMessage);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Đã xảy ra lỗi: ${errorMessage}` })
        };
    }
};