var express = require('express');					// express module
var app = express();								// initialize express app
var server = require('http').createServer(app);		// create http server
var io = require('socket.io')(server);				// using socket.io in server
var formidable = require('formidable');				// file upload module
var md = require("node-markdown").Markdown;			// markdown module
var mongoose = require('mongoose');					//mongodb connect
//var route = require('./route.js');					//Api위한 router 설정
var bodyParser =require('body-parser');
var cors = require('cors');


// Static file configuration
app.use(express.static('public/js'));			// import all files in js directory
app.use(express.static('public/css'));			// import all files in css directory
app.use(express.static('public/uploads'));		// import all files in uploads directory
app.use(bodyParser.json());						//json으로 넘겨주기위해
app.use(bodyParser.urlencoded({ extended: true})); //qs모듈로 QueryString parsing
app.use(cors());


var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){

	//Connected to mongo server
	console.log("connected to mongo server");

});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

var databaseUrl = 'mongodb://WIN98:WIN98@localhost:27017/';

function mogooseConnecting () {
	mongoose.connect(databaseUrl,{ dbName: 'VIG' }, function(err, db) {
		
		if( err ){
			console.log(`===> Error connecting to ${db}`);
			console.log(`Reason: ${err}`);

		}else{

			console.log(`===> succeeded in connecting to ${db}`);
		}

	});

}

mogooseConnecting ();
mongoose.connection.on('disconnected', () => {
	console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도 합니다.');
	mogooseConnecting ();
});

var ChatRoom = require('./models/chatRoom');
var Chat = require('./models/chat');

// Server listen on port 3000
server.listen(3000);

// Variables
var messages = [];			// store messages
var socketIds = {};			//socket id들

// On client connect
io.on('connection', function(socket){

	socket.on('setSocketId', function(userName){
		console.log("setSocketId");
		var username=userName;
		console.log("data"+username);
		socketIds[username] = socket.id;
		console.log(socketIds);

	})

		console.log("Client connected...");
		console.log("소켓아이디"+socket.id);

		console.log(socketIds);


	// Print chat history
	messages.forEach(function(msgContent){
		socket.emit('send message', msgContent);
	});

	var msgContent;
	var roomId;

	// Sent/Receive chat messages
	socket.on('send message', function(message, selectuser){
		console.log("send message");
		username = socket.username;
		msgContent = msgFormat(username, message);
		socket.emit('send message', msgContent); //나한테도 전송
		socket.to(socketIds[selectuser]).emit('send message', msgContent); //남한테도 전송
		console.log(msgContent);

	});


	socket.on('join', function(roomId, selectuser){
		console.log("join");
		console.log(roomId);
		console.log(selectuser);
		socket.roomId = roomId;
		socket.join(roomId);

	})

	// chatting Room 만드는 코드
	socket.on('createChat', function(username, selectuser){
		
		console.log("createChat");
		console.log(username);
		socket.selectuser = selectuser;
		console.log(selectuser);
		socket.name = username;
		
		var chatRoom = new ChatRoom({
			userCodes: [username, selectuser],
		});
		chatRoom.save(function(err, result){

			if(err){

				console.log(err);
	 
				return;
	 
		   }
		   
		   console.log(ChatRoom);

		});
		socket.emit('add user', username);
		socket.broadcast.emit('add user', username);
	});

	socket.on('remove', function(){
		socket.emit('remove user', socket.username);
		socket.broadcast.emit('remove user', socket.username);
		removeUser(socket.username);
	})

	// Remove user when disconnect
	socket.on('disconnect', function(username){
		socket.leave();
		console.log(username+"user disconnected");
	});

});

// Connect to index.html
app.get('/', function(request, response){
	response.sendFile(__dirname + '/public/index.html');
});

// Upload
app.post('/api/uploadImage',function (req, res){
	var imgdatetimenow = Date.now();
	var form = new formidable.IncomingForm({
      	uploadDir: __dirname + '/public/uploads',
      	keepExtensions: true
	});

	form.on('end', function() {
      res.end();
    });
    
    form.parse(req,function(err,fields,files){
		var data = { 
				username : fields.username, 
				serverfilename : baseName(files.attached.path), 
				filename : files.attached.name,
				size : bytesToSize(files.attached.size)
		};
	    var msgContent = imgFormat(data.username ,data.serverfilename);
		io.sockets.emit('send message', msgContent);
		
    });
});

//list불러오기
app.get('/chat/getChatList/:userCode', function(req, res, err) {
	console.log("/chat/getChatList/");
	console.log(req.params.userCode);
	ChatRoom.find({userCodes: req.params.userCode}, function(err, roomList){

		if(err) {
			console.err(err);
			throw err;
		}
		console.log(roomList);
		res.set({'access-control-allow-origin':'*'});
		res.status(200).send(roomList);

	});
});

app.get('/chat/getChat/:roomId', function(req, res, err) {
	console.log("/chat/getChat/");
	console.log(req.params.roomId);
	Chat.find({roomId: req.params.roomId}, function(err, messages){

		if(err) {
			console.error(err);
			throw err;
		}
		console.log(messages);
		res.set({'access-control-allow-origin':'*'});
		res.status(200).send(messages);

	});
});





// Message format
var msgFormat = function(author, msg){
	var content = "<div class='media'><div class='media-left'><span class='author' style='font-weight: bold; color: black;'>" + author + "</span></div><div class='media-body'><span class='msg-body'>" + md(msg) + "</span></div></div>";
	return content;
}

// Image format
var imgFormat = function(author, imgPath){
	var content = "<div class='media'><div class='media-left'><span class='author' style='font-weight: bold; color: black;'>" + author + "</span></div><div class='media-body'><img src='"+imgPath+"' height='150'></img></div></div>";
	return content;
}

var userFormat = function(result) {


}

// Size Conversion
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i]; 
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

//get file name from server file path
function baseName(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1);  
   console.log(base);   
   return base;
}


