const puppeteer = require('puppeteer');

const getImg = async (page, url) => {
  await page.goto(url);
  const searchResultSelector =
    '.card_cont .box_list_board a .item_thumb .wrap_fit_thumb';
  await page.waitForSelector(searchResultSelector);
  const image = await page.evaluate(() => {
    return document.querySelector(
      '.box_list_board a .item_thumb .wrap_fit_thumb'
    ).style.backgroundImage;
  });
  return image.split('"')[1];
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    // executablePath: '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  );

  const uncleImg = await getImg(page, 'https://pf.kakao.com/_FxbaQC'); // 삼촌밥차
  const mouseImg = await getImg(page, 'https://pf.kakao.com/_CiVis/'); // 슈마우스

  console.log(uncleImg, mouseImg);

  await browser.close();
})();
