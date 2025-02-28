const express = require("express");
const router = express.Router();
const conn = require("../db");

module.exports = () => {
    // 필터 데이터 조회
    router.get("/filters", async (req, res) => {
        try {
            const [years] = await conn.execute("SELECT DISTINCT YEAR(start_date) AS year FROM reservation");
            const [months] = await conn.execute("SELECT DISTINCT MONTH(start_date) AS month FROM reservation ORDER BY month");
            const [rooms] = await conn.execute(`
                SELECT DISTINCT p.room_id 
                FROM reservation r
                JOIN product p ON r.product_id = p.product_id
                ORDER BY p.room_id
            `);

            res.json({
                years: years.map((y) => y.year),
                months: months.map((m) => m.month),
                rooms: rooms.map((r) => r.room_id),
            });
        } catch (err) {
            console.error("필터 데이터 조회 실패:", err.message);
            res.status(500).send("DB 오류");
        }
    });

    // 매출 데이터 조회
    router.get("/", async (req, res) => {
        const { year, month, room } = req.query;

        let query = `
            SELECT r.reservation_id, r.member_id, p.room_id, r.start_date, r.end_date, r.Cancel, r.tot_price
            FROM reservation r
            JOIN product p ON r.product_id = p.product_id
            WHERE 1 = 1
        `;

        const params = [];

        if (year) {
            query += " AND YEAR(r.start_date) = ?";
            params.push(year);
        }
        if (month) {
            query += " AND MONTH(r.start_date) = ?";
            params.push(month);
        }
        if (room) {
            query += " AND p.room_id = ?";
            params.push(room);
        }

        try {
            const [salesData] = await conn.execute(query, params);
            res.json(salesData);
        } catch (err) {
            console.error("매출 데이터 조회 실패:", err.message);
            res.status(500).send("DB 오류");
        }
    });

    return router;
};
