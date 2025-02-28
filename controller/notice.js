const express = require("express");
const multer = require("multer");
const router = express.Router();
const conn = require("../db");
const fs = require("fs");
const { ALL } = require("dns");
const path = require("path");

module.exports = upload => {
    //메인
    router.get("/", async (req, res) => {
        try {
            const [ret] = await conn.execute(
                "select * from notice ORDER BY notice_id DESC;"
            );
            res.json(ret);
            // console.log("전체데이터", ret);
        } catch (error) {
            console.log("sql 실패 : ", err.message);
            ret.status(500).send("db오류");
        }
    });
    //클릭조회수
    router.put("/:id", async (req, res) => {
        const { id } = req.params;
        const sql =
            "update notice set view_point = view_point+1 where notice_id = ?";
        console.log("notice 조회수 접근", id);
        try {
            const [ret] = await conn.execute(sql, [id]);
            // console.log("조회수업데이트 성공")
            res.json(ret);
        } catch (error) {
            console.log("sql 실패 : ", error.message);
            res.status(500).send("db오류");
        }
    });

    //filter
    router.put("/", async (req, res) => {
        var { category, keyword } = req.body;

        var sql = "";
        const params = [`%${keyword}%`];
        console.log("notice 필터 접근", category, keyword);
        if (category === "all") {
            sql = "select * from notice where title like ? or context like ?";
            params.push(`%${keyword}%`);
        } else if (category === "title") {
            sql = " select * from notice where title like ?";
        } else if (category === "con") {
            sql = " select * from notice where context like ?";
        } else if (category === "분류") {
            sql = "select * from notice where title like ?";
        } else if (
            category === "공지" ||
            category === "안내" ||
            category === "이벤트"
        ) {
            sql = "select * from notice where title like ? and category = ?";
            params.push(category);
        }

        sql += " ORDER BY notice_id DESC";
        try {
            const [ret] = await conn.execute(sql, params);
            console.log(ret);
            // ret.push("order by desc");
            console.log("쿼리", sql, "값", params);
            // console.log("ret 최종데이터", ret);
            res.json(ret);
        } catch (err) {
            console.log("sql 실패 : ", err.message);
            ret.status(500).send("db오류");
        }
    });

    //디테일
    router.get("/detail/:id", async (req, res) => {
        //     const sql = `
        //     (SELECT 'current' AS state, notice_id, title, category, context, reg_date, view_point, system_name
        //      FROM notice
        //      WHERE notice_id = ?)
        //     UNION ALL
        //     (SELECT 'prev' AS state, notice_id, title, NULL AS category,  NULL AS context, NULL AS reg_date, NULL AS view_point, NULL AS system_name
        //      FROM notice
        //      WHERE notice_id < ?
        //      ORDER BY notice_id DESC
        //      LIMIT 1)
        //     UNION ALL
        //     (SELECT 'next' AS state, notice_id, title, NULL AS category,  NULL AS context, NULL AS reg_date, NULL AS view_point, NULL AS system_name
        //      FROM notice
        //      WHERE notice_id > ?
        //      ORDER BY notice_id ASC
        //      LIMIT 1);
        // `;
        console.log("notice detail 접근");
        // try {
        //     const [ret] = await conn.execute(sql, [
        //         req.params.id,
        //         req.params.id,
        //         req.params.id,
        //     ]);

        //     if (ret.length === 0) {
        //         return res.status(404).json({ message: "id없음" });
        //     }
        //     console.log("데이터", ret);
        //     res.json(ret);
        try {
            const [ret] = await conn.execute(
                "select * from notice where notice_id = ?",
                [req.params.id]
            );

            if (ret.length === 0) {
                return res.status(404).json({ message: "id없음" });
            }
            console.log("데이터", ret[0]);
            res.json(ret[0]);
        } catch (err) {
            console.log("sql 실패 : ", err.message);
            ret.status(500).send("db오류");
        }
    });

    //등록
    router.post("/register", upload.single("upfile"), async (req, res) => {
        const sql =
            "insert into notice(category, title, context, system_name, original_name, view_point, reg_date, edit_date) values (?,?,?,?,?, 0, sysdate(),sysdate())";
        const sqldata = [];
        if (req.file) {
            let newFName = Buffer.from(
                req.file.originalname,
                "latin1"
            ).toString("utf8");
            sqldata.push(
                req.body.category,
                req.body.title,
                req.body.context,
                req.file.filename,
                newFName
            );
        } else
            sqldata.push(
                req.body.category,
                req.body.title,
                req.body.context,
                null,
                null
            );

        console.log("sqldata", sqldata);

        try {
            const [ret] = await conn.execute(sql, sqldata);
            console.log("결과데이터", ret);
            res.json(ret[0]);
        } catch (error) {
            console.log("에러메세지", error);
        }
    });

    //수정
    router.put("/modify/:id", upload.single("upfile"), async (req, res) => {
        // var newFName = Buffer.from(req.file.originalname, "latin1").toString(
        //     "utf8"
        // );
        console.log("notice modify 접근", req.params.id);
        const id = req.params.id;
        if (!id) {
            return res.status(400).send("유효한 id가 필요함");
        }
        let sql =
            "update notice set category = ?, title = ?, context = ?, edit_date = sysdate()";
        const sqldata = [req.body.category, req.body.title, req.body.context];
        if (req.file) {
            sql += ", system_name = ?, original_name = ?";
            sqldata.push(req.file.filename, req.file.originalname);
        }
        sql += " WHERE notice_id = ?";
        sqldata.push(parseInt(id, 10));
        console.log("req.body", req.body);
        console.log("req.file", req.file);
        console.log("sql", sql);
        console.log("sqldata", sqldata);

        try {
            const [ret] = await conn.execute(sql, sqldata);
            console.log("수정완료", ret);
            res.send("수정성공");
            // res.json("res.json", ret);
        } catch (err) {
            console.log("sql 실패 : ", err.message);
            res.status(500).send("db오류");
        }
    });

    //삭제
    router.delete("/delete/:id", async (req, res) => {
        // const id = req.params.id;
        // const { delUPfile } = req.body;
        // console.log("받은아이디", id, "파일명", delUPfile);

        try {
            const id = req.params.id;
            const { delUPfile } = req.body;
            console.log("삭제접근id", id, "삭제파일명", delUPfile);

            //console.log("부모 위치 1: ", path.basename(__dirname));
            // console.log("부모 위치 2: ", path.dirname(__dirname));

            if (delUPfile) {
                const filePath = path.join(
                    path.dirname(__dirname), // files가 있는 폴더위치 backend
                    "files",
                    delUPfile
                );
                console.log("파일있다", filePath);
                try {
                    await fs.unlink(filePath, () => {}); // 콜백함수필요
                    console.log(`${delUPfile} 삭제 성공`);
                } catch (error) {
                    console.error(`삭제 에러 : ${delUPfile}`, error.message);
                }
            }

            const ret = conn.execute("delete from notice where notice_id = ?", [
                id,
            ]);
            console.log("삭제완료", ret);
            res.send("삭제성공");
        } catch (error) {
            console.error("sql 실패 : ", error.message);
            res.status(500).send("db오류");
        }
    });
    return router;
};
