const axios = require("axios");
const moment = require("moment-timezone");
const puppeteer = require("puppeteer");

const todayText = moment().tz("Asia/Seoul").format("YYYY년 MM월 DD일");

const getImg = async (page, url) => {
    console.log(`Navigating to URL: ${url}`);
    try {
        await page.goto(url);
        await page.waitForSelector(".card_cont .box_list_board a .item_thumb .wrap_fit_thumb", { timeout: 5000 });

        const text = await page.evaluate(() => {
            return document.querySelector(".box_list_board a .item_info .tit_info").innerHTML;
        });

        console.log(`Fetched text: ${text}`);

        if (!text.includes(todayText)) {
            console.log(`Today's text not found in the content.`);
            return null;
        }

        const image = await page.evaluate(() => {
            return document.querySelector(".box_list_board a .item_thumb .wrap_fit_thumb").style.backgroundImage;
        });

        console.log(`Fetched image style: ${image}`);
        return image.split('"')[1];
    } catch (error) {
        console.error(`Error in getImg: ${error.message}`);
        return null;
    }
};

const getPostImg = async (page, url) => {
    console.log(`Navigating to URL: ${url}`); // 추가됨
    try {
        await page.goto(url);
        await page.waitForSelector(".wrap_webview .area_card .wrap_archive_txt", {timeout: 5000});
        
        // 페이지 콘솔 로그를 Node.js 콘솔로 전달
        page.on('console', msg => {
            for (let i = 0; i < msg.args().length; ++i)
                console.log(`PAGE LOG: ${msg.args()[i]}`);
        });

        const cards = await page.evaluate((todayText) => {
            const elements = document.querySelectorAll(".wrap_webview .area_card");
            console.log(`Found ${elements.length} .area_card elements`);
            return Array.from(elements)
                .filter(element => {
                    const title = element.querySelector(".tit_card")?.innerText || "";
                    const includesText = title.includes(todayText);
                    console.log(`Title: ${title}, Includes todayText: ${includesText}`);
                    // const desc = element.querySelector(".desc_card")?.innerHTML || "";
                    // console.log(`Desc: ${desc}`);
                    // 제목 형태가 달라지는 경우가 고민임.
                    return includesText;
                })
                .map(element => {
                    const image = element.querySelector(".wrap_fit_thumb")?.style.backgroundImage;
                    console.log(`Image : ${image}`);
                    if (!image) return null;
                    return image.split('"')[1];
                });
        }, todayText);

        const filteredCards = cards.filter(card => !!card);
        console.log(`Extracted cards: ${filteredCards}`);
        return filteredCards ? filteredCards[0] : null;
    } catch (error) {
        console.error(`Error in getPostImg: ${error.message}`);
        return null;
    }
}

const workDoneCheck = async () => {
    const check = await axios.get("https://lunch.muz.kr?check=true");
    if (check.status == 200 && check.data.result) {
        let urlCheck = true;
        for (const key in check.data.result) {
            const value = check.data.result[key];
            if (!value) urlCheck = false;
        }
        return urlCheck;
    }
    return false;
}

(async () => {
    try {
        console.log("=== RUN TIME : " + todayText + " ===");

        // 작업 필요유무 체크
        const workDoneResult = await workDoneCheck();
        if (workDoneResult) {
            console.log('WORK DONE!');
            return;
        }

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: "/usr/bin/chromium-browser",
            // m1 맥북
            // executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0");

        console.log('Fetching uncleImg...');
        const uncleImg = await getImg(page, "https://pf.kakao.com/_FxbaQC"); // 삼촌밥차

        console.log('Fetching mouseImg...');
        const mouseImg = await getImg(page, "https://pf.kakao.com/_CiVis/"); // 슈마우스

        console.log('Fetching jundamImg...');
        const jundamImg = await getPostImg(page, "https://pf.kakao.com/_vKxgdn/posts"); // 정담

        if (uncleImg || mouseImg || jundamImg) {
            console.log(`uncleImg: ${uncleImg}, mouseImg: ${mouseImg}, jundamImg: ${jundamImg}`);
            const uploadUrl = "https://lunch.muz.kr";
            await axios.post(uploadUrl, {
                uncle: uncleImg || '',
                mouse: mouseImg || '',
                jundam: jundamImg || '',
            });
            console.log('Images uploaded successfully.');
        } else {
            console.log('No images to upload.');
        }

        await browser.close();
        console.log('Browser closed.');
    } catch (error) {
        console.error(`Error in main execution: ${error.message}`);
        // 브라우저가 열려 있다면 닫기
        if (browser) {
            await browser.close();
            console.log('Browser closed due to error.');
        }
    }
})();
