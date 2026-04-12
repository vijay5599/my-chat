const HF_TOKEN = process.env.HF_TOKEN;

/**
 * Premium Free Image Generation via Hugging Face (FLUX.1-schnell)
 * Uses the user's HF_TOKEN for high-quality, stable generation.
 */
export async function generateFreeImage(prompt: string) {
  if (!HF_TOKEN) {
    // Fallback to Pollinations if token is missing for some reason
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux`;
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ 
          inputs: prompt,
          options: { wait_for_model: true } // Ensure it waits for GPU to wake up
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF API Error: ${response.statusText}`);
    }

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Image = buffer.toString('base64');
    
    // Return as a Data URL so it can be rendered instantly in MessageList
    return `data:image/webp;base64,${base64Image}`;
  } catch (error) {
    console.error('Hugging Face Art Error:', error);
    // Silent Fallback to Pollinations so the user doesn't see an error
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux`;
  }
}
