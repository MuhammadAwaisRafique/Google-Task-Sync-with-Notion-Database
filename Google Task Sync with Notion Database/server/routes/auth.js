const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const notionService = require('../services/notionService');

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Auth routes are working',
    endpoints: [
      'GET /api/auth/google',
      'GET /api/auth/google/callback',
      'POST /api/auth/notion-config',
      'GET /api/auth/me',
      'POST /api/auth/test-notion',
      'GET /api/auth/test-notion'
    ]
  });
});

// Generate Google OAuth URL
router.get('/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/tasks'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ url });
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Find or create user
    let user = await User.findOne({ googleId: userInfo.id });
    
    if (!user) {
      user = new User({
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date)
        }
      });
    } else {
      // Update tokens
      user.tokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || user.tokens.refreshToken,
        expiryDate: new Date(tokens.expiry_date)
      };
    }

    await user.save();

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to client with token
    res.redirect(`${process.env.CLIENT_URL}?token=${jwtToken}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
});

// Test Notion connection (GET endpoint for browser testing)
router.get('/test-notion', (req, res) => {
  res.json({
    message: 'Notion test endpoint is working. Use POST /api/auth/test-notion with your credentials to test the connection.',
    method: 'POST',
    body: {
      apiToken: 'secret_ntn_13744646545ZYeFs1XCmbN9ucbAomsepjzr4YCt5YRu3xX',
      databaseId: '2223333ea991800a8db3fb655d429915'
    }
  });
});

// Test Notion connection (for debugging)
router.post('/test-notion', authenticateToken, async (req, res) => {
  try {
    const { apiToken, databaseId } = req.body;

    if (!apiToken || !databaseId) {
      return res.status(400).json({
        error: { message: 'API token and database ID are required' }
      });
    }

    console.log('Testing Notion connection...');
    
    try {
      const isValid = await notionService.validateConfig(apiToken.trim(), databaseId.trim());
      
      if (isValid) {
        res.json({
          success: true,
          message: 'Notion connection successful!'
        });
      } else {
        res.status(400).json({
          error: { message: 'Notion validation failed' }
        });
      }
    } catch (validationError) {
      res.status(400).json({
        error: { message: validationError.message }
      });
    }
  } catch (error) {
    console.error('Test Notion error:', error);
    res.status(500).json({
      error: { message: 'Failed to test Notion connection' }
    });
  }
});

// Update Notion configuration
router.post('/notion-config', authenticateToken, async (req, res) => {
  try {
    const { apiToken, databaseId } = req.body;
    const userId = req.user.userId;

    console.log('Received Notion config request:', { 
      hasApiToken: !!apiToken, 
      hasDatabaseId: !!databaseId,
      databaseIdLength: databaseId?.length 
    });

    if (!apiToken || !databaseId) {
      return res.status(400).json({
        error: { message: 'API token and database ID are required' }
      });
    }

    // Trim whitespace from inputs
    const trimmedApiToken = apiToken.trim();
    const trimmedDatabaseId = databaseId.trim();

    if (!trimmedApiToken || !trimmedDatabaseId) {
      return res.status(400).json({
        error: { message: 'API token and database ID cannot be empty' }
      });
    }

    // Validate Notion API token and database ID
    try {
      const isValid = await notionService.validateConfig(trimmedApiToken, trimmedDatabaseId);
      
      if (!isValid) {
        return res.status(400).json({
          error: { message: 'Invalid Notion API token or database ID' }
        });
      }
    } catch (validationError) {
      console.error('Notion validation failed:', validationError.message);
      return res.status(400).json({
        error: { message: validationError.message }
      });
    }

    const user = await User.findById(userId);
    user.notionConfig = {
      apiToken: trimmedApiToken,
      databaseId: trimmedDatabaseId,
      isConfigured: true
    };

    await user.save();

    res.json({
      message: 'Notion configuration updated successfully',
      isConfigured: true
    });
  } catch (error) {
    console.error('Notion config error:', error);
    res.status(500).json({
      error: { message: 'Failed to update Notion configuration' }
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    res.json({
      user: {
        ...user.toJSON(),
        notionConfigured: user.notionConfig.isConfigured
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: { message: 'Failed to get user information' }
    });
  }
});

module.exports = router;