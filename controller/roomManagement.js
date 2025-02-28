const express = require('express');
const router = express.Router();
const conn = require("../db");

module.exports = () => {
    
    router.get('/', async (req, res) => {
        console.log("객실관리 백엔드 접근");

        try {
            const [ret] = await conn.execute('SELECT * FROM room');
            res.json(ret);
        } catch (err) {
            console.error('SQL 실패: ', err.message);
            res.status(500).send('DB 오류');
        }
    });

router.get("/detail/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [roomDetails] = await conn.execute( // conn으로 수정
            "SELECT * FROM room WHERE room_id = ?",
            [id]
        );

        if (roomDetails.length === 0) {
            return res.status(404).json({ message: "해당 방 정보를 찾을 수 없습니다." });
        }

        res.json(roomDetails[0]);
    } catch (err) {
        console.error("방 정보 조회 실패: ", err.message);
        res.status(500).json({ message: "방 정보 조회 중 오류가 발생했습니다." });
    }
});


router.get("/reservations/:roomId", async (req, res) => {
    const { roomId } = req.params;
    try {
        const [productData] = await conn.execute(
            "SELECT product_id FROM product WHERE room_id = ?",
            [roomId]
        );

        if (productData.length === 0) {
            console.log(`No product_id found for room_id: ${roomId}`);
            return res.status(404).send("해당 방에 대한 예약 정보가 없음");
        }

        const productId = productData[0].product_id;

        const [reservations] = await conn.execute(
            `SELECT r.room_id, r.description, p.prod_price, res.reservation_id,
                res.member_id, res.start_date, res.end_date, res.Cancel
             FROM reservation res
             JOIN product p ON res.product_id = p.product_id
             JOIN room r ON p.room_id = r.room_id
             WHERE res.product_id = ?`,
            [productId]
        );

        if (reservations.length === 0) {
            console.log(`No reservations found for product_id: ${productId}`);
            return res.json({ message: "예약 정보가 없음" });
        }

        res.json(reservations);
    } catch (err) {
        console.error("예약 정보 조회 실패: ", err.message);
        res.status(500).send("예약 정보 조회 중 오류 발생");
    }
});

router.post('/update', async (req, res) => {
    const { roomId, description, check_in } = req.body;

    if (!roomId) {
        return res.status(400).send("roomId 필수");
    }

    try {
        if (description !== undefined) {
            await conn.execute(
                'UPDATE room SET description = ? WHERE room_id = ?',
                [description, roomId]
            );
        }

        if (check_in !== undefined) {
            await conn.execute(
                'UPDATE room SET check_in = ? WHERE room_id = ?',
                [check_in, roomId]
            );
        }

        res.send('수정 완료');
    } catch (err) {
        console.error('SQL 수정 실패: ', err.message);
        res.status(500).send('DB 수정 중 오류 발생');
    }
});


    return router;
};