CREATE TABLE "action_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"assignee" text,
	"deadline" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"source" text,
	"meeting_id" integer,
	"notes" text,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"title" text DEFAULT 'Obrolan Baru' NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"context_mode" text DEFAULT 'general' NOT NULL,
	"decision_type" text,
	"emotional_tone" text,
	"nodes_active" text,
	"strategic_escalation" integer DEFAULT 0 NOT NULL,
	"fast_decision" integer DEFAULT 0 NOT NULL,
	"multi_persona" integer DEFAULT 0 NOT NULL,
	"user_message_preview" text,
	"created_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'mas_dr' NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"room_id" integer,
	"created_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learned_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'mas_dr' NOT NULL,
	"category" text NOT NULL,
	"insight" text NOT NULL,
	"confidence" double precision DEFAULT 0.7 NOT NULL,
	"source_summary" text,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date_time" text,
	"participants" text,
	"agenda" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"summary" text,
	"decisions" text,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"read" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'mas_dr' NOT NULL,
	"target" text NOT NULL,
	"feedback" text NOT NULL,
	"sentiment" text DEFAULT 'neutral' NOT NULL,
	"confidence" double precision DEFAULT 0.7 NOT NULL,
	"source_context" text,
	"created_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_enrichments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'mas_dr' NOT NULL,
	"category" text NOT NULL,
	"fact" text NOT NULL,
	"confidence" double precision DEFAULT 0.8 NOT NULL,
	"source_quote" text,
	"created_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"pic" text,
	"status" text DEFAULT 'active' NOT NULL,
	"milestones" text,
	"deadline" text,
	"progress" integer DEFAULT 0,
	"notes" text,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"keys_p256dh" text NOT NULL,
	"keys_auth" text NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'mas_dr' NOT NULL,
	"summary" text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"strengths" text,
	"weaknesses" text,
	"responsibilities" text,
	"active_projects" text,
	"notes" text,
	"aliases" text,
	"category" text DEFAULT 'team' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"work_style" text,
	"communication_style" text,
	"triggers" text,
	"commitments" text,
	"personality_notes" text,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
