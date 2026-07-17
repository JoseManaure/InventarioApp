const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: [
      'admin',
      'vendedor',
      'contador',
      'publico'
    ],
    default: 'publico'
  },
  plan: {
    type: String,
    enum: ["trial", "monthly"],
    default: "trial"
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Empresa",
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },

  trialEndsAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);