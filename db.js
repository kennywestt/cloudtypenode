const db = require('mysql2');



// 데이터베이스 연결 객체 생성
const conn = db.createPool({
    host : 'localhost', //127.0.0.1 써도 됨은
    user : 'tj',
    password : '1234',
    database : 'study_db'
});
// const conn = db.createPool({
//     host : 'gagaclub.cafe24app.com', //127.0.0.1 써도 됨
//     user : 'gagaclub',
//     password : 'qwer123!',
//     database : 'gagaclub'
// });



// 서버 종료 시 DB 연결 종료
process.on('SIGINT',()=>{
    conn.end((err)=>{
        if(err){
            console.log(`종료 실패 : ${err.message}`);
        }else{
            console.log(`종료 성공 : ${conn.threadId}`);
        }
    })

    process.exit(0)  //프로세스 정상 종료 =>DB 끝내면서 프로세스도 완전히 다 끝내겠다.
});


// 커넥션 풀을 promise 방식으로 리턴
module.exports = conn.promise()