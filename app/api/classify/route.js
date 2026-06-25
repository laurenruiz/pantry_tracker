export async function POST(request) {
  const { imageBase64, mimeType } = await request.json()

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` }
            },
            {
              type: 'text',
              text: 'What food or pantry item is in this image? Reply with ONLY the item name (1-3 words, no punctuation). Examples: apples, olive oil, cheddar cheese.'
            }
          ]
        }
      ]
    })
  })

  const data = await response.json()

  if (!response.ok || !data.choices?.[0]?.message?.content) {
    console.error('OpenRouter classify error:', JSON.stringify(data))
    return Response.json({ error: 'Could not classify image.' }, { status: 500 })
  }

  const name = data.choices[0].message.content.trim().toLowerCase()
  return Response.json({ name })
}
