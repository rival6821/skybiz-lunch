const axios = require("axios");
const moment = require("moment-timezone");
const pino = require('pino');
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

const getImage = async (id) => {
    const url = `https://pf.kakao.com/rocket-web/web/profiles/${id}/posts`
    console.log(`Fetching image from ${url}`);
    try {
        const response = await axios.get(url);
        // console.log(`Response: ${JSON.stringify(response.data)}`);
        if (response.status === 200) {
            const data = response.data;
            if (!data) {
                console.log("No data found");
                return null;
            }
            const items = data.items;
            if (!items) {
                console.log("No items found");
                return null;
            }
            // 오늘 작성된 포스트만 필터링
            const todayItem = items.filter(item => {
                return item.created_at >= moment().startOf('day').unix() && item.created_at <= moment().endOf('day').unix() && item.type === "image";
                // 2025년 3월 14일 날자로 테스트
                // const startTime = moment("2025-03-13").startOf('day').unix()*1000;
                // const endTime = moment("2025-03-14").endOf('day').unix()*1000;
                // return item.created_at >= startTime && item.created_at <= endTime && item.type === "image";
            });
            console.log(`Found ${todayItem.length} posts today`);
            if (todayItem.length === 0) {
                console.log("No posts found today");
                return null;
            }
            // TODO: 동일 일지에 이미지 2개 올리면 고민해봐야함.
            const media = todayItem[0].media;
            if (!media) {
                console.log("No media found");
                return null;
            }
            // 여러 이미지 중 조건 부로 다른 이미지가 필요함.
            if (id === "_FxbaQC") {
                // 삼촌 : 마지막
                return media[media.length - 1].large_url;
            } else if (id === "_CiVis") {
                // 마우스 : 첫번째
                return media[0].large_url;
            } else if (id === "_vKxgdn") {
                // 정담 : 첫번째
                return media[0].large_url;
            }
        }
        return null;
    } catch (error) {
        console.error(`Error in getImage: ${error.message}`);
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
        // 작업 필요유무 체크
        const workDoneResult = await workDoneCheck();
        if (workDoneResult) {
            logger.info('WORK DONE!');
            return;
        }

        logger.info('Fetching uncleImg...');
        const uncleImg = await getImage("_FxbaQC"); // 삼촌

        logger.info('Fetching mouseImg...');
        const mouseImg = await getImage("_CiVis"); // 슈마우스

        logger.info('Fetching jundamImg...');
        const jundamImg = await getImage("_vKxgdn"); // 정담
        logger.info(`jundamImg: ${jundamImg}`);

        if (uncleImg || mouseImg || jundamImg) {
            logger.info(`uncleImg: ${uncleImg}, mouseImg: ${mouseImg}, jundamImg: ${jundamImg}`);
            // const uploadUrl = "https://lunch.muz.kr";
            // await axios.post(uploadUrl, {
            //     uncle: uncleImg || '',
            //     mouse: mouseImg || '',
            //     jundam: jundamImg || '',
            // });
            logger.info('Images uploaded successfully.');
        } else {
            logger.info('No images to upload.');
        }
    } catch (error) {
        logger.error(`Error in main execution: ${error.message}`);
    }
})();
