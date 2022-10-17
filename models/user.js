import mongoose from 'mongoose';
const Schema = mongoose.Schema;
// Define the schema for users
const userSchema = new Schema({
    email: {
		type : String,
		required : true,
		unique : true
	},
    firstname: {
		type : String,
		required : true,
		minlenght : [3, "Firstname is too short"],
		maxlenght : 20
	},
	lastname: {
		type : String,
		required : true,
		minlenght : [3, "Lastname is too short"],
		maxlenght : 20
	},
	password: {
		type : String,
		required : true,
		minlenght : [8, "Password is too short"],
		maxlenght : 20
	},
    registrationDate: { 
		type: Date, 
		default: Date.now 
    }
});
// Create the model from the schema and export it
export default mongoose.model('User', userSchema);
