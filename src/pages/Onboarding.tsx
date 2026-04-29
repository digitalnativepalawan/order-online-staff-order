import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Store, Palette, KeyRound, CheckCircle2, Upload, Type } from "lucide-react";
import { toast } from "sonner";
import { setStoredCurrency, type CurrencyCode, CURRENCY_LABELS, CURRENCY_SYMBOLS } from "@/lib/currency-store";

const STEPS = ["Welcome", "Business", "Branding", "Passkey", "Done"] as const;

type Palette = {
  name: string;
  primary: string;
  background: string;
  text: string;
  accent: string;
};

const PALETTES: Palette[] = [
  { name: "Ocean Breeze",   primary: "#0ea5e9", background: "#ffffff", text: "#0f172a", accent: "#f59e0b" },
  { name: "Tropical Sunset", primary: "#f97316", background: "#ffffff", text: "#0f172a", accent: "#ec4899" },
  { name: "Forest Retreat",  primary: "#059669", background: "#f8fafc", text: "#0f172a", accent: "#65a30d" },
  { name: "Luxury Gold",     primary: "#7c3aed", background: "#fafaf9", text: "#1c1917", accent: "#ca8a04" },
  { name: "Minimal Modern",  primary: "#0f172a", background: "#ffffff", text: "#0f172a", accent: "#737373" },
  { name: "Beach Vibes",     primary: "#06b6d4", background: "#f0f9ff", text: "#0c4a6e", accent: "#facc15" },
];

type FontPair = { name: string; heading: string; body: string };

const FONT_PAIRS: FontPair[] = [
  { name: "Modern Sans",    heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans" },
  { name: "Elegant Classic", heading: "Playfair Display", body: "Lato" },
  { name: "Bold Impact",    heading: "Montserrat",        body: "Open Sans" },
  { name: "Minimal Refined", heading: "DM Sans",          body: "DM Sans" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [palette, setPalette] = useState<Palette>(PALETTES[1]);
  const [fontPair, setFontPair] = useState<FontPair>(FONT_PAIRS[0]);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("PHP");

  const [passkey, setPasskey] = useState("");
  const [passkeyConfirm, setPasskeyConfirm] = useState("");

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `onboarding-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Logo upload failed");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
  };

  const next = () => {
    if (step === 1 && !businessName.trim()) return toast.error("Business name is required");
    if (step === 3) {
      if (!/^\d{4}$/.test(passkey)) return toast.error("Passkey must be 4 digits");
      if (passkey !== passkeyConfirm) return toast.error("Passkeys don't match");
      if (passkey === "5309") return toast.error("Please choose a different passkey than the default");
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("business_settings")
      .update({
        business_name: businessName.trim(),
        business_email: businessEmail.trim(),
        business_phone: businessPhone.trim(),
        business_address: businessAddress.trim(),
        logo_url: logoUrl,
        primary_color: palette.primary,
        background_color: palette.background,
        text_color: palette.text,
        accent_color: palette.accent,
        color_scheme_name: palette.name,
        heading_font: fontPair.heading,
        body_font: fontPair.body,
        currency_code: currencyCode,
        currency_symbol: CURRENCY_SYMBOLS[currencyCode],
        admin_passkey: passkey,
        copyright_text: `© ${new Date().getFullYear()} ${businessName.trim()}`,
        onboarding_completed: true,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    setStoredCurrency(currencyCode);
    qc.invalidateQueries({ queryKey: ["business-settings"] });
    toast.success("Setup complete! Welcome to your new store.");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">First-time setup</span>
            </div>
            <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <CardTitle className="pt-4">{stepTitle(step)}</CardTitle>
          <CardDescription>{stepDesc(step)}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {step === 0 && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                You've just remixed a food ordering template. Let's set up your business in under 2 minutes — you can change everything later from the admin panel.
              </p>
            </div>
          )}

          {step === 1 && (
            <>
              <Field label="Business name *">
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Lola's Kitchen" autoFocus />
              </Field>
              <Field label="Email">
                <Input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="hello@yourbusiness.com" />
              </Field>
              <Field label="Phone / WhatsApp">
                <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="+63 917 000 0000" />
              </Field>
              <Field label="Address">
                <Textarea value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="Street, City" rows={2} />
              </Field>
              <Field label="Logo (optional)">
                <div className="flex items-center gap-3">
                  {logoUrl && <img src={logoUrl} alt="logo preview" className="h-12 w-12 rounded object-cover border" />}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                    <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                      <span><Upload className="h-3 w-3 mr-1" />{uploading ? "Uploading..." : logoUrl ? "Replace" : "Upload"}</span>
                    </Button>
                  </label>
                </div>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Primary brand color">
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      className={`h-10 w-10 rounded-full border-2 transition ${primaryColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-10 rounded-full border cursor-pointer" />
                </div>
              </Field>
              <Field label="Default currency">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrencyCode(c)}
                      className={`p-3 rounded-lg border-2 text-left transition ${currencyCode === c ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
                    >
                      <div className="text-2xl font-bold">{CURRENCY_SYMBOLS[c]}</div>
                      <div className="text-xs text-muted-foreground">{c}</div>
                      <div className="text-[10px] text-muted-foreground">{CURRENCY_LABELS[c]}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Customers can toggle between PHP, USD, and EUR on the website.</p>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <div className="rounded-lg bg-muted/50 p-3 flex gap-2 text-sm">
                <KeyRound className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-muted-foreground">
                  This 4-digit passkey unlocks your <code className="bg-background px-1 rounded">/admin</code> panel. Choose something only you know.
                </p>
              </div>
              <Field label="New 4-digit passkey *">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="text-center text-2xl tracking-[0.5em]"
                  placeholder="••••"
                  autoFocus
                />
              </Field>
              <Field label="Confirm passkey *">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={passkeyConfirm}
                  onChange={(e) => setPasskeyConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="text-center text-2xl tracking-[0.5em]"
                  placeholder="••••"
                />
              </Field>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">All set, {businessName}!</h3>
                <p className="text-muted-foreground text-sm">
                  Your store is ready. Click finish to start adding your menu from the admin panel.
                </p>
              </div>
              <div className="text-left rounded-lg border p-3 text-sm space-y-1 bg-muted/30">
                <div><span className="text-muted-foreground">Currency:</span> {CURRENCY_SYMBOLS[currencyCode]} {currencyCode}</div>
                <div className="flex items-center gap-2"><span className="text-muted-foreground">Brand color:</span> <span className="h-4 w-4 rounded-full inline-block" style={{ backgroundColor: primaryColor }} /> {primaryColor}</div>
                <div><span className="text-muted-foreground">Admin passkey:</span> •••• (saved)</div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between p-6 pt-0 gap-3">
          <Button variant="ghost" onClick={back} disabled={step === 0 || saving}>Back</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1 sm:flex-none">Continue</Button>
          ) : (
            <Button onClick={finish} disabled={saving} className="flex-1 sm:flex-none">
              {saving ? "Saving..." : "Finish setup"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function stepTitle(s: number) {
  return ["Welcome 👋", "Tell us about your business", "Make it yours", "Secure your admin", "You're ready!"][s];
}
function stepDesc(s: number) {
  return [
    "A quick one-time setup to brand your new store.",
    "Basic info that appears across your site, invoices, and notifications.",
    "Pick your colors and default currency.",
    "Replace the default passkey with your own.",
    "Review your setup below.",
  ][s];
}