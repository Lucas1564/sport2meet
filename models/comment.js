//create Schema
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define a schema for comment
const commentSchema = new Schema({
	content : {
		type : String,
		required : true,
		minlenght : [2, "Content is too short"],
		maxlenght : 100
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	// activity : {
	// 	type : Schema.Type.ObjectId(),
	// 	ref : 'Activity'
	// },
	date : { type: Date, default: Date.now  }
});

//create model
export default mongoose.model('Comment',commentSchema);