const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
var moment = require('moment');
const mongoose = require('mongoose');
const cookie = require('js.cookie');
/*const Promise = require('bluebird');*/


const PORT = process.env.PORT || 8080/*3000*/;

//ルーティング
app.get(`/`, (req, res) => {
    res.sendFile(__dirname + '/index.html',);
});
app.get(`/note.html`, (req, res) => {
    res.sendFile(__dirname + '/note.html',);
});
//mongoose スキーマの設定
var sch = mongoose.Schema;

var usernameSchema = new sch(
    {username: String},
    {collection:'user'}
);
var join_userSchema = new sch(
    {ID: Number,username: String},
    {collection:'join_user'}
);
var Game_StatusSchema = new sch(
    {INGAME: Number,
     SPY: Number},
    {collection:'Game_Status'}
);
var Vote_ResultSchema = new sch(
    {Mission: Number,
     Round: Number,
     joinID: Number,
     Vote_Result: Number},
    {collection:'Vote_Result'}
);

var DBusername = mongoose.model('user', usernameSchema);
var DBjoin_user = mongoose.model('join_user', join_userSchema);
var DBGame_Status = mongoose.model('Game_Status',Game_StatusSchema);
var DBVote_Result = mongoose.model('Vote_Result',Vote_ResultSchema);

//databaseへの接続
/*mongoose.connect('mongodb://192.168.33.10/database');*/
mongoose.connect('mongodb://heroku_95wqqlf8:afol64dvvrdqlvcf1i75e94j4o@ds141406.mlab.com:41406/heroku_95wqqlf8');

mongoose.connection.on( 'connected', function(){
    console.log('DBconnected.');
});

mongoose.connection.on( 'error', function(err){
    console.log( 'failed to connect a mongo db : ' + err );
});
//================LOGIN====================
//username登録
var UNtouroku = function(username){
    return new Promise(function(resolve, reject) {
        var UN = new DBusername();    
        UN.username = username;    
        UN.save(function(err){
            if(err) console.log(err);
            console.log(username + '登録完了');
            resolve(true);
        });
    });
}; 
//username削除
var UNdelete = function(userID){
    DBusername.remove({_id: userID},function(err){
        if(err) console.log(err);
        console.log(userID + '削除完了');
    });  
};

var UNID = function(username){
    var userID;
    return new Promise(function(resolve, reject) {
        DBusername.find({username: username},function(err,docs){
            if(err) console.log(err);
            console.log(docs[0]);
            userID = docs[0]._id;
            resolve([username,userID]);
        });
    });
};
//================JOIN====================
//username登録
var JOINUNtouroku = function(data){
    return new Promise(function(resolve, reject) {
        var UN = new DBjoin_user();    
        UN.username = data;
        UN.save(function(err){
            if(err) console.log(err);
            console.log(data + '登録完了');
            resolve(true);
        });
    });
}; 

//username削除
var JOINUNdelete = function(userID){
    return new Promise(function(resolve, reject) {
        if(userID != null){
            DBjoin_user.remove({_id: userID},function(err){
                if(err) console.log(err);
                console.log(userID + '削除完了:JOIN');
                resolve(true);
            });
        } else {
            DBjoin_user.remove({},function(err){
                if(err) console.log(err);
                console.log(userID + '全削除完了:JOIN');
                resolve(true);
            });
        }
            
    });
};

