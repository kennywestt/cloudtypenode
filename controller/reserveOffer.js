const express = require('express');
const router = express.Router();
const db = require('../db');
// product_id의 offer 정보 가져오기
router.get("/:product_id", async (req,res) => {
    const { product_id } = req.params
  
    try {
      const [offerData] = await db.execute(`
        SELECT sp.start_date, sp.end_date, sp.offer_name
        FROM product p
        JOIN specialoffer_pkg sp ON p.offer_id = sp.offer_id
        WHERE p.product_id = ?
      `, [product_id]);
  
      if(offerData.length === 0){
        return res.status(404).json({ error : "객실이 존재 하지 않음"})
      }
      res.json(offerData[0])
    } catch(error) {
      console.error("특정 offer 데이터 조회 오류 : ", error)
      res.status(500).send("데이터 가져오기 오류")
    }
  })

  module.exports = router;