var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var chatSchema = new Schema( {
    
    _roomid: {type: String, ref: 'chatRoom' },
    sender: { userCode: String, profileImg: String, userName: String },
    receiver: { userCode: String, profileImg: String, userName: String },
    contents: {type: String, require: true },
    isRead: {type: Boolean},
    createdAt: {type: Date, default: Date.now }

});

module.exports = mongoose.model('Chat', chatSchema);