var JOINUNID = function(data){
    var UN,
        joinID;
    return new Promise(function(resolve, reject) {
        DBjoin_user.find({username: data},function(err,docs){
            if(err) console.log(err);
            console.log(docs[0]);
            UN = docs[0].username;
            joinID = docs[0]._id;
            resolve([UN,joinID]);
        });
    });
};
//================Game_Status====================
var INGAME = function(ingame){
    return new Promise(function(resolve, reject) {
        var INGame = new DBGame_Status();
        INGame.INGAME = ingame;
        INGame.save(function(err){
            if(err) throw err;
            console.log('INGAME...');
            resolve ();
        });
    });
};
var SPY = function(spy){
    return new Promise(function(resolve, reject) {
        DBGame_Status.update(
            {INGAME:1},{$set:{SPY: spy}},
            {upsert: false, multi: true},
            function(err){            
                if(err) throw err;
                console.log('SPY人数を保存しました'+spy+'人');
                resolve ();
        });
    });
};
var GS_find = function(){
    return new Promise(function(resolve, reject) {
        DBGame_Status.find({},function(err,docs){
            console.log(docs[0] + 'ゲームステータスを読み込みました');
            resolve(docs[0]);
        });
    });
};



io.on('connection', (socket) => {
    
    console.log('a user connected');
    //socket.io起動確認
    socket.emit('news', 'hello world');
    DBusername.find({}, (err, result) => {
        if (err) throw err
        socket.emit('UNhyouji',result);
        socket.emit('SPY_Redisplay');
    });
    DBjoin_user.find({}, (err, result) => {
        if (err) throw err;
        socket.emit('join_count', result.length); 
        socket.emit('JOINhyouji',result);
    });
    //================メインゲーム====================
    socket.on('join', (data) => {
        var UNID = data.username;
        JOINUNtouroku(UNID).then((i) => {
            if(i){
                JOINUNID(UNID).then((finddata) => {
                    socket.emit('JOINIDtuika',finddata[1]);
                    console.log(finddata[1] + 'JOINID追加');
                    io.emit('JOINUNtuika',{username:finddata[0],joinID:finddata[1]});
                });
                DBjoin_user.find({}, function(err, result) {
                    if (err) throw err
                    io.emit('join_count', result.length);
                });
            }            
        });        
    });
    socket.on('exit', (data) => {
        socket.emit('JOINUNsakujo',data.joinID);
        JOINUNdelete(data.joinID).then((i) => {
            DBjoin_user.find({}, function(err, result) {
                if (err) throw err
                io.emit('join_count', result.length);
            });
        });
    });
    socket.on('Roll_Create', (Game_Status) => {
        var GS = {};
        var promise = Promise.resolve();
        promise
            .then(() => {
                return new Promise(function(resolve, reject) {
                    INGAME(1).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    SPY(Game_Status).then((Game_Status) => {
                        resolve(Game_Status);
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    GS_find(Game_Status).then((Game_Status) => {
                        resolve(Game_Status);
                    });
                });
            })
            .then((Game_Status) => {
                console.log(Game_Status + 'ゲームステータス');
                io.emit('Game_Status',Game_Status);
                DBjoin_user.find({}, function(err, result) {
                    result.sort(function() {
                        return Math.random() - Math.random();
                    });
                    for(var i=0;i<result.length;i++){
                        console.log(result[i]);
                    };
                    console.log(result);
                    io.emit('Roll', result);
                });
            });
     });
    socket.on('Reset_All',() => {
        io.emit('Roll_Reset');
        io.emit('Reset')
        JOINUNdelete().then((i) => {
            DBjoin_user.find({}, function(err, result) {
                if (err) throw err
                io.emit('join_count', result.length);
            });
        });
    });
    
    //================チャット====================
    socket.on('chat message', (msg) => {
        //メッセージをクライアント全体に送信する
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    //================ログイン====================
    socket.on('userLOGIN',(username) => {
        //ユーザー名をDBに登録する（未実装）
        UNtouroku(username).then((i) => {
            if(i){
                UNID(username).then((userID) => {
                    console.log(userID[1] + '処理終わり');
                    socket.emit('IDtuika',userID[1]);
                    io.emit('UNtuika',userID);
                });
            }                  
        });
        //ユーザーがログインした日時をコンソールに表示
        var createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log(createdAt + "  " + username + "  がログインしました"  );
    });
    
    socket.on('deleteUN',(userID) => {
        io.emit('UNsakujo',userID);
        UNdelete(userID);
    });

});

http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});