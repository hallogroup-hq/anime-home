CREATE TABLE "metadata_candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" integer NOT NULL,
	"source_api" text DEFAULT 'anilist' NOT NULL,
	"canonical_title" text NOT NULL,
	"romaji_title" text NOT NULL,
	"english_title" text,
	"year" integer,
	"season_period" text,
	"media_type" text DEFAULT 'TV' NOT NULL,
	"genres" text NOT NULL,
	"synopsis" text,
	"poster_url" text,
	"banner_url" text,
	"total_episodes" integer,
	"duplicate_match_id" text,
	"duplicate_reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"episode_id" text NOT NULL,
	"anime_id" text NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"position_seconds" integer DEFAULT 0,
	"source_variant_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"anime_id" text NOT NULL,
	"status" text DEFAULT 'watching' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watch_orders" DROP CONSTRAINT "watch_orders_anime_id_anime_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "target" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "details" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_orders" ALTER COLUMN "anime_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_orders" ALTER COLUMN "slug" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "actor_id" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "role" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "resource" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD CONSTRAINT "watch_progress_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD CONSTRAINT "watch_progress_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_orders" ADD CONSTRAINT "watch_orders_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE set null ON UPDATE no action;