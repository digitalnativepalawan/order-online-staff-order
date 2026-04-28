
INSERT INTO storage.buckets (id, name, public) VALUES ('specials', 'specials', true);

CREATE POLICY "Anyone can read specials images" ON storage.objects FOR SELECT USING (bucket_id = 'specials');
CREATE POLICY "Anyone can upload specials images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'specials');
CREATE POLICY "Anyone can update specials images" ON storage.objects FOR UPDATE USING (bucket_id = 'specials');
CREATE POLICY "Anyone can delete specials images" ON storage.objects FOR DELETE USING (bucket_id = 'specials');
