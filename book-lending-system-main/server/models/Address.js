const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  title: { type: String }, // שם הכתובת
  lat: { type: Number, required: true }, //קורדינטת רוחב
  lng: { type: Number, required: true } //קורדינטת אורך 
}, {
  timestamps: true // מוסיף createdAt, updatedAt
});

module.exports = mongoose.model('Address', addressSchema, 'address');
