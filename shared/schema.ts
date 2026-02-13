import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  images: z.array(z.string()).optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  images: z.array(z.string()).optional(),
  voiceMode: z.boolean().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatResponse {
  reply: string;
  nodeUsed: string | null;
}

export interface HistoryResponse {
  messages: ChatMessage[];
}

export interface LearnedPreferenceItem {
  id: number;
  category: string;
  insight: string;
  confidence: number;
  source_summary: string | null;
  updated_at: string;
}

export interface PreferencesResponse {
  preferences: LearnedPreferenceItem[];
}

export interface PersonaFeedbackItem {
  id: number;
  target: string;
  feedback: string;
  sentiment: string;
  confidence: number;
  source_context: string | null;
  created_at: string;
}

export interface PersonaFeedbackResponse {
  feedback: PersonaFeedbackItem[];
}

export interface ProfileEnrichmentItem {
  id: number;
  category: string;
  fact: string;
  confidence: number;
  source_quote: string | null;
  created_at: string;
}

export interface ProfileEnrichmentsResponse {
  enrichments: ProfileEnrichmentItem[];
}
