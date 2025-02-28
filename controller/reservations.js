const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');

const bkURL = process.env.REACT_APP_BACK_URL;

// 예약 가능한 객실 및 패키지 조회
router.post('/', async (req, res) => {
  const { startDate, endDate } = req.body;
  console.log("startDate : ",startDate)
  console.log("endDate : ",endDate)

  try {

    // 예약이 겹치지 않는 객실 조회
    const [availableRooms] = await db.execute(`
       select t1.*, product_id from (SELECT r.room_id, r.room_type, r.day_price, r.max_occupancy
      FROM room r
      WHERE r.room_id NOT IN (
        SELECT p.room_id
        FROM reservation res
        JOIN product p ON res.product_id = p.product_id
        WHERE (res.start_date <= ? AND res.end_date >= ? and Cancel = 0)
      )) t1 join product 
      on t1.room_id = product.room_id
      where product.offer_id is null
    `, [endDate, startDate]);

    // 예약이 겹치지 않는 패키지 조회
    const [availablePackages] = await db.execute(`
     select t1.*, product_id, t1.upSystem from (SELECT sp.*
      FROM specialoffer_pkg sp
      WHERE sp.room_id NOT IN (
        SELECT p.room_id
        FROM reservation res
        JOIN product p ON res.product_id = p.product_id
        WHERE (res.start_date <= ?  AND res.end_date >= ? and Cancel = 0)
      )
      AND sp.start_date <= ?  AND sp.end_date >= ? )  t1
join product on product.offer_id = t1.offer_id and t1.room_id = product.room_id
    `, [endDate, startDate, endDate, startDate]);

    // 예약 가능한 객실과 패키지 데이터 반환
    res.json({ availableRooms, availablePackages });
  } catch (error) {
    console.error("데이터 가져오기 오류:", error);
    res.status(500).send("데이터 가져오기 오류");
  } 
});

// 매인 패키지 예약 저장 API
router.post("/save", async (req, res) => {
  const { memberId, productId, startDate, endDate, totPrice, adultCnt, childCnt, cancel } = req.body;

  try {
    // 예약 데이터를 예약 테이블에 저장
    const result = await db.execute(
      `INSERT INTO reservation (member_id, product_id, start_date, end_date, tot_price, adult_cnt, child_cnt, Cancel) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [memberId, productId, startDate, endDate, totPrice, adultCnt, childCnt, cancel]
    );

    // 저장 성공 시, 성공 메시지 반환
    res.status(201).json({ message: "예약이 성공적으로 저장됨됨", reservationId: result[0].insertId });
  } catch (error) {
    console.error("예약 저장 오류:", error);
    res.status(500).send("서버 오류 예약을 저장할 수 없음");
  }
});

// 결제 저장 API
router.post('/savepayment', async (req, res) => {
  const { reservationId, paymentAmount, paymentId, paymentKey, paymentMethod } = req.body;
  console.log(reservationId, paymentAmount, paymentId, paymentKey, paymentMethod)

  try {
    // 8자리 랜덤 결제 ID 생성
    // const paymentId = Math.floor(Math.random() * 90000000) + 10000000;
    const now = new Date();
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC + 9시간
    const paymentDate = koreanTime.toISOString().slice(0, 19).replace('T', ' '); // KST 시간으로 포맷

    // 결제 정보를 payment 테이블에 저장
    const result = await db.execute(
      `INSERT INTO payment (payment_id, reservation_id, payment_key, payment_method, payment_date, payment_amount, refund, refund_date, refund_amount)
       VALUES (?, ?, ?, ?, ?, ?, '0', NULL, NULL)`,
      [paymentId, reservationId, paymentKey, paymentMethod, paymentDate, paymentAmount]
    );

    // 결제 정보 저장이 성공적으로 완료되면 성공 메시지 반환
    res.status(201).json({ message: '결제가 성공적으로 완료' });
  } catch (error) {
    console.error("결제 저장 오류:", error);
    res.status(500).send("서버 오류 결제를 저장할 수 없음음");
  }
});

// reserve/detail 페이지에서 productId를 가지고 specialoffer_pkg upSystem 이미지 가져오기
router.post('/detail', async (req, res) => {
  const { productId } = req.body;

  try {
    const [result] = await db.execute(
      `SELECT sp.upSystem 
       FROM product p 
       JOIN specialoffer_pkg sp ON p.offer_id = sp.offer_id 
       WHERE p.product_id = ?`,
      [productId]
    );

    if (result.length > 0) {
      const upSystemPath = `${bkURL}/files/${result[0].upSystem}`;
      res.json({ upSystem: upSystemPath });
    } else {
      res.status(404).json({ message: "이미지를 찾을 수 없음" });
    }
  } catch (error) {
    console.error("SQL 에러 :", error);
    res.status(500).send("서버 오류 발생");
  }
});

const SECRET_KEY = 'test_sk_AQ92ymxN34PeKWvLOJKy3ajRKXvd'; // 토스페이먼츠 시크릿 키

router.post('/confirm', async (req, res) => {
  const { paymentKey, orderId, amount} = req.body;
  console.log('요청 데이터:', req.body);

  try {
    const authHeader = `Basic ${Buffer.from(`${SECRET_KEY}:`).toString('base64')}`;
    const response = await axios.post(
      'https://api.tosspayments.com/v1/payments/confirm',
      { paymentKey, orderId, amount},
      { headers: { Authorization: authHeader, 'Content-Type': 'application/json' } }
    );
    

    // Toss Payments 응답 데이터에서 metadata 추출
    const metadata = response.data.metadata
      ? JSON.parse(response.data.metadata.reservationInfo) // JSON 문자열을 파싱
      : {};

    res.json({
      message: '결제 승인 완료',
      method: response.data.method,
      easyPay: response.data.easyPay,
      data: response.data,
      metadata: metadata, // 클라이언트로 metadata 전달
    });

    console.log('토스페이먼츠 응답 : ', response.data)
  } catch (error) {
    if (error.response) {
      console.error('결제 승인 오류 (응답 있음):', error.response.data);
      res.status(500).json({ message: '결제 승인 실패', error: error.response.data });
    } else {
      console.error('결제 승인 오류 (응답 없음):', error.message || error);
      res.status(500).json({ message: '결제 승인 실패', error: error.message || error });
    }
  }
});
module.exports = router;