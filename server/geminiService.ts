import { GoogleGenAI, Type } from "@google/genai";

export interface LeadAnalysisInput {
  customerName: string;
  phoneNumber?: string;
  email: string;
  leadSource?: string;
  productInterest?: string;
  budget?: string;
  customerMessage: string;
}

export interface LeadAnalysisOutput {
  lead_score: number;
  classification: "Hot" | "Warm" | "Cold";
  purchase_intent: "High" | "Medium" | "Low";
  priority: "High" | "Medium" | "Low";
  summary: string;
  recommended_action: string;
  suggested_response: string;
  reasoning: string[];
}

let genAIClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing or empty.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

export async function analyzeLeadWithGemini(
  input: LeadAnalysisInput
): Promise<LeadAnalysisOutput> {
  const {
    customerName,
    phoneNumber,
    email,
    leadSource,
    productInterest,
    budget,
    customerMessage,
  } = input;

  const ai = getGenAI();

  const prompt = `Analyze this prospective customer lead for B2B sales qualification:

Prospect Details:
- Customer Name: ${customerName.trim()}
- Phone Number: ${phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : "Not provided"}
- Email Address: ${email.trim()}
- Lead Source: ${leadSource && leadSource.trim() ? leadSource.trim() : "Website Inbound"}
- Product / Service Interest: ${productInterest && productInterest.trim() ? productInterest.trim() : "General Services"}
- Allocated Budget: ${budget && budget.trim() ? budget.trim() : "Not specified"}
- Customer Message / Inquiry:
"""
${customerMessage.trim()}
"""

Evaluation Guidelines:
1. Calculate a realistic qualification lead_score (integer between 0 and 100) based on budget size, customer need clarity, timeline urgency, and contact credibility.
2. Determine classification: MUST only be "Hot", "Warm", or "Cold".
3. Determine purchase_intent: MUST only be "High", "Medium", or "Low".
4. Determine priority: MUST only be "High", "Medium", or "Low".
5. Provide a summary: A concise summary of what the customer wants.
6. Provide a recommended_action: Tell the salesperson what they should do next.
7. Provide a suggested_response: Generate a professional personalized response that the salesperson can send to the customer.
8. Provide reasoning: Return 2-5 short reasons explaining why the lead received this score.

Return ONLY structured JSON matching the requested schema.`;

  const modelsToTry = [
    "gemini-3.8-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
  ];
  let response: any = null;
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            "You are LeadPilot AI, an intelligent CRM sales qualification assistant. Assess the prospect data thoroughly and return ONLY structured JSON adhering strictly to the schema. Do not wrap in markdown tags or add extraneous text.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lead_score: {
                type: Type.INTEGER,
                description: "Integer from 0 to 100.",
              },
              classification: {
                type: Type.STRING,
                enum: ["Hot", "Warm", "Cold"],
                description: "Must only be 'Hot', 'Warm', or 'Cold'.",
              },
              purchase_intent: {
                type: Type.STRING,
                enum: ["High", "Medium", "Low"],
                description: "Must only be 'High', 'Medium', or 'Low'.",
              },
              priority: {
                type: Type.STRING,
                enum: ["High", "Medium", "Low"],
                description: "Must only be 'High', 'Medium', or 'Low'.",
              },
              summary: {
                type: Type.STRING,
                description: "A concise summary of what the customer wants.",
              },
              recommended_action: {
                type: Type.STRING,
                description: "Tell the salesperson what they should do next.",
              },
              suggested_response: {
                type: Type.STRING,
                description:
                  "Generate a professional personalized response that the salesperson can send to the customer.",
              },
              reasoning: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description:
                  "Return 2-5 short reasons explaining why the lead received this score.",
              },
            },
            required: [
              "lead_score",
              "classification",
              "purchase_intent",
              "priority",
              "summary",
              "recommended_action",
              "suggested_response",
              "reasoning",
            ],
          },
        },
      });

      if (response?.text) {
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(
        `Gemini model ${model} attempt failed, trying fallback:`,
        err?.message || err
      );
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  if (!response || !response.text) {
    throw lastError || new Error("Gemini AI service temporarily unavailable.");
  }

  const rawText = response.text.trim();
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const sanitized = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    parsed = JSON.parse(sanitized);
  }

  const leadScore = Math.max(
    0,
    Math.min(100, Math.round(Number(parsed.lead_score) || 0))
  );

  const classification: "Hot" | "Warm" | "Cold" = ["Hot", "Warm", "Cold"].includes(
    parsed.classification
  )
    ? parsed.classification
    : leadScore >= 75
    ? "Hot"
    : leadScore >= 45
    ? "Warm"
    : "Cold";

  const purchaseIntent: "High" | "Medium" | "Low" = [
    "High",
    "Medium",
    "Low",
  ].includes(parsed.purchase_intent)
    ? parsed.purchase_intent
    : classification === "Hot"
    ? "High"
    : classification === "Warm"
    ? "Medium"
    : "Low";

  const priority: "High" | "Medium" | "Low" = [
    "High",
    "Medium",
    "Low",
  ].includes(parsed.priority)
    ? parsed.priority
    : classification === "Hot"
    ? "High"
    : classification === "Warm"
    ? "Medium"
    : "Low";

  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : "Prospective customer inquiry evaluated.";

  const recommendedAction =
    typeof parsed.recommended_action === "string" &&
    parsed.recommended_action.trim()
      ? parsed.recommended_action.trim()
      : "Initiate direct outreach to clarify project requirements.";

  const suggestedResponse =
    typeof parsed.suggested_response === "string" &&
    parsed.suggested_response.trim()
      ? parsed.suggested_response.trim()
      : `Hi ${customerName},\n\nThank you for reaching out regarding ${productInterest || "our services"}. We would love to discuss your requirements and how we can support your goals.\n\nBest regards,\nSales Team`;

  const reasoning: string[] =
    Array.isArray(parsed.reasoning) && parsed.reasoning.length > 0
      ? parsed.reasoning.map((r: any) => String(r))
      : [
          `Lead evaluated with score of ${leadScore}/100.`,
          `Categorized as ${classification} based on budget and urgency indicators.`,
        ];

  return {
    lead_score: leadScore,
    classification,
    purchase_intent: purchaseIntent,
    priority,
    summary,
    recommended_action: recommendedAction,
    suggested_response: suggestedResponse,
    reasoning,
  };
}
