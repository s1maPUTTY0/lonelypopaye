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
var LeaderSchema = new sch(
    {ID: Number,username: String},
    {collection:'Leader'}
);
var Game_StatusSchema = new sch(
    {INGAME: Number,
     SPY: Number,
     Mission: Number,
     Round: Number,
     Leader: Number},
    {collection:'Game_Status'}
);
var Vote_ResultSchema = new sch(
    {Mission: Number,
     Round: Number,
     joinID: String,
     Vote_Result: Number},
    {collection:'Vote_Result'}
);
var Mission_ResultSchema = new sch(
    {Mission: Number,
     Mission_Result: String,
     SPY: Number},
    {collection:'Mission_Result'}
);
var Mission_SFSchema = new sch(
    {Mission: Number,
     joinID: String,
     SF: Number,
     PointS: Number,
     PointR: Number},
    {collection:'Mission_SF'}
);

var DBusername = mongoose.model('user', usernameSchema);
var DBjoin_user = mongoose.model('join_user', join_userSchema);
var DBLeader = mongoose.model('Leader', LeaderSchema);
var DBGame_Status = mongoose.model('Game_Status',Game_StatusSchema);
var DBVote_Result = mongoose.model('Vote_Result',Vote_ResultSchema);
var DBMission_Result = mongoose.model('Mission_Result',Mission_ResultSchema);
var DBMission_SF = mongoose.model('Mission_SF',Mission_SFSchema);

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
            resolve();
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
//================Leader====================
var Leadertouroku = function(data){
    return new Promise(function(resolve, reject) {
            var Leader = new DBLeader();    
            Leader.username = data.username;
            Leader._id = data._id;
            Leader.save(function(err){
                if(err) console.log(err);
                console.log(Leader + 'リーダー登録完了');
                resolve();
            });
    });
};
var Delete_Leader = function(){
    DBLeader.remove({},(err) => {
        if(err) console.log(err);
        console.log('Leader削除完了');
    });
}
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
var SPY_SET = function(spy){
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
var Mission_SET = function(Mission){
    return new Promise(function(resolve, reject) {
        DBGame_Status.update(
            {INGAME:1},{$set:{Mission: Mission}},
            {upsert: false, multi: true},
            function(err){            
                if(err) throw err;
                console.log('Missionセット完了' + Mission);
                resolve ();
        });
    });
};
var Round_SET = function(Round){
    return new Promise(function(resolve, reject) {
        DBGame_Status.update(
            {INGAME:1},{$set:{Round: Round}},
            {upsert: false, multi: true},
            function(err){            
                if(err) throw err;
                console.log('Roundセット完了' + Round);
                resolve ();
        });
    });
};
var Leader_SET = function(Leader){
    return new Promise(function(resolve, reject) {
        DBGame_Status.update(
            {INGAME:1},{$set:{Leader: Leader}},
            {upsert: false, multi: true},
            function(err){            
                if(err) throw err;
                console.log('Leaderセット完了' + Leader);
                resolve ();
        });
    });
};
var GS_find = function(){
    return new Promise(function(resolve, reject) {
        DBGame_Status.find({},function(err,docs){
            console.log('ゲームステータスを読み込みました');
            resolve(docs[0]);
        });
    });
};
var Reset_Game_Status = function(){
    DBGame_Status.remove({},(err) => {
        if(err) console.log(err);
        console.log('Game_Status削除完了');
    });
};

//================Vote===================
var Vote_SET = function(Vote){
    return new Promise(function(resolve, reject) {
        var Vote_Result = new DBVote_Result();
        Vote_Result.Mission = Vote.Mission;
        Vote_Result.Round = Vote.Round;
        Vote_Result.joinID = Vote.joinID;
        Vote_Result.Vote_Result = Vote.Vote_Result;
        Vote_Result.save(function(err){
            if(err) throw err;
            console.log('投票結果を保存しました');
            resolve ();
        });
    });
};
var Vote_find = function(){
    return new Promise(function(resolve, reject) {
        DBVote_Result.find({},function(err,docs){
            console.log('投票結果を読み込みました');
            resolve(docs);
        });
    });
};
var Delete_Vote_Result = function(){
    DBVote_Result.remove({},(err) => {
        if(err) console.log(err);
        console.log('Vote_Result削除完了');
    });
};
//================Mission_Result===================
var Mission_Result_SET = function(MR){
    return new Promise(function(resolve, reject) {
        var Mission_Result = new DBMission_Result();
        Mission_Result.Mission = MR.Mission;
        Mission_Result.Mission_Result = MR.Mission_Result;
        Mission_Result.SPY = MR.SPY;
        Mission_Result.save(function(err){
            if(err) throw err;
            console.log('ミッション結果を保存しました');
            resolve ();
        });
    });
};
var MR_find = function(){
    return new Promise(function(resolve, reject) {
        DBMission_Result.find({},function(err,docs){
            console.log('ミッション結果を読み込みました');
            resolve(docs);
        });
    });
};
var Delete_Mission_Result = function(){
    DBMission_Result.remove({},(err) => {
        if(err) console.log(err);
        console.log('Mission_Result削除完了');
    });
};
//================Vote===================
var MSF_SET = function(MSF){
    return new Promise(function(resolve, reject) {
        var Mission_SF = new DBMission_SF();
        Mission_SF.Mission = MSF.Mission;
        Mission_SF.joinID = MSF.joinID;
        Mission_SF.SF = MSF.SF;
        Mission_SF.PointS = MSF.PointS;
        Mission_SF.PointR = MSF.PointR;
        Mission_SF.save(function(err){
            if(err) throw err;
            console.log('ミッション成功失敗を保存しました');
            resolve ();
        });
    });
};
var MSF_find = function(){
    return new Promise(function(resolve, reject) {
        DBMission_SF.find({},function(err,docs){
            console.log('ミッション成功失敗を読み込みました');
            resolve(docs);
        });
    });
};
var Delete_MSF = function(){
    DBMission_SF.remove({},(err) => {
        if(err) console.log(err);
        console.log('Mission_SF削除完了');
    });
};

io.on('connection', (socket) => {
    
    console.log('a user connected');
    //socket.io起動確認
    socket.emit('news', 'hello world');
    socket.on('Timer',() => {
        io.emit('Timer');
    });
    DBusername.find({}, (err, result) => {
        if (err) throw err
        socket.emit('UNhyouji',result);
    });
    GS_find().then((GS) => {
        if(GS == null){
            DBjoin_user.find({}, (err, result) => {
            if (err) throw err;
            socket.emit('join_count', result.length); 
            socket.emit('JOINhyouji',result);
            socket.emit('SPY_Redisplay');
            });            
        } else {
            DBLeader.find({}, (err, result) => {
            if (err) throw err;
            socket.emit('join_count', result.length); 
            socket.emit('JOINhyouji',result);
            socket.emit('SPY_Redisplay');
            });
            socket.emit('game_status_display',GS);
            DBVote_Result.find({},(err, Vote_Result) => {
            if (err) throw err;
            socket.emit('Vote_redisplay',Vote_Result);
            });
            DBMission_Result.find({},(err, MR) => {
            if(err) throw err;
            socket.emit('MR_display',MR);
            });
        }
    })
        
    //================メインゲーム====================
    socket.on('join', (data) => {
        var UNID = data.username;
        JOINUNtouroku(UNID).then(() => {
            JOINUNID(UNID).then((finddata) => {
                socket.emit('JOINIDtuika',finddata[1]);
                console.log(finddata[1] + 'JOINID追加');
                io.emit('JOINUNtuika',{username:finddata[0],joinID:finddata[1]});
            });
            DBjoin_user.find({}, function(err, result) {
                if (err) throw err
                io.emit('join_count', result.length);
            });          
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
    socket.on('Roll_Create', (GSobj) => {
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
                    SPY_SET(GSobj.SPY).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    Mission_SET(GSobj.Mission).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    Round_SET(GSobj.Round).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    Leader_SET(GSobj.Leader).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    GS_find().then((Game_Status) => {
                        resolve(Game_Status);
                    });
                });
            })
            .then((Game_Status) => { //Game_StatusはGame_Status(DB)の配列
                console.log('ゲームステータスを取得完了');
                io.emit('Game_Status',Game_Status);
                DBjoin_user.find({}, function(err, result) {
                    return new Promise(function(resolve, reject) {
                        result.sort(function() {
                            return Math.random() - Math.random();
                        });
                        console.log(result + 'Rollリザルト');

                        io.emit('Roll', result);
                        resolve();
                    });
                })
                .then(() => {
                    DBjoin_user.find({}, function(err, result) {
                        result.sort(function() {
                            return Math.random() - Math.random();
                        });
                        for(var i=0;i<result.length;i++){
                            Leadertouroku(result[i]);
                        };
                        console.log(result + 'Leaderリザルト');

                        io.emit('Leader', result);
                    
                    });
                });
            });
     });
    socket.on('Smember_emit',(Smember) => {
        console.log(Smember + '選出メンバーを受信しました。')
        socket.broadcast.emit('Smember_display',Smember);
    });
    socket.on('Vote',(Vote) => {
        console.log(Vote + '投票結果を受信しました。')
        Vote_SET(Vote).then(() => {
            DBVote_Result.find({},(err,Vote_Result) => {
                if(Vote_Result.length % Vote.join_count == 0){
                    io.emit('Vote_display',Vote_Result);
                    console.log('投票結果を送信しました');
                }
            });
        });
    });
    //ミッション成否
    socket.on('MSF',(MSF) => {
        console.log('ミッション成功失敗を受信しました');
        var AllMSF = 0;
        var AllPointS = 0;
        var AllPointR = 0;
        var MR;
        MSF_SET(MSF).then(() => {
            MSF_find().then((Mission_SF) => {
                if(Mission_SF.length % MSF.Smember == 0){
                    console.log('ミッションSF集計完了');
                    socket.emit('Mission_Move');
                    for(var i=0;i < Mission_SF.length;i++){
                        AllMSF += Mission_SF[i].SF
                        AllPointS += Mission_SF[i].PointS;
                        AllPointR += Mission_SF[i].PointR;
                        if(i==Mission_SF.length-1){
                            if(AllMSF<1){
                                MR = '小松菜';
                                Mission_SF[i].PointR ++;
                                console.log('結果は小松菜');
                            } else if(AllMSF == 1 && Mission_SF.Mission == 4){
                                MR = '小松菜';
                                Mission_SF[i].PointR ++;
                                console.log('結果は小松菜');
                            } else {
                                MR = 'ポパイ';
                                Mission_SF[i].PointS ++;
                                console.log('結果はポパイが含まれた');
                            }
                            AllPointS += Mission_SF[i].PointS;
                            AllPointR += Mission_SF[i].PointR;
                            var MRobj = {Mission: MSF.Mission,
                                         Mission_Result: MR,
                                         SPY: AllMSF,
                                         PointS: AllPointS,
                                         PointR: AllPointR}
                            Mission_Result_SET(MRobj).then(() => {
                                MR_find().then((MR) => {
                                        io.emit('MR_display',MR);
                                        console.log('ミッション結果を送信しました');
                                        console.log(MRobj.PointS+'スパイ結果');
                                        console.log(MRobj.PointR+'レジ結果');
                                });
                            });
                        }
                    }
                }
            });
        });
    });
    socket.on('Mission_Result',(MRobj) => {
        Mission_Result_SET(MRobj).then(() => {
            MR_find().then((MR) => {
                    socket.emit('MR_display',MR);
                    console.log('ミッション結果を送信しました');
            });
        });
    });
    socket.on('GS_Update',(GSobj) => {
        var promise = Promise.resolve();
        promise
            .then(() => {
                return new Promise(function(resolve, reject) {
                    Mission_SET(GSobj.Mission).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    Round_SET(GSobj.Round).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    Leader_SET(GSobj.Leader).then(() => {
                        resolve();
                    });
                });
            })
            .then(() => {
                return new Promise(function(resolve, reject) {
                    GS_find().then((GS) => {
                        socket.emit('game_status_display',GS);
                        DBLeader.find({}, (err, result) => {
                        if (err) throw err;
                            socket.emit('JOINhyouji',result);
                            socket.emit('SPY_Redisplay');
                            DBVote_Result.find({},(err, Vote_Result) => {
                            if (err) throw err;
                                socket.emit('Vote_redisplay',Vote_Result);
                                console.log('投票結果再表示');
                            });
                        });
                        resolve();
                    });
                });
            });
    });
    socket.on('Reset_All',() => {
        io.emit('Roll_Reset');
        io.emit('Reset')
        Reset_Game_Status();
        Delete_Leader();
        Delete_Vote_Result();
        Delete_Mission_Result();
        Delete_MSF();
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