const express = require("express");
const conn = require("../db");
const router = express.Router();
const cors = require("cors");

router.use(cors());

// Chart 첫번째 차트 DB 연결
router.get("/person", async (req, res) => {
    console.log("연결 접근")
    
    try {
        const [reservationValue] = await conn.execute(`SELECT DATE_FORMAT(end_date,'%y-%m')
            as dateCalc, sum(adult_cnt + child_cnt - cancel) as personCnt from reservation
            where date_format(end_date, '%y-%m') != '25-01'
            group by DATE_FORMAT(end_date,'%y-%m')`) 
            console.log("연결 성공1", reservationValue)
            res.json(reservationValue)
        } catch (err) {
            console.log("연결 실패1", err)
            res.status(500).send("서버 오류")
        }
    })
    
// Chart 두번째 차트 DB 연결
router.get("/price", async (req, res) => {
    console.log("연결 접근")
    try {
        const [priceValue] = await conn.execute(`select date_format(end_date, '%y-%m')
            as dateCalc, sum(tot_price) as totalPrice from reservation
            where date_format(end_date, '%y-%m') != '25-01'
            group by date_format(end_date, '%y-%m')`)
        console.log("연결 성공2", priceValue)
        res.json(priceValue)
    } catch (err) {
        console.log("연결 실패2", err)
        res.status(500).send("서버 오류")
    }
})

// Chart 세번째 차트 DB 연결 (지난달 매출 현황)
router.get("/sell", async (req, res) => {
    console.log("연결 접근")

    try {
        const [sellValue1] = await conn.execute(`select DISTINCT room.room_type , IFNULL(tot_price,0) as tot_price from room
left outer join (select room_type, sum(tot_price) as tot_price
from (select reservation.end_date, room.room_type, reservation.tot_price from room
left outer join product
on room.room_id = product.room_id
left outer join reservation 
on reservation.product_id = product.product_id
where reservation.Cancel != 1
and date_format(date_sub(sysdate(), interval 1 month), '%Y-%m') = date_format(reservation.end_date, '%Y-%m')
) as chart3
group by room_type) t4
on room.room_type = t4.room_type
order by room.room_type`)
        console.log("연결 성공3", sellValue1)

        const [sellValue2] = await conn.execute(`select DISTINCT room.room_type , IFNULL(tot_price,0) as tot_price from room
left outer join (select room_type, sum(tot_price) as tot_price
from (select reservation.end_date, room.room_type, reservation.tot_price from room
left outer join product
on room.room_id = product.room_id
left outer join reservation 
on reservation.product_id = product.product_id
where reservation.Cancel != 1
and date_format(now(), '%Y-%m') = date_format(reservation.end_date, '%Y-%m')
) as chart3
group by room_type) t4
on room.room_type = t4.room_type
order by room.room_type;`)

        console.log("연결 성공3", sellValue2)
        res.json({lastMM:sellValue1,
                    nowMM:sellValue2
                })
    } catch (err) {
        console.log("연결 실패3", err)
        res.status(500).send("서버 오류")
    }
})



// Chart 네번째 차트 DB 연결 (취소현황)
router.get("/cancel", async (req, res) => {
    console.log("연결 접근")

    try {
        const [cancelValue1] = await conn.execute(`select DISTINCT room.room_type , IFNULL(Cancel,0) as cancel from room
left outer join (select room_type, sum(Cancel) as cancel
from (select reservation.end_date, room.room_type, reservation.cancel from room
left outer join product
on room.room_id = product.room_id
left outer join reservation 
on reservation.product_id = product.product_id
where reservation.Cancel = 1
and date_format(date_sub(sysdate(), interval 1 month), '%Y-%m') = date_format(reservation.end_date, '%Y-%m')
) as chart3
group by room_type) t4
on room.room_type = t4.room_type
order by room.room_type`)
        console.log("연결 성공4", cancelValue1)

        const [cancelValue2] = await conn.execute(`select DISTINCT room.room_type , IFNULL(Cancel,0) as cancel from room
left outer join (select room_type, sum(Cancel) as cancel
from (select reservation.end_date, room.room_type, reservation.cancel from room
left outer join product
on room.room_id = product.room_id
left outer join reservation 
on reservation.product_id = product.product_id
where reservation.Cancel = 1
and date_format(now(), '%Y-%m') = date_format(reservation.end_date, '%Y-%m')
) as chart4
group by room_type) table4
on room.room_type = table4.room_type
order by room.room_type`)

        console.log("연결 성공4", cancelValue2)
        res.json({lastCancel:cancelValue1,
                    nowCancel:cancelValue2
                })
    } catch (err) {
        console.log("연결 실패4", err)
        res.status(500).send("서버 오류")
    }
})

module.exports = router