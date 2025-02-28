const express = require("express");
const router = express.Router();
const conn = require("../db");
const fs = require("fs");


// 인덱스에서 넘기는 자료를 받아서 처리
module.exports = upload => {
    router.get("/idChk/:member_id", async (req, res) => {
        console.log("회원가입 목록 접근");

        try {
            const [ret] = await conn.execute('select count(*) as cnt from member where member_id = ?',[req.params.member_id])
            res.json(ret[0]);
        } catch (err) {

            console.log("회원가입 sql 실패 : ", err.message);
            ret.status(500).send('회원가입 db오류')

        }
        
    });

    // 쓰기
    router.post("/", async(req, res) => {
        console.log("회원가입 join",req);

        let sql = 'INSERT INTO member (member_id, pw, name, name_eng, email, phone, birth, grade, withdrawal, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, 3,false, sysdate())';


        let data = [
            req.body.member_id,
            req.body.pw,
            req.body.name,
            req.body.name_eng,
            req.body.email,
            req.body.phone,
            req.body.birth,
        ];
        console.log("회원가입 join",data);

    try {
        const [ret] = await conn.execute(sql, data);
        res.json({ ret });
    } catch (err) {
        console.log("회원정보입력 sql 실패: ", err.message);
        res.status(500).send('회원정보입력 DB 오류');
    }

    });




    return router;
};
