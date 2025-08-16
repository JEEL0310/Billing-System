const mongoose = require('mongoose');
const Settings = require('./Settings'); // Imported Settings model
const BoxSchema = new mongoose.Schema({
  boxNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  descriptionOfGoods: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: async function(value) {
        const settings = await Settings.getSettings();
        return settings.itemConfigurations.some(
          item => item.description === value
        );
      },
      message: 'Description must be from predefined settings'
    }
  },
  grossWeight: {
    type: Number,
    required: true,
    min: 0,
  },
  tareWeight: {
    type: Number,
    required: true,
    min: 0,
  },
  netWeight: {
    type: Number,
    required: true,
    min: 0,
  },
  cops: {
    type: Number,
    required: true,
    min: 0,
  },
  grade: {
    type: String,
    trim: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to calculate net weight
BoxSchema.pre('save', function(next) {
  this.netWeight = this.grossWeight - this.tareWeight;
  this.netWeight = parseFloat(this.netWeight.toFixed(2));
  this.updatedAt = Date.now();
  next();
});

// In models/Box.js, add indexes for better performance
BoxSchema.index({ descriptionOfGoods: 1, isUsed: 1 });
BoxSchema.index({ boxNumber: 1 }, { unique: true });

// Add validation for box number format
BoxSchema.path('boxNumber').validate(function(value) {
  return /^[A-Za-z0-9\-]+$/.test(value);
}, 'Invalid box number format');

module.exports = mongoose.model('Box', BoxSchema);