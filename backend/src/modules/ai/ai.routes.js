const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const { protect } = require('../../middleware/auth.middleware');

router.get('/predict/fuel', protect, aiController.getFuelPrediction);
router.get('/predict/aqi', protect, aiController.getAQIPrediction);
router.get('/predict/traffic', protect, aiController.getTrafficPrediction);

router.post('/chat', protect, aiController.askAssistant);

router.get('/risk-score', protect, aiController.getRiskScore);
router.post('/verify-alert', protect, aiController.verifyAlertData);

module.exports = router;
