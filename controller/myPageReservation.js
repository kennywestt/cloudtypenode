const express = require("express");
const router = express.Router();
const conn = require("../db");
const axios = require("axios");


router.get("/", async(req, res) => {
  const memberId = req.query.member_id;
  console.log("받은 memberId: ", memberId);

  if (!memberId) {
    return res.status(400).send("member_id가 제공되지 않았습니다.");
  }

  const query = `
  SELECT 
    r.reservation_id,
    r.start_date,
    r.end_date,
    r.adult_cnt,
    r.child_cnt,
    r.tot_price,
    p.product_id,
    p.room_id,
    rm.room_type,
    s.offer_name,
    pm.payment_key
  FROM reservation r
  LEFT JOIN product p ON r.product_id = p.product_id
  LEFT JOIN room rm ON p.room_id = rm.room_id
  LEFT JOIN specialoffer_pkg s ON p.offer_id = s.offer_id
  LEFT JOIN payment pm ON r.reservation_id = pm.reservation_id
  WHERE r.member_id = ?
    AND r.Cancel = 0;
`;


  try {
    console.log("실행된 쿼리: ", query);

    // 데이터베이스 쿼리 실행
    const [rows] = await conn.execute(query, [memberId]);
    console.log("쿼리 결과: ", rows); // 쿼리 결과 로그 출력

    // 특정 필드 확인
    rows.forEach((row) => {
      console.log("payment_key 확인: ", row.payment_key);
    });
    res.json(rows); // 클라이언트로 결과 반환
  } catch (error) {
    console.error("쿼리 오류:", error);
    res.status(500).send("DB 에러");
  }
});  

const SECRET_KEY = "test_sk_AQ92ymxN34PeKWvLOJKy3ajRKXvd";

router.post('/cancel', async (req, res) => {
  const { reservationId, totPrice, paymentKey } = req.body;
  const today = new Date().toISOString().slice(0, 19).replace('T', ' ');

  console.log("받은 reservationId: ", reservationId);
  console.log("받은 totPrice: ", totPrice);
  console.log("받은 paymentKey: ", paymentKey);

  if (!reservationId || !paymentKey) {
    return res.status(400).send("필수 정보가 누락되었습니다.");
  }

  try {
    // Toss Payments API로 결제 취소 요청
    const response = await axios.post(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      { cancelReason: "구매자가 취소를 원함" },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Toss Payments 취소 응답:", response.data);

    // 1. 결제 테이블 업데이트
    const [paymentResult] = await conn.execute(
      `UPDATE payment
       SET refund = '1',
           refund_date = ?,
           refund_amount = ?
       WHERE reservation_id = ?`,
      [today, totPrice, reservationId]
    );

    if (paymentResult.affectedRows === 0) {
      throw new Error("결제 테이블 업데이트 실패");
    }

    // 2. 예약 테이블 업데이트
    const [reservationResult] = await conn.execute(
      `UPDATE reservation SET Cancel = 1 WHERE reservation_id = ?`,
      [reservationId]
    );

    if (reservationResult.affectedRows === 0) {
      throw new Error("예약 테이블 업데이트 실패");
    }

    res.status(200).send("예약 및 결제가 취소되었습니다.");
  } catch (error) {
    console.error("예약 취소 중 오류 발생:", error.message || error);
    res.status(500).send("예약 취소 처리 중 오류가 발생했습니다.");
  }
});

module.exports = router;
