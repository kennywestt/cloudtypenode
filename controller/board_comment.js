const express = require("express");
const router = express.Router();
const conn = require("../db");
const fs = require("fs");


// 인덱스에서 넘기는 자료를 받아서 처리
module.exports = upload => {
    router.get("/", async (req, res) => {
        console.log("board_comment 목록 접근");

//         select board_comment.*, member.name, DATE_FORMAT(date,'%Y-%m-%d %H:%i:%s') as reg_str 
// from board_comment 
// join member on member.member_id = board_comment.member_id where board_comment.member_id = 

        try {
            const [ret] = await conn.execute('select board_comment.*, member.name, DATE_FORMAT(date,\'%Y-%m-%d %H:%i:%s\') as reg_str from board_comment join member on member.member_id = board_comment.member_id ')
            
            res.json(ret);

        } catch (err) {

            console.log("sql 실패 : ", err.message);
            ret.status(500).send('/ db오류')

        }
        
    });

    //detail
    router.get("/detail/:board_id", async (req, res) => {
        console.log("board_comment detail 접근");

        try {
            const [ret] = await conn.execute("select *, DATE_FORMAT(date,\'%Y-%m-%d %H:%i:%s\') as reg_str from board_comment where comment_id = ?",[req.params.comment_id])
            res.json(ret[0]);
        } catch (err) {

            console.log("sql 실패 : ", err.message);
            ret.status(500).send('디테일 db오류')

        }
    });


    // 쓰기
    router.post("/detail/:board_id", async(req, res) => {
        console.log("백엔드 댓글 쓰기",req);

        let sql = 'insert into board_comment (board_id,author,context,member_id,date) values (?,?,?,?,sysdate())';


        let data = [
            req.body.board_id,
            req.body.author,
            req.body.context,
            req.body.member_id,
        ];
        console.log("백엔드 댓글 쓰기",data);

        try {
            const [ret] = await conn.execute(sql, data)
            
            // const newId = ret.insertId;
            console.log('게시판 댓글 쓰기완료',ret);
            res.json(ret)
        } catch (err) {

            console.log("sql 실패 : ", err.message);
            ret.status(500).send('db오류')

        }

    });

    router.delete("/detail/:comment_id", async(req, res) => {
        console.log("삭제 진입:" + req.params.comment_id);
        console.log(req.params.comment_id);


        try {
            const [ret] = await conn.execute('delete from board_comment where comment_id = ?',[req.params.comment_id])
            res.send("삭제 성공:" + req.params.comment_id);
        } catch (err) {

            console.log("sql 실패 : ", err.message);
            ret.status(500).send('db오류')

        }

    });

    router.put("/detail/:comment_id", async(req, res) => {
        console.log("댓글수정 진입 ",req.body)
        let data = [
            req.body.context,
            req.body.comment_id
        ]
        console.log(data);

        try {
            const [ret] = await conn.execute('update board_comment set context=? where comment_id = ?', data)
            res.send("댓글수정성공");
        } catch (err) {

            console.log("댓글수정sql 실패 : ", err.message);
            ret.status(500).send('댓글 수정 db오류')

        }
        
    });
    return router;
};
