const aiService = require('./ai.service');
const { sendResponse } = require('../../utils/apiResponse');

exports.getFuelPrediction = async (req, res, next) => {
    try {
        const { stateCode } = req.query;
        const data = await aiService.predictFuelTrend(stateCode || 'MH');
        sendResponse(res, 200, true, 'Fuel trend prediction fetched', data);
    } catch (err) { next(err); }
};

exports.getAQIPrediction = async (req, res, next) => {
    try {
        const { city } = req.query;
        const data = await aiService.predictAQI(city || 'Delhi');
        sendResponse(res, 200, true, 'AQI prediction fetched', data);
    } catch (err) { next(err); }
};

exports.getTrafficPrediction = async (req, res, next) => {
    try {
        const { city, lat, lng } = req.query;
        const data = await aiService.predictTraffic(city, parseFloat(lat) || 0, parseFloat(lng) || 0);
        sendResponse(res, 200, true, 'Traffic prediction fetched', data);
    } catch (err) { next(err); }
};

exports.askAssistant = async (req, res, next) => {
    try {
        const { message, context } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }
        const data = await aiService.chatAssistant(message, context);
        sendResponse(res, 200, true, 'Chat response generated', data);
    } catch (err) { next(err); }
};

exports.getRiskScore = async (req, res, next) => {
    try {
        const { district, lat, lng } = req.query;
        const data = await aiService.analyzeRiskScore(district, parseFloat(lat) || 0, parseFloat(lng) || 0);
        sendResponse(res, 200, true, 'Risk score generated', data);
    } catch (err) { next(err); }
};

exports.verifyAlertData = async (req, res, next) => {
    try {
        const alertData = req.body;
        const data = await aiService.verifyAlert(alertData);
        sendResponse(res, 200, true, 'Alert verified', data);
    } catch (err) { next(err); }
};
