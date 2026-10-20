-- AngkorEV schema (SQLite dev). Mirrors src/db/schema.ts.
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  avatar_url TEXT,
  platform_role TEXT NOT NULL DEFAULT 'USER' CHECK (platform_role IN ('USER','SUPER_ADMIN','PLATFORM_SUPPORT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','PENDING_DELETION')),
  email_verified_at INTEGER,
  phone_verified_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(platform_role);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_uq ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  legal_name TEXT,
  type TEXT NOT NULL DEFAULT 'DEALER',
  logo_url TEXT,
  cover_url TEXT,
  description_en TEXT,
  description_km TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address_line TEXT,
  province TEXT NOT NULL DEFAULT 'Phnom Penh',
  verification_status TEXT NOT NULL DEFAULT 'NONE' CHECK (verification_status IN ('NONE','PENDING','VERIFIED','REJECTED')),
  verification_note TEXT,
  verified_at INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','ARCHIVED')),
  suspended_at INTEGER,
  suspension_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_uq ON tenants(slug);
CREATE INDEX IF NOT EXISTS tenants_status_idx ON tenants(status);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('TENANT_OWNER','TENANT_ADMIN','INVENTORY_MANAGER','SALES_AGENT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS membership_user_tenant_uq ON tenant_memberships(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS membership_tenant_role_idx ON tenant_memberships(tenant_id, role);

CREATE TABLE IF NOT EXISTS tenant_invitations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL,
  invited_by_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS invitation_token_uq ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS invitation_tenant_email_idx ON tenant_invitations(tenant_id, email);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_usd INTEGER NOT NULL DEFAULT 0,
  listing_quota INTEGER NOT NULL DEFAULT 5,
  featured_quota INTEGER NOT NULL DEFAULT 0,
  features_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES plans(code),
  status TEXT NOT NULL DEFAULT 'TRIALING',
  current_period_start INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  current_period_end INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS subscription_tenant_idx ON tenant_subscriptions(tenant_id, status);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  year INTEGER NOT NULL,
  registration_year INTEGER,
  mileage_km INTEGER NOT NULL,
  transmission TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  engine_cc INTEGER,
  drivetrain TEXT,
  body_type TEXT NOT NULL,
  exterior_color TEXT,
  interior_color TEXT,
  seats INTEGER,
  vin TEXT,
  chassis_number TEXT,
  engine_number TEXT,
  plate_number TEXT,
  import_country TEXT,
  vin_status TEXT NOT NULL DEFAULT 'MISSING' CHECK (vin_status IN ('MISSING','PROVIDED','INVALID')),
  accident_claim TEXT,
  maintenance_claim TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS vehicles_make_model_idx ON vehicles(make, model, year);
CREATE INDEX IF NOT EXISTS vehicles_vin_idx ON vehicles(vin);
CREATE INDEX IF NOT EXISTS vehicles_plate_idx ON vehicles(plate_number);

CREATE TABLE IF NOT EXISTS vehicle_images (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  hash TEXT,
  width INTEGER,
  height INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS images_vehicle_idx ON vehicle_images(vehicle_id, position);
CREATE INDEX IF NOT EXISTS images_hash_idx ON vehicle_images(hash);

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  file_url TEXT,
  file_name TEXT,
  mime_type TEXT,
  file_size INTEGER,
  hash TEXT,
  extracted_json TEXT,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE',
  note TEXT,
  uploaded_by_id TEXT,
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  verified_by_id TEXT,
  verified_at INTEGER
);
CREATE INDEX IF NOT EXISTS documents_vehicle_idx ON vehicle_documents(vehicle_id, type);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id),
  tenant_id TEXT REFERENCES tenants(id),
  price_usd INTEGER NOT NULL,
  price_khr INTEGER,
  negotiable INTEGER NOT NULL DEFAULT 1,
  currency_note TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING','PUBLISHED','REJECTED','SOLD','ARCHIVED')),
  condition TEXT NOT NULL DEFAULT 'USED',
  province TEXT NOT NULL,
  district TEXT,
  description_en TEXT NOT NULL,
  description_km TEXT,
  ownership_doc_status TEXT NOT NULL DEFAULT 'NOT_PROVIDED',
  import_doc_status TEXT NOT NULL DEFAULT 'NOT_PROVIDED',
  inspection_available INTEGER NOT NULL DEFAULT 0,
  inspection_note TEXT,
  featured_until INTEGER,
  published_at INTEGER,
  expires_at INTEGER,
  sold_at INTEGER,
  rejection_reason TEXT,
  moderation_flags TEXT NOT NULL DEFAULT '[]',
  view_count INTEGER NOT NULL DEFAULT 0,
  contact_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS listings_slug_uq ON listings(slug);
