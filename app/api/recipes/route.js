export async function POST(request) {
  const { items } = await request.json()

  const itemList = items.map(i => `${i.name} (qty: ${i.quantity})`).join(', ')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [
        {
          role: 'user',
          content: `I have these pantry items: ${itemList}. Suggest ONE recipe I can make using some of these ingredients. You do not need to use all the ingredients or all of the quantities of the ingredients. Give it a name, list which pantry items it uses and how much, and provide 3-10 simple steps.`
        }
      ]
    })
  })

  const data = await response.json()
  if (!response.ok || !data.choices) {
    console.error('OpenRouter error:', JSON.stringify(data))
    return Response.json({ suggestion: 'Could not generate a recipe. Check your API key and model name.' }, { status: 500 })
  }
  const suggestion = data.choices[0].message.content

  if (/user safety/i.test(suggestion) || suggestion.trim().length < 20) {
    return Response.json({ suggestion: null, error: 'rate_limited' }, { status: 429 })
  }

  return Response.json({ suggestion })
}
