// netlify/functions/add-product.js

// === THAY ĐỔI CÁCH REQUIRE ===
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
    // Phần logging và kiểm tra mật khẩu giữ nguyên...
    console.log("Function invoked. Event object:", JSON.stringify(event, null, 2));

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let browser = null;

    try {
        const { productLink, category, password } = JSON.parse(event.body);
        
        if (password !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Sai mật khẩu!' }) };
        }
        
        console.log("Password correct. Proceeding to scrape.");

        // === THAY ĐỔI CÁCH KHỞI ĐỘNG BROWSER ===
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath, // Lấy đường dẫn từ chrome-aws-lambda
            headless: chromium.headless, // Sử dụng chế độ headless của chrome-aws-lambda
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.goto(productLink, { waitUntil: 'networkidle2' });
        
        console.log("Page navigation successful. Scraping data...");

        // Lấy thông tin sản phẩm (giữ nguyên, nhưng hãy kiểm tra lại selector)
        // Cần kiểm tra lại các selector này trên trang sản phẩm thực tế!
        const productName = await page.$eval('h1[class*="pdp-product-name"]', el => el.textContent.trim());
        const productPrice = await page.$eval('div[class*="pdp-price_format-product"]', el => el.textContent.trim());
        const imageUrl = await page.$eval('div[class*="pdp-main-image-item"] img', el => el.src);

        console.log("Data scraped:", { productName, productPrice, imageUrl });
        
        if (!productName || !productPrice || !imageUrl) {
            throw new Error("Không thể lấy đủ thông tin sản phẩm. Selector có thể đã thay đổi.");
        }

        // --- Phần cập nhật file trên GitHub giữ nguyên ---
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = 'phuitv'; // NHỚ THAY BẰNG USERNAME CỦA BẠN
        const repo = 'tiktok-shop'; // NHỚ THAY BẰNG TÊN REPO CỦA BẠN
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
        
        console.log("Updating products.json on GitHub...");

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `feat: Add new product - ${productName}`,
            content: Buffer.from(JSON.stringify(products, null, 2)).toString('base64'),
            sha: currentFile.sha,
        });
        
        console.log("GitHub update successful.");

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Thêm sản phẩm "${productName}" thành công!` })
        };

    } catch (error) {
        console.error("An error occurred in the try-catch block:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Đã xảy ra lỗi: ${error.message}` })
        };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};