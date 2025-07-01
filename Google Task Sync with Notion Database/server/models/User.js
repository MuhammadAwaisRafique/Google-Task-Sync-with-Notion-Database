const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  tokens: {
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  notionConfig: {
    apiToken: String,
    databaseId: String,
    isConfigured: {
      type: Boolean,
      default: false
    }
  },
  syncSettings: {
    autoSync: {
      type: Boolean,
      default: false
    },
    syncInterval: {
      type: Number,
      default: 30 // minutes
    },
    lastSyncAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.tokens;
  delete user.notionConfig.apiToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);