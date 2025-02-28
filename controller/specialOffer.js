const express = require("express");
const router = express.Router();
const conn = require("../db");
const fs = require("fs");
const { start } = require("repl");

module.exports = upload => {
    router.get("/", async (req, res) => {
        //////////////선생님코드
        // var sql = "select * from specialoffer_pkg";
        // var sqlData = {
        //     offer_type: "",
        //     breakfast: 1,
        //     lounge: 1,
        //     anniversry: 1,
        //     pool: 0,
        //     three_people: 0,
        //     consecutive_night: 0,
        //     kids: 0,
        // };
        // console.log("specialOffer 목록 접근", sqlData);

        // var whereData = [];
        // if (sqlData) {
        //     var whereSql = " where ";

        //     for (const ee in sqlData) {
        //         whereSql += " " + ee + " = ? and";
        //         //whereData.append(sqlData[ee]);
        //         whereData.push(sqlData[ee]);
        //     }

        //     whereSql = whereSql.substring(0, whereSql.lastIndexOf("and"));

        //     console.log(whereSql);
        //     console.log(whereData);

        //     sql += whereSql;
        // }
        //연습
        //  where start_date >= "2023-08-10" and end_date <="2025-12-30" and offer_type = "패밀리" and breakfast = 1 and lounge = 1 and anniversry = 1 and pool = 0 and three_people = 0 and consecutive_night = 0 and kids = 0';

        try {
            const [ret] = await conn.execute(
                "select * from specialoffer_pkg where end_date > sysdate()"
            );
            // select * from specialoffer_pkg where end_date > SYSDATE();
            // const [ret] = await conn.execute(sql, whereData);
            res.json(ret);
        } catch (err) {
            console.log("sql 실패 : ", err.message);
            ret.status(500).send("db오류");
        }
    });

    //filter
    router.put("/", async (req, res) => {
        // const { offer_type, badge } = req.body;
        // let sqll = "select * from specialoffer_pkg";
        // const sqlldata = [];

        // if (offer_type && badge) {
        //     sqll += " where offer_type = ? and badge = ? ";
        //     sqlldata.push(offer_type, badge);
        // } else if (offer_type) {
        //     sqll += " where offer_type = ? ";
        //     sqlldata.push(offer_type);
        // } else if (badge) {
        //     sqll += " where badge = ? ";
        //     sqlldata.push(badge);
        // }

        var sql = "select * from specialoffer_pkg";
        var sqlData = req.body;
        console.log("specialOffer 필터 접근", sqlData);

        var whereData = [];
        //유형전체일경우 조건처리
        if (sqlData.offer_type == "All") {
            delete sqlData["offer_type"];
        }
        var whereSql = " where ";
        //기존 선생님
        // if (sqlData) {
        //     var whereSql = " where "}

        //날짜있을경우 조건처리
        // select * from specialoffer_pkg where  start_date< "2024-12-31" and end_date> "2024-12-10" and end_date< "2024-12-31"
        if (sqlData.date_range && sqlData.date_range.trim() !== "") {
            whereSql += "start_date< ? and end_date> ? and end_date<= ? and";
            whereData.push(sqlData.end_date);
            whereData.push(sqlData.start_date);
            whereData.push(sqlData.end_date);
            delete sqlData["start_date"];
            delete sqlData["end_date"];
        }
        delete sqlData["date_range"]; // 날짜없을때

        //유형,키워드 조건 처리
        for (const key in sqlData) {
            whereSql += " " + key + " = ? and";
            whereData.push(sqlData[key]);
        }

        whereSql += " end_date > sysdate()";
        // whereSql = whereSql.substring(0, whereSql.lastIndexOf("and"));
        // whereSql += "where end_date > sysdate()";
        sql += whereSql;

        console.log(whereSql);
        console.log(whereData);

        try {
            const [ret] = await conn.execute(sql, whereData);
            console.log("쿼리", sql, "값", whereData);
            console.log("ret 최종데이터", ret);
            res.json(ret);
        } catch (err) {
            console.log("sql 실패 : ", err.message);
            ret.status(500).send("db오류");
        }
    });

    //detail
    router.get("/detail/:id", async (req, res) => {
        console.log("specialOffer detail 접근");
        try {
            const [ret] = await conn.execute(
                // "select * from specialoffer_pkg where offer_id = ?",
                // [req.params.id]
                "select specialoffer_pkg.*, product_id from specialoffer_pkg join product on specialoffer_pkg.offer_id = product.offer_id where specialoffer_pkg.offer_id = ? ",
                [req.params.id]
            );
            if (ret.length === 0) {
                return res.status(404).json({ message: "id없음" });
            }
            res.json(ret[0]);
        } catch (err) {
            console.error("sql 실패 : ", err.message);
            res.status(500).send("db오류");
        }
    });

    return router;
};
