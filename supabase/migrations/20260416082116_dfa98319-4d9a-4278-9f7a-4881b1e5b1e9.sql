
-- Create logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for logos bucket
CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Anyone can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');
CREATE POLICY "Anyone can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');
CREATE POLICY "Anyone can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos');

-- Seed social media links
INSERT INTO social_media_links (platform_name, icon_name, url, is_enabled, display_order) VALUES
  ('Facebook', 'facebook', 'https://web.facebook.com/jayceetrading', true, 1),
  ('Instagram', 'instagram', 'https://www.instagram.com/jayceetradingservices/', true, 2)
ON CONFLICT DO NOTHING;
