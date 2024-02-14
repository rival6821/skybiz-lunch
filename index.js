const axios = require("axios");
const moment = require("moment-timezone");
const puppeteer = require("puppeteer");

const todayText = () => {
    const text = moment().tz("Asia/Seoul").format("YYYY년 MM월 DD일");
    return text;
};

const getImg = async (page, url) => {
    try {
        await page.goto(url);
        await page.waitForSelector(".card_cont .box_list_board a .item_thumb .wrap_fit_thumb", { timeout: 5000 });

        const text = await page.evaluate(() => {
            return document.querySelector(".box_list_board a .item_info .tit_info").innerHTML;
        });

        if (!text.includes(todayText())) {
            return null;
        }

        const image = await page.evaluate(() => {
            return document.querySelector(".box_list_board a .item_thumb .wrap_fit_thumb").style.backgroundImage;
        });

        return image.split('"')[1];
    } catch (error) {
        return null;
    }
};

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
    console.log("=== RUN TIME : " + moment().tz("Asia/Seoul").format("YYYY-MM-DD hh:mm:ss") + " ===");

    // 작업 필요유무 체크
    const workDoneResult = await workDoneCheck();
    if (workDoneResult) {
        console.log('WORK DONE!');
        return;
    }

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/chromium-browser",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0");

    const uncleImg = await getImg(page, "https://pf.kakao.com/_FxbaQC"); // 삼촌밥차
    const mouseImg = await getImg(page, "https://pf.kakao.com/_CiVis/"); // 슈마우스

    console.log(uncleImg, mouseImg);

    if (uncleImg || mouseImg) {
        const uploadUrl = "https://lunch.muz.kr";
        axios.post(uploadUrl, {
            uncle: uncleImg,
            mouse: mouseImg,
        });
    }

    await browser.close();
})();
