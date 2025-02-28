const express = require("express");
const router = express.Router();
const conn = require("../db");
const axios = require('axios');
const {CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, STATE} = require('./naverLoginInfo');
let naverLoginUrl = ``



module.exports = () => {//1단계 - 이미 로그인 돼있다면 이 화면은 생략되고 callback으로 이동
    
    router.get("/", async (req, res) => {//네이버 로그인/bk/naverLogin
        req.session.state = STATE; // 세션에 state 저장
        naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CLIENT_ID}&state=${STATE}&redirect_uri=${REDIRECT_URI}`;
        res.redirect(naverLoginUrl);//네이버 로그인 페이지로 이동
        
    });

    router.get("/callback", async (req, res) => {//2단계 - 로그인 됐을 시 네이버 애플리케이션에 설정한 콜백url로 넘어감
        const { code, state } = req.query;

        if (!code || !state) {
            return res.status(400).send('code 또는 state 값이 누락되었습니다.');
        }
        if(state != req.session.state){
            //보안 강화를 위함
            return res.status(400).send('state 값 일치하지 않음')
        }

        try {
            const tokenRequest = await axios.post(
                `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}&state=${state}`
            );
    
            if ("access_token" in tokenRequest.data) {
                const { access_token } = tokenRequest.data;
    
                const userResponse = await axios.get("https://openapi.naver.com/v1/nid/me", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                });
    
                const userData = userResponse.data.response;
    
                const [existingUser] = await conn.execute(
                    `SELECT * FROM member WHERE member_id = ?`, [userData.id]
            );
    
            if (existingUser && existingUser.length > 0) {
                req.session.user = existingUser[0];
                // return res.redirect(`http://localhost:3000/callback?response_type=${code}&client_id=${CLIENT_ID}&state=${STATE}&redirect_uri=${REDIRECT_URI}`);
                return res.redirect
                (`http://localhost:3000/callback?code=${code}&state=${state}&access_token=${access_token}&grade=${userData.grade}&userData=${JSON.stringify(userData)}`);
            } else {
                await conn.execute(
                    'INSERT INTO member (member_id, pw, name, email, grade) VALUES (?, ?, ?, ?, 3)', [
                        userData.id,
                        generateRandomString(12),
                        userData.name,
                        userData.email,
                        userData.grade,
                    ]
                );
    
                req.session.user = {
                    member_id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    grade: 3,
                };
                // return res.redirect(`http://localhost:5002/bk/naverLogin/check`);
                return res.redirect
                (`http://localhost:3000/callback?code=${code}&state=${state}&access_token=${access_token}&grade=${userData.grade}&userData=${JSON.stringify(userData)}`);
                // return res.json({ loggedIn: true, user: req.session.user });
            }
        } else {
            return res.status(400).send('access_token 접근 실패');
        }
    } catch (err) {
        console.error("네이버 로그인 처리 오류 발생:", err);
        return res.status(500).send('네이버 로그인 처리 서버 오류');
    }
});

    router.get('/getUserInfo', (req, res)=>{//3단계 - 최종 로그인 상태 확인 라우터
        console.log('세션 상태:', req.session);
        if(req.session.user){
            return res.json({ loggedIn: true, user: req.session.user });
        }else{
            return res.json({ loggedIn : false })
        }
    })
      
    //비번 랜덤 생성
    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    return router;
}