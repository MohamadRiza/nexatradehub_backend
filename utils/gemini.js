const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load Gemini client with key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Correct model name
const MODEL_NAME = "gemini-1.5-flash";

// ------------------------------------------------------
// Generate product description
// ------------------------------------------------------

exports.generateProductDescription = async (name, category, price, stock) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
      You are a professional e-commerce copywriter in Sri Lanka.
      Write a concise product description (max 150 words) for:
      - Name: ${name}
      - Category: ${category}
      Do NOT include price or stock. Make it friendly and appealing.
    `;

    const result = await model.generateContent([prompt]);
    return result.response.text().trim();

  } catch (error) {
    console.error("Gemini description error:", error);
    throw new Error("Failed to generate description");
  }
};

// ------------------------------------------------------
// Chatbot query handler
// ------------------------------------------------------

exports.handleCustomerQuery = async (userMessage, Product) => {
  try {
    const productKeywords = ["available", "have", "stock", "price", "product", "sell", "cost"];
    const isProductQuery = productKeywords.some(kw =>
      userMessage.toLowerCase().includes(kw)
    );

    // ---------------------
    // 1️⃣ TRY TO EXTRACT PRODUCT NAME
    // ---------------------
    if (isProductQuery) {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const extractionPrompt = `
        Extract only the product name from this message.
        If no product is mentioned, return "none".
        Message: "${userMessage}"
      `;

      const extraction = await model.generateContent([extractionPrompt]);
      let productName = extraction.response.text().trim();

      if (productName.toLowerCase() !== "none") {
        const products = await Product.find({
          name: { $regex: productName, $options: "i" }
        }).limit(3);

        if (products.length > 0) {
          let reply = `I found ${products.length} matching product(s):\n\n`;

          products.forEach(p => {
            reply += `🔹 **${p.name}**\n`;
            reply += `   Price: LKR ${p.price}\n`;
            reply += `   Stock: ${p.stock} units\n`;
            reply += `   ${p.description.substring(0, 100)}...\n\n`;
          });

          reply += "Would you like more details?";
          return reply;
        }
      }
    }

    // ---------------------
    // 2️⃣ GENERAL REPLY
    // ---------------------
    const generalModel = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generalPrompt = `
      You are a helpful support agent for a Pettah electronics shop.
      Store: 2nd Cross Street No 73, Pettah, Colombo.
      Reply politely and briefly to:
      "${userMessage}"
    `;

    const result = await generalModel.generateContent([generalPrompt]);
    return result.response.text().trim();

  } catch (error) {
    console.error("Gemini chatbot error:", error);
    return "Sorry, I’m having trouble right now.";
  }
};
