// This is the code for our secure Netlify Function (the "middleman")

exports.handler = async function (event) {
  // 1. Get the product data from the request sent by the Duda form
  const { productName, productFeatures, productPrice, specialOffer } = JSON.parse(event.body);

  // 2. Get our secret API key from the environment variables on Netlify
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key is not set up." }),
    };
  }

  // 3. This is the "prompt" we send to the AI.
  const prompt = `
    You are an expert social media manager for a local retail store. Your tone is enthusiastic and friendly.
    Your goal is to create an engaging Facebook post that drives sales.
    - Use 2-3 relevant emojis.
    - Keep the post relatively short and easy to read.
    - Include a clear call to action.
    - Include 1-2 relevant hashtags.

    Generate a post based on this product information:
    - Product Name: ${productName}
    - Key Features: ${productFeatures}
    - Price: ${productPrice}
    - Special Offer: ${specialOffer || "None"}
  `;

  // 4. Call the OpenAI API
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // You can also use "gpt-4" for higher quality but higher cost
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7, // A value between 0 and 1. Higher means more creative.
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        // If OpenAI returns an error, send it back
        console.error("OpenAI API Error:", data);
        throw new Error(data.error.message || "Failed to get response from AI.");
    }

    const aiText = data.choices[0].message.content.trim();

    // 5. Send the AI-generated text back to the Duda form
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allows your Duda site to call this function
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ post: aiText }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};