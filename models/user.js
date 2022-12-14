import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as config from '../config.js';
const Schema = mongoose.Schema;
// Define the schema for users
const userSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true
	},
	firstname: {
		type: String,
		required: true,
		minlenght: [3, "Firstname is too short"],
		maxlenght: 20
	},
	lastname: {
		type: String,
		required: true,
		minlenght: [3, "Lastname is too short"],
		maxlenght: 20
	},
	passwordHash: {
		type: String,
	},
	registrationDate: {
		type: Date,
		default: Date.now
	},
	role: {
		type: String,
		enum: ['user', 'admin'],
		default: 'user'
	}
});

// Define a virtual property for the user's password.
userSchema.virtual('password');

// Save the user's password as a hash.
userSchema.pre('save', async function () {
	if (this.password && this.password.length >= 8) {
		const passwordHash = await bcrypt.hash(this.password, config.bcryptCostFactor);
		this.passwordHash = passwordHash;
	} else {
		throw new Error("Password is too short (8 characters minimum)");
	}
});

userSchema.set("toJSON", {
	transform: transformJsonUser
});

// Set to JSON transformation to remove the password hash.
function transformJsonUser(doc, json, options) {
	// Remove the hashed password from the generated JSON.
	delete json.passwordHash;
	delete json.__v;
	json.id = json._id;
	delete json._id;
	return json;
}
// Create the model from the schema and export it
export default mongoose.model('User', userSchema);