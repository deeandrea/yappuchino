const { GoogleGenerativeAI } = require('@google/generative-ai');

function createAIModel({ apiKey, model, systemInstruction }) {
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model,
    systemInstruction,
  });
}

module.exports = {
  createAIModel,
};
