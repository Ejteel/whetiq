CREATE TABLE "landing_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"version" varchar(20) NOT NULL,
	"data" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "landing_versions_version_unique" UNIQUE("version")
);