CREATE UNIQUE INDEX IF NOT EXISTS listings_vehicle_uq ON listings(vehicle_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings(status, published_at);
CREATE INDEX IF NOT EXISTS listings_tenant_idx ON listings(tenant_id, status);
CREATE INDEX IF NOT EXISTS listings_seller_idx ON listings(seller_id, status);
CREATE INDEX IF NOT EXISTS listings_price_idx ON listings(price_usd);

CREATE TABLE IF NOT EXISTS report_requests (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  listing_id TEXT REFERENCES listings(id),
  requested_by_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','PROCESSING','READY','NEEDS_REVIEW','FAILED')),
  provider TEXT NOT NULL DEFAULT 'rules-v1',
  version TEXT NOT NULL DEFAULT '1.0.0',
  confidence INTEGER,
  risk_level TEXT,
  summary_en TEXT,
  summary_km TEXT,
  limitations_en TEXT,
  limitations_km TEXT,
  price_usd INTEGER NOT NULL DEFAULT 0,
  requested_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  started_at INTEGER,
  completed_at INTEGER,
  reviewed_by_id TEXT,
  reviewed_at INTEGER,
  reviewer_note TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS reports_public_uq ON report_requests(public_id);
CREATE INDEX IF NOT EXISTS reports_vehicle_idx ON report_requests(vehicle_id, requested_at);
CREATE INDEX IF NOT EXISTS reports_status_idx ON report_requests(status);

CREATE TABLE IF NOT EXISTS report_findings (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES report_requests(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('VERIFIED_BY_SOURCE','EVIDENCE_FOUND','POTENTIAL_INCONSISTENCY','NOT_VERIFIED','NO_DATA')),
  severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','WARNING','CRITICAL')),
  confidence INTEGER,
  data_json TEXT NOT NULL DEFAULT '{}',
  source_ref TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS findings_report_idx ON report_findings(report_id, sort_order);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  tenant_id TEXT REFERENCES tenants(id),
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  last_message_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS conv_buyer_idx ON conversations(buyer_id, last_message_at);
CREATE INDEX IF NOT EXISTS conv_seller_idx ON conversations(seller_id, last_message_at);
CREATE INDEX IF NOT EXISTS conv_tenant_idx ON conversations(tenant_id, last_message_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'TEXT',
  read_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_listing_uq ON favorites(user_id, listing_id);
CREATE INDEX IF NOT EXISTS favorites_listing_idx ON favorites(listing_id);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query_json TEXT NOT NULL,
  alerts_enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  last_notified_at INTEGER
);
CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON saved_searches(user_id);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  tenant_id TEXT REFERENCES tenants(id),
  preferred_at INTEGER NOT NULL,
  location TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','CONFIRMED','DECLINED','COMPLETED','CANCELLED')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS appointments_seller_idx ON appointments(seller_id, status);
CREATE INDEX IF NOT EXISTS appointments_tenant_idx ON appointments(tenant_id, status);
CREATE INDEX IF NOT EXISTS appointments_buyer_idx ON appointments(buyer_id, status);

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  tenant_id TEXT REFERENCES tenants(id),
  amount_usd INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  responded_at INTEGER
);
CREATE INDEX IF NOT EXISTS offers_listing_idx ON offers(listing_id, status);
CREATE INDEX IF NOT EXISTS offers_buyer_idx ON offers(buyer_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title_key TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  link TEXT,
  read_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, read_at, created_at);

CREATE TABLE IF NOT EXISTS reported_content (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  listing_id TEXT REFERENCES listings(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEWING','RESOLVED','DISMISSED')),
  resolution_note TEXT,
  handled_by_id TEXT,
  handled_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS reported_status_idx ON reported_content(status, created_at);
CREATE INDEX IF NOT EXISTS reported_target_idx ON reported_content(target_type, target_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_role TEXT,
  tenant_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  ip TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_tenant_idx ON audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_logs(actor_id, created_at);
