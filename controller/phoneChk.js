const express = require('express');
const router = express.Router();
require('dotenv').config();
const coolsms = require('coolsms-node-sdk').default;

module.exports = () => {
    // SMS 전송 API
    router.post('/sms', (req, res) => {
        // 인증번호 받을 전화번호
        console.log(req.body);
        const { phoneNum } = req.body;
        console.log(phoneNum);
        // 랜덤숫자
        const randomNum = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
        console.log('랜덤숫자:', randomNum);

        // apiKey, apiSecret 설정
        const messageService = new coolsms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

        // 2건 이상의 메시지를 발송할 때는 sendMany, 단일 건 메시지 발송은 sendOne을 이용해야 합니다.
        messageService
            .sendMany([
                {
                    to: phoneNum,
                    from: '01041402608',
                    text: `[신라호텔]본인인증번호:${randomNum}`,
                },
                // 1만건까지 추가 가능
            ])
            .then((ret) => {
                // 성공시
                console.log(ret);
                res.send(randomNum);
            })
            .catch((err) => {
                // 실패시
                console.error(err);
                res.status(200).send({ message: `sms 전송 실패` + err });
            });
    });

    return router;
};
