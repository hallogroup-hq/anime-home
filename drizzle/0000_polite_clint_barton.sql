CREATE TABLE "ad_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"slot_key" text NOT NULL,
	"sponsor_name" text NOT NULL,
	"banner_url" text NOT NULL,
	"target_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anime" (
	"id" text PRIMARY KEY NOT NULL,
	"canonical_title" text NOT NULL,
	"slug" text NOT NULL,
	"media_type" text NOT NULL,
	"synopsis" text,
	"first_air_date" text,
	"year" integer,
	"season_period" text,
	"maturity_rating" text DEFAULT 'PG-13',
	"airing_status" text NOT NULL,
	"publish_state" text DEFAULT 'published' NOT NULL,
	"poster_url" text,
	"banner_url" text,
	"genres" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "anime_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "anime_titles" (
	"id" text PRIMARY KEY NOT NULL,
	"anime_id" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"title_type" text NOT NULL,
	"normalized_title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"details" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broken_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"variant_id" text NOT NULL,
	"episode_id" text NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"anime_id" text NOT NULL,
	"name" text NOT NULL,
	"japanese_name" text,
	"role" text NOT NULL,
	"image_url" text NOT NULL,
	"voice_actor_name" text NOT NULL,
	"voice_actor_language" text DEFAULT 'Japanese' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"episode_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text NOT NULL,
	"content" text NOT NULL,
	"is_spoiler" boolean DEFAULT false NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" text PRIMARY KEY NOT NULL,
	"anime_id" text NOT NULL,
	"ordinal" integer NOT NULL,
	"display_number" text NOT NULL,
	"episode_type" text DEFAULT 'standard' NOT NULL,
	"title" text,
	"duration_minutes" integer,
	"publish_state" text DEFAULT 'published' NOT NULL,
	"airing_state" text DEFAULT 'aired' NOT NULL,
	"subtitle_state" text DEFAULT 'available' NOT NULL,
	"watchability_state" text DEFAULT 'eligible_verified' NOT NULL,
	"aired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homepage_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"hero_anime_id" text NOT NULL,
	"sections" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchandise" (
	"id" text PRIMARY KEY NOT NULL,
	"anime_id" text,
	"anime_title" text NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"store_name" text NOT NULL,
	"destination_url" text NOT NULL,
	"image_url" text NOT NULL,
	"is_affiliate" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"provider_type" text NOT NULL,
	"api_adapter_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"terms_url" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stream_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"episode_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"quality_label" text NOT NULL,
	"source_ref" text NOT NULL,
	"embed_url" text NOT NULL,
	"audio_locale" text DEFAULT 'ja-JP',
	"subtitle_locale" text DEFAULT 'id-ID',
	"priority" integer DEFAULT 0,
	"verification_state" text DEFAULT 'verified' NOT NULL,
	"moderation_state" text DEFAULT 'approved' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"is_logged_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watch_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"franchise_id" text NOT NULL,
	"franchise_name" text NOT NULL,
	"anime_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"release_year" integer NOT NULL,
	"release_order" integer NOT NULL,
	"chronological_order" integer NOT NULL,
	"type" text NOT NULL,
	"is_canon" boolean DEFAULT true NOT NULL,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "anime_titles" ADD CONSTRAINT "anime_titles_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchandise" ADD CONSTRAINT "merchandise_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_variants" ADD CONSTRAINT "stream_variants_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_variants" ADD CONSTRAINT "stream_variants_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_orders" ADD CONSTRAINT "watch_orders_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;