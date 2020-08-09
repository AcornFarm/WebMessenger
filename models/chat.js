var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var chatSchema = new Schema( {
    
    _roomid: {type: String, ref: 'chatRoom' },
    sender: {type: String},
    receiver: {type: String},
    contents: {type: String, require: true },
    isRead: {type: Boolean},
    createdAt: {type: Date, default: Date.now }

});

module.exports = mongoose.model('Chat', chatSchema);