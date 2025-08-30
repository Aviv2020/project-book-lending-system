const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  id: {type: Number, required: true},
  title: { type: String }, // שם הכתובת
  lat: { type: Number }, //קורדינטת רוחב
  lng: { type: Number } //קורדינטת אורך 
}, {
  timestamps: true // מוסיף createdAt, updatedAt
});

module.exports = mongoose.model('Address', addressSchema, 'address');
