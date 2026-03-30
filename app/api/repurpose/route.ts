import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 20) {
      return NextResponse.json({ error: "Please paste more content" }, { status: 400 });
    }

    const prompt = `You are a real human content creator who's been posting on social media for years. You write in a casual, natural, slightly imperfect style.

Take this original content: "${text.substring(0, 1500)}..."

Return ONLY a valid JSON object. Nothing else. No explanations, no markdown, no extra text.

Use this exact format:
{
  "twitter": "your full twitter thread here",
  "linkedin": "your full linkedin post here",
  "tiktok": "your full tiktok script here",
  "instagram": "your full instagram carousel captions here",
  "youtube": "your full youtube description here",
  "email": "your full email newsletter version here",
  "threads": "your full threads post here",
  "pinterest": "your full pinterest pin text here"
}

Writing rules:
- Sound like a real excited person, not AI
- Use very few emojis (maximum 2 per post)
- No em dashes (—)
- More enthusiastic
- Persuasive
- Add real human emotion and opinions
- Show personality 
- Use contractions (you're, it's, etc.)
- Show some statistics but make sure it does not pass the word count of each platform
- Vary sentence length. Mix short and longer sentences
- Make sure its attention grabbing from the very first sentence
- Make sure it sounds different across platforms, don't just copy and paste the same thing with minor tweaks
- To create a caption that draws views and drives engagement in 2026, focus on crafting a hook that sparks curiosity or addresses a common pain point. Use relatable language and inject personality to make it feel authentic. Incorporate a clear call-to-action that encourages viewers to engage, whether it's asking a question, prompting them to share their thoughts, or inviting them to check out your profile for more content. And remember, keep it concise and visually appealing to capture attention in the fast-scrolling social media environment.
- Keep it conversational and authentic`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.85,
      max_tokens: 4000,
    });

    const result = completion.choices[0]?.message?.content || "{}";

    return NextResponse.json({
      success: true,
      versions: result,
      message: "Done"
    });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ 
      error: "Something went wrong. Try again." 
    }, { status: 500 });
  }
}