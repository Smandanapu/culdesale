const CATEGORY_KEYWORDS = {
  'Furniture': ['chair', 'table', 'couch', 'sofa', 'desk', 'bed', 'dresser', 'lamp', 'rug', 'cabinet', 'bookshelf'],
  'Electronics': ['tv', 'television', 'laptop', 'computer', 'phone', 'iphone', 'ipad', 'tablet', 'monitor', 'keyboard', 'speaker', 'headphone', 'xbox', 'playstation', 'nintendo', 'camera'],
  'Sports': ['bike', 'bicycle', 'treadmill', 'dumbbell', 'weight', 'golf', 'tennis', 'basketball', 'baseball', 'soccer', 'yoga', 'helmet'],
  'Kids': ['toy', 'lego', 'stroller', 'crib', 'diaper', 'doll', 'action figure', 'board game', 'puzzle', 'onesie'],
  'Tools': ['drill', 'saw', 'hammer', 'wrench', 'screwdriver', 'toolbox', 'lawnmower', 'ladder'],
  'Appliances': ['fridge', 'refrigerator', 'microwave', 'oven', 'stove', 'washer', 'dryer', 'blender', 'toaster', 'coffee'],
  'Clothing': ['shirt', 'pants', 'jeans', 'dress', 'shoes', 'sneakers', 'boots', 'jacket', 'coat', 'hat', 'bag', 'purse'],
  'Books': ['book', 'novel', 'textbook', 'comic', 'manga', 'magazine']
}

export function parseVoiceListing(transcript) {
  const result = {
    title: '',
    price: '',
    category: 'Other',
    description: transcript.trim()
  }

  const text = transcript.toLowerCase()

  // Extract Price
  // Matches "$15", "15 dollars", "15 bucks", "for 15"
  const priceRegex = /(?:\$|for\s)?(\d+(?:\.\d{2})?)\s*(?:dollars|bucks|\\$)/i
  const priceMatch = text.match(priceRegex)
  
  if (priceMatch && priceMatch[1]) {
    result.price = priceMatch[1]
  } else {
    // Try catching standalone numbers preceded by "for"
    const fallbackPriceRegex = /for (\d+)/i
    const fallbackMatch = text.match(fallbackPriceRegex)
    if (fallbackMatch && fallbackMatch[1]) {
      result.price = fallbackMatch[1]
    }
  }

  // Extract Category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      result.category = category
      break
    }
  }

  // Extract Title (Try to grab the subject before words like "for", "in", "condition")
  // Example: "I'm selling a vintage lamp for 15 dollars" -> "vintage lamp"
  // Example: "Vintage lamp in perfect condition" -> "Vintage lamp"
  let cleanText = text
    .replace(/^i'?m selling a\s/i, '')
    .replace(/^selling a\s/i, '')
    .replace(/^i have a\s/i, '')
    
  const stopWordsIndex = cleanText.search(/\b(for|in|asking|willing|with|that)\b/i)
  
  if (stopWordsIndex > 0) {
    result.title = cleanText.substring(0, stopWordsIndex).trim()
  } else {
    // Just take the first 4 words
    const words = cleanText.split(/\s+/)
    result.title = words.slice(0, 4).join(' ')
  }

  // Capitalize title
  if (result.title) {
    result.title = result.title.charAt(0).toUpperCase() + result.title.slice(1)
  } else {
    result.title = 'New Item'
  }

  return result
}
