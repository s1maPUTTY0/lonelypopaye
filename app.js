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

var DBusername = mongoose.model('user', usernameSchema);

//databaseへの接続
/*mongoose.connect('mongodb://192.168.33.10/database');*/
mongoose.connect('mongodb://heroku_95wqqlf8:afol64dvvrdqlvcf1i75e94j4o@ds141406.mlab.com:41406/heroku_95wqqlf8');

mongoose.connection.on( 'connected', function(){
    console.log('DBconnected.');
});

mongoose.connection.on( 'error', function(err){
    console.log( 'failed to connect a mongo db : ' + err );
});

//username登録
var UNtouroku = function(username){
    return new Promise(function(resolve, reject) {
        var UN = new DBusername();    
        UN.username = username;    
        UN.save(function(err){
            if(err) console.log(err);
            console.log(username + '登録完了');
        });
        resolve(true);
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
            console.log(userID);
            resolve([username,userID]);
        });
    });
};


io.on('connection', (socket) => {
    
    console.log('a user connected');
    //socket.io起動確認
    socket.emit('news', 'hello world');
    DBusername.find({}, function(err, result) {
        if (err) throw err
        for(var i=0;i<result.length;i++){
            console.log(result[i].username + '  85name');
            UNID(result[i].username).then(function(data){
                console.log(data[0] + '表示');
                console.log(data[1] + '表示');
                socket.emit('UNhyouji',data);
            });
        };
    });
    
    socket.on('chat message', (msg) => {
        //メッセージをクライアント全体に送信する
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    
    socket.on('userLOGIN',(username) => {
        //ユーザー名をDBに登録する（未実装）
        UNtouroku(username).then(function(){
            UNID(username).then(function(userID){
                console.log(userID[1] + '処理終わり');
                socket.emit('IDtuika',userID[1]);
                io.emit('UNtuika',userID);
            });
        });
        
        
        //ユーザーがログインした日時をコンソールに表示
        var createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log(createdAt + "  " + username + "  がログインしました"  );
    });
    
    socket.on('deleteUN',(userID) => {
        console.log(userID +'110');
        io.emit('UNsakujo',userID);
        UNdelete(userID);
    });

});

http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});