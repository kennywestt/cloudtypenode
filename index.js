const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors'); // 다른 포트에서 들어와도 열어주는 것이다.
const multer = require('multer'); // 자동으로 파일 업로드 처리를 해주겠다.
const path = require('path');

// 세션 설정
app.use(
    session({
        secret: '1234',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: false,
        },
    })
);

// app.use(cors()); //다른 포트에서 들어와도 열어주도록 cors 세팅
const corsOptions = {
    origin: [
        process.env.SERVER_ADDRESS, // Node.js 호스팅 주소
        process.env.SERVICE_ADDRESS, // React 호스팅 주소
        "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // JSON 파싱 미들웨어 추가

// static 폴더 설정 --> 이미지 파일 프론트 엔드에 서빙
app.use('/bk/files', express.static(path.join(__dirname, 'files')));

// frontend static 처리
app.use(express.static(path.join(__dirname, 'build')));

// 업로드는 멀터로 작업을 하겠다.
// multer 세팅
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'files/'); //files 폴더 안에 파일 저장 하겠다.
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            // 이 방법인데... 이렇게 하면 한글이 깨지게 된다.
            // cb(null,path.basename(file.originalname,ext) + Date.now() + ext)

            // 한글인코딩(한글 안깨지게 올리는 방법)
            let fName = path.basename(file.originalname, ext) + Date.now() + ext;
            let newFName = Buffer.from(fName, 'latin1').toString('utf-8');
            cb(null, newFName);
        },
    }),
    limits: { fieldSize: 5 * 1024 * 1024 }, //5mb
});

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}));

//각 라우터 연결(라우팅 추가)=> 라우터 하나 넣을 때마다 아래 2줄이 계속 추가로 붙는 것이다.
// const mainRouter = require("./controller/main.js");
// app.use("/bk/", examRouter(upload));

// myPage reserve 라우터 추가
const myPageReserveRouter = require('./controller/myPageReservation.js');
app.use('/bk/myPage/myReservation', myPageReserveRouter);

// board 라우터 추가
const boardRouter = require('./controller/board.js');
app.use('/bk/board', boardRouter(upload));
// board_comment 라우터 추가
const boardCommentRouter = require('./controller/board_comment.js');
app.use('/bk/comment', boardCommentRouter(upload));
// login 라우터 추가
const loginRouter = require('./controller/login.js');
app.use('/bk/login', loginRouter(upload));
// 네이버 로그인 api
const naverLoginRouter = require('./controller/naverLogin.js');
app.use('/bk/naverLogin', naverLoginRouter());
// join 라우터 추가
const joinRouter = require('./controller/join.js');
app.use('/bk/join', joinRouter(upload));
// 본인인증 번호호
const phoneChkRouter = require('./controller/phoneChk.js');
app.use('/bk/check', phoneChkRouter());

// myPage 라우터 추가
const myPageInfoRouter = require('./controller/myPageInfo.js');
app.use('/bk/mypage', myPageInfoRouter(upload));
// specialoffer 라우터 추가
const offerRouter = require('./controller/specialOffer.js');
app.use('/bk/specialOffer', offerRouter(upload));
// reservation 라우터 추가
const reservationRouter = require('./controller/reservations.js');
app.use('/bk/reserve', reservationRouter);
const offerReserveRouter = require('./controller/reserveOffer.js');
app.use('/bk/reserve', offerReserveRouter);
// toss api 라우터 추가가
const paymentRouter = require('./controller/reservations.js');
app.use('/bk/api/payment', paymentRouter);
// myPage reserve 라우터 추가
// const myPageReserveRouter = require("./controller/myPageReservation.js");
// app.use("/bk/myPage/myReservation", myPageReserveRouter);
// admin reserve 라우터 추가
const adminReserveRouter = require('./controller/adminReserve.js');
app.use('/bk/admin/reservation', adminReserveRouter);
// admin 문의하기 라우터 추가
const adminCsRouter = require('./controller/adminCs.js');
app.use('/bk/admin/cs', adminCsRouter(upload));
// admin dashboard 라우터 추가
const adminDashboardRouter = require('./controller/adminDashboard.js');
app.use('/bk/admin/dashboard', adminDashboardRouter);
// admin memberboard 라우터 추가
const adminMemberboardRouter = require('./controller/adminMemberboard.js');
app.use('/bk/admin/member', adminMemberboardRouter());
// admin reserve 라우터 추가
const adminDetailboardRouter = require('./controller/adminMemberboard.js');
app.use('/bk/admin/member/detail', adminDetailboardRouter());

// 객실관리 라우터 추가
const roomManRouter = require('./controller/roomManagement.js');
app.use('/bk/admin/roomManagement', roomManRouter());
// 공지사항 라우터 추가
const noticeRouter = require('./controller/notice.js');
app.use('/bk/notice', noticeRouter(upload)); //업로드 객체전달 중요

// 매출현황 라우터 추가
const salesRouter = require('./controller/salesManagement.js');
app.use('/bk/sales', salesRouter());
// 아이디,비밀번호찾기 라우터 추가
const findRouter = require('./controller/find.js');
app.use('/bk/find', findRouter);

// 위에 거론하지 않은 라우팅 주소는 프론트엔드의 index.html 로 접근
// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "build", "index.html"));
// });
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.listen(5002, () => {
    console.log('5002 2차 프로젝트 DB 연결 서버 실행');
});
