const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
var moment = require('moment');
const mongoose = require('mongoose');
const cookie = require('js.cookie');

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
    var UN = new DBusername();
        
    UN.username = username;
        
    UN.save(function(err){
        if(err) console.log(err);
        console.log(username + '登録完了');
    });

}; 

//username削除
var UNdelete = function(username){
    DBusername.remove({username: username},function(err){
        if(err) console.log(err);
        console.log(username + '削除完了');
    });  
};


io.on('connection', (socket) => {
    
    console.log('a user connected');
    
    socket.emit('news', 'hello world');
    DBusername.find({}, function(err, result) {
        if (err) throw err;
        for(var i=0;i<result.length;i++){
            console.log(result[i].username);
            socket.emit('UNhyouji',result[i].username);
        };
    });
    
    socket.on('chat message', (msg) => {
        //メッセージをクライアント全体に送信する
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    
    socket.on('username',(username) => {
        //ユーザー名をDBに登録する（未実装）
        UNtouroku(username);        
        io.emit('UNtuika',username);
        //ユーザーがログインした日時をコンソールに表示
        var createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log(createdAt + "  " + username + "  がログインしました"  );
    });
    
    socket.on('deleteUN',(UN) => {
        io.emit('UNsakujo',UN);
        UNdelete(UN);
    });

});

http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});