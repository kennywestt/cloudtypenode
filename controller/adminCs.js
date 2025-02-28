const express = require("express");
const router = express.Router();
const conn = require("../db");


// 인덱스에서 넘기는 자료를 받아서 처리
module.exports = upload => {
    router.get("/", async (req, res) => {
        console.log("adminCsboard 목록 접근");
    
        try {
            const [ret] = await conn.execute(`
                SELECT board.board_id, board.title, member.name, DATE_FORMAT(board.date, '%Y-%m-%d') AS reg_str, board.answer
                FROM board
                JOIN member ON member.member_id = board.member_id
                ORDER BY board.answer ASC, board.board_id DESC;
            `);
            res.json(ret); 
        } catch (err) {
            console.log("sql 실패 : ", err.message);
            res.status(500).send('db오류');
        }
    });

    //detail
    router.get("/detail/:board_id", async (req, res) => {
        console.log("board detail 접근");

        try {
            const [ret] = await conn.execute("select board.*, member.name as writer_name, DATE_FORMAT(date,\'%Y-%m-%d %H:%i:%s\') as reg_str from board JOIN member ON board.member_id = member.member_id where board.board_id = ?",[req.params.board_id])
            console.log(req.params);
            
            res.json(ret[0]);
        } catch (err) {

            console.log("sql 실패 : ", err.message);
            ret.status(500).send('db오류')

        }
        
    });


    return router;
};
