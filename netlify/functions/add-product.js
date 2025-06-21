// netlify/functions/add-product.js
const { Octokit } = require("@octokit/rest");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

exports.handler = async (event) => {
    // --- BƯỚC DEBUG 1: In ra toàn bộ sự kiện (event) ---
    console.log("Function invoked. Event object:", JSON.stringify(event, null, 2));

    if (event.httpMethod !== 'POST') {
        console.log("Method not POST, exiting.");
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // --- BƯỚC DEBUG 2: Kiểm tra event.body trước khi parse ---
        if (!event.body) {
            console.error("Error: event.body is empty.");
            return { statusCode: 400, body: JSON.stringify({ message: "Request body is missing." }) };
        }
        console.log("Event body content:", event.body);

        const { productLink, category, password } = JSON.parse(event.body);
        console.log("Data parsed successfully:", { productLink, category }); // Che mật khẩu đi

        // --- BƯỚC DEBUG 3: Kiểm tra biến môi trường ---
        console.log("Checking environment variables...");
        if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN) {
             console.error("FATAL: ADMIN_PASSWORD or GITHUB_TOKEN is not set in Netlify environment.");
             return { statusCode: 500, body: JSON.stringify({ message: "Server configuration error." }) };
        }
        console.log("Environment variables seem OK.");

        // 1. --- BẢO MẬT: KIỂM TRA MẬT KHẨU ---
        if (password !== process.env.ADMIN_PASSWORD) {
            console.log("Password mismatch. Access denied.");
            return { statusCode: 401, body: JSON.stringify({ message: 'Sai mật khẩu!' }) };
        }
        console.log("Password correct. Proceeding to scrape.");

        // 2. --- LẤY DỮ LIỆU (SCRAPING) TỪ TIKTOK ---
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });
        const page = await browser.newPage();
        await page.goto(productLink, { waitUntil: 'networkidle2' });

        // Lấy tên sản phẩm - selector có thể thay đổi, cần kiểm tra
        const productName = await page.$eval('.pdp-product-name', el => el.textContent.trim());
        // Lấy giá sản phẩm - selector có thể thay đổi
        const productPrice = await page.$eval('.pdp-price_format-product', el => el.textContent.trim());
        // Lấy ảnh sản phẩm - selector có thể thay đổi
        const imageUrl = await page.$eval('.pdp-main-image-item > img', el => el.src);

        await browser.close();

        if (!productName || !productPrice || !imageUrl) {
            throw new Error("Không thể lấy đủ thông tin sản phẩm. Link có thể không đúng hoặc cấu trúc trang TikTok đã thay đổi.");
        }

        // 3. --- CẬP NHẬT FILE products.json TRÊN GITHUB ---
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = 'phuitv'; // THAY BẰNG USERNAME GITHUB CỦA BẠN
        const repo = 'tiktok-shop'; // THAY BẰNG TÊN REPO CỦA BẠN
        const path = 'products.json';

        // Lấy nội dung file products.json hiện tại
        const { data: currentFile } = await octokit.repos.getContent({ owner, repo, path });
        const content = Buffer.from(currentFile.content, 'base64').toString('utf8');
        const products = JSON.parse(content);

        // Tạo sản phẩm mới
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name: productName,
            price: productPrice,
            imageUrl: imageUrl,
            tiktokLink: productLink,
            category: category
        };

        // Thêm sản phẩm mới vào mảng
        products.push(newProduct);

        // Commit và push file đã cập nhật lên GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `feat: Add new product - ${productName}`,
            content: Buffer.from(JSON.stringify(products, null, 2)).toString('base64'),
            sha: currentFile.sha,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Thêm sản phẩm "${productName}" thành công!` })
        };

    } catch (error) {
        // --- BƯỚC DEBUG 4: In ra lỗi chi tiết ---
        console.error("An error occurred in the try-catch block:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Đã xảy ra lỗi: ${error.message}` })
        };
    }
};