
-- Seed payment methods
INSERT INTO payment_methods (method_name, is_enabled, display_order) VALUES
  ('Cash on Delivery', true, 1),
  ('Cash on Pickup', true, 2),
  ('GCash', true, 3),
  ('PHQR', true, 4),
  ('Bank Transfer', true, 5)
ON CONFLICT DO NOTHING;

-- Seed default website pages
INSERT INTO website_pages (title, slug, content, is_published, display_order) VALUES
  ('Home', 'home', '{"body": "Welcome to our store!"}'::jsonb, true, 0),
  ('About', 'about', '{"body": "About our business."}'::jsonb, true, 1),
  ('Contact', 'contact', '{"body": ""}'::jsonb, true, 2),
  ('FAQ', 'faq', '{"body": ""}'::jsonb, true, 3),
  ('Testimonials', 'testimonials', '{"body": ""}'::jsonb, true, 4),
  ('Specials', 'specials', '{"body": ""}'::jsonb, true, 5)
ON CONFLICT DO NOTHING;
