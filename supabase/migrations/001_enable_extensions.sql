-- Enable PostGIS for location-based queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enable trigram for restaurant name search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
