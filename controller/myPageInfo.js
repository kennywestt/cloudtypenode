const express = require("express");
const router = express.Router();
const conn = require("../db");

module.exports = upload => {

    

    // 내 문의 내역
    router.get("/myInquiry", async (req, res) => {
        console.log("내 문의 내역 접근");

        const { member_id } = req.query;
        
        if (!member_id) {
            return res.status(400).send("회원 ID가 없습니다.");
        }
    
        try {
            const [ret] = await conn.execute('SELECT *, DATE_FORMAT(date,\'%Y-%m-%d\') as reg_str FROM board WHERE member_id = ? ORDER BY board_id DESC', [member_id]);
    
            if (ret.length === 0) {
                res.status(500).send("문의 내역이 없습니다.");
            }
    
            res.json(ret);  
        } catch (err) {
            console.log("myInquiry sql 실패 : ", err.message);
            if (!res.headersSent) { // 응답 중복 방지
                res.status(500).send('내 문의 내역 DB 오류');
            }
        }
    });

    // 기존 비밀번호 확인
    router.post("/myInfoChg", async (req, res) => {
        console.log("회원정보수정 pw 확인 목록 접근");
    
        try {
            const { id, pw } = req.body;
            console.log("받은 데이터:", { id, pw });

            const sql = "SELECT member_id FROM member WHERE member_id = ? AND pw = ?";
            const param = [id, pw];

            const [rows] = await conn.execute(sql, param);
            if (rows.length > 0) {
                res.status(200).send("비밀번호 확인 성공");
            } else {
                console.log("비밀번호 확인 실패");
                res.status(400).send('비밀번호 확인 실패');
            }
        } catch (err) {
            console.log("회원정보수정 pw 확인 서버 오류:", err.message);
            if (!res.headersSent) { // 응답 중복 방지
                res.status(500).send('회원정보수정 pw 확인 서버 오류');
            }
        }
    });

    // 회원정보 받아오기
    router.get("/:id", async (req, res) => {
        console.log("myPageInfo 목록 접근");

        try {
            const [ret] = await conn.execute('select birth,email,grade,join_date,member_id,name,name_eng,phone from member where member_id = ? ',[req.params.id])
            res.json(ret[0]);
        } catch (err) {
            console.log("myPageInfo sql 실패 : ", err.message);
            ret.status(500).send('myPageInfo db오류');
        }
    });

    // 회원정보 수정
    router.put("/myInfoChg/:id", async (req, res) => {
        console.log("회원정보 수정 요청: ", req.body);
        const { phone, email, pw } = req.body;

        try {
            const sql = "UPDATE member SET phone = ?, email = ?, pw = ? WHERE member_id = ?";
            const params = [phone, email, pw, req.params.id];

            const [result] = await conn.execute(sql, params);
            if (result.affectedRows > 0) {
                res.status(200).send("회원정보 수정 성공");
            } else {
                res.status(400).send("비밀번호 불일치");
            }
        } catch (err) {
            console.error("회원정보 수정 오류: ", err.message);
            res.status(500).send("회원정보 수정 실패");
        }
    });


    // 회원 탈퇴 
    router.put("/withdraw/:id", async (req, res) => { 
        console.log("회원 탈퇴 요청: ", req.params.id); 
        try {
             const sql = "UPDATE member SET withdrawal = 1, withdrawal_date = NOW(), grade = 5 WHERE member_id = ?"; 
             const params = [req.params.id]; 

             const [result] = await conn.execute(sql, params); 
             if (result.affectedRows > 0) { 
                res.status(200).send("회원 탈퇴 성공"); 
            } else { res.status(400).send("회원 탈퇴 실패"); 

            } 
        } catch (err) { 
            console.error("회원 탈퇴 오류: ", err.message); 
            res.status(500).send("회원 탈퇴 실패"); 
        } 
    });

    return router;
};
