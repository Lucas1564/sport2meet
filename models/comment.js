//create Schema
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define a schema for comment
const commentSchema = new Schema({
	content: {
		type: String,
		required: true,
		minlenght: [2, "Content is too short"],
		maxlenght: 400
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	conversation: {
		type: Schema.Types.ObjectId,
		ref: 'Conversation',
		required: true,
	},
	date: {
		type: Date,
		default: Date.now
	}
});

//create model
export default mongoose.model('Comment', commentSchema);