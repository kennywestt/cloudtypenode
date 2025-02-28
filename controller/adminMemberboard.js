const express = require("express");
const conn = require("../db");
const router = express.Router();
const cors = require('cors');

router.use(cors());  // 모든 도메인에서 요청을 허용

module.exports = () => {
    // 회원관리 메인 게시판 DB 연결
    router.get("/", async (req, res) => {
        console.log("백엔드 접근하기")
        try {
            const [memberDB] = await conn.execute("select * from member where grade != 1")
            // await 비동기 함수 내부를 사용하여 conn.execute와 같은 비동기 작업이 완료될 때 까지 대기
            // execute()가 완료되면 그 결과를 반환
            const [reserveDB] = await conn.execute("select * from reservation")
            res.json({ // json으로 응답, 메서드 안에 객체를 전달하면 이 객체가 json 방식으로 클라이언트 응답으로 전송
                members: memberDB, // 객체의 키가 members, 값이 memberDB, DB에서 가져온 member테이블을 members라는 키로 member 클라이언트에 DB를 전달
                reservers: reserveDB, // 객체 키가 reservers, 값이 reserveDB, DB에서 가져온 reservation 테이블을 reservers 클라이언트에 DB를 전달
            })
            
        } catch (err) { // 예외 처리 (아닌 경우 에러 처리)
            console.log("sql 실패", err.message)
            res.status(500).send("db 받기 오류")
        }
    })

    // 회원관리 detail 연결
    router.get("/detail/:member_id", async (req, res) => {
        const { member_id } = req.params
        console.log("받은 member_id: ", member_id)

    try {
        const [result] = await conn.execute(
            `SELECT 
                m.member_id, 
                m.name,
                m.email,
                m.phone,
                m.birth,
                m.join_date,
                m.grade,
                m.description,
                m.withdrawal,
                m.withdrawal_date,
                r.reservation_id, 
                r.start_date, 
                r.end_date, 
                r.tot_price, 
                r.adult_cnt, 
                r.child_cnt, 
                r.Cancel
            FROM 
                member m
            JOIN 
                reservation r 
            ON 
                m.member_id = r.member_id
            WHERE m.member_id = ?`, [member_id]
        )

        // if (result.length === 0) {    // result의 길이가 0인지 조건 검사
        //     return res.json({ message: "회원 또는 예약 정보를 찾을 수 없습니다." }) // 조건이 참이면 HTTP 응답으로 JSON 형식의 메시지 전달
        // }

        
        const [member] = await conn.execute("select * from member where member_id = ? ", [member_id])
        // member를 배열로 저장 = await로 실행 대기 (  )

        res.json(
            {reserve:result, mem : member[0]}
        )

        } catch (err) {
            console.log("sql 실패", err.message)
            res.status(500).send("db 받기 오류")
        }
    })

    router.put("/", async (req, res) => {
        const { grade, member_id, description } = req.body

        console.log("PUT 요청 받은 데이터:", grade, member_id)
    
        console.log("put 접근하기");
        console.log("grade : ", grade, "member_id : ", member_id, "description", description)
    
        try {
            await conn.execute("update member set grade = ?, description = ? where member_id = ?", [grade, description, member_id]);
            res.send("수정 완료");
            console.log("결과 테스트", grade, member_id, description)
        } catch (err) {
            console.error("POST 수정 실패 : ", err.message);
            res.status(500).send("POST 수정 과정 중 오류 발생");
        }
    });
    
    return router
}