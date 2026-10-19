
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AlertTriangle, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "8801751473051";
const WEB3FORMS_ACCESS_KEY = "dc5201ec-9a92-4f9c-8533-22f2d31f7b45";

const schema = z.object({
  name: z.string().trim().min(2, "আপনার নাম লিখুন").max(80),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+?88)?01\d{9}$/,
      "সঠিক মোবাইল নম্বর লিখুন (যেমন 01751473051)"
    ),
  whatsapp: z.string().trim().max(20).optional(),
  service: z.string().min(1, "সার্ভিসের ধরন নির্বাচন করুন"),
  machine: z.string().trim().max(80).optional(),
  hp: z.string().trim().max(20).optional(),
  phase: z.string(),
  problem: z
    .string()
    .trim()
    .min(5, "সমস্যার বিবরণ লিখুন")
    .max(1000),
  method: z.string(),
});

const field =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2.5 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

export function ContactForm({ services }: { services: string[] }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData) as Record<string, string>;
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      const errs: Record<string, string> = {};

      parsed.error.issues.forEach((issue) => {
        errs[String(issue.path[0])] = issue.message;
      });

      setErrors(errs);
      setResult(null);
      return;
    }

    setErrors({});
    setResult(null);

    const d = parsed.data;

    const message = [
      "আসসালামু আলাইকুম। নতুন সার্ভিস অনুরোধ:",
      "",
      `নাম: ${d.name}`,
      `মোবাইল: ${d.phone}`,
      `WhatsApp: ${d.whatsapp || "দেওয়া হয়নি"}`,
      `সার্ভিস: ${d.service}`,
      `মেশিন: ${d.machine || "উল্লেখ নেই"}`,
      `ক্ষমতা: ${d.hp || "উল্লেখ নেই"}`,
      `ফেজ: ${d.phase}`,
      `সমস্যা: ${d.problem}`,
      `যোগাযোগের মাধ্যম: ${d.method}`,
    ].join("\n");

    // Open WhatsApp directly from the user's submit action.
    const whatsappUrl =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    const whatsappWindow = window.open(
      whatsappUrl,
      "_blank"
    );

    if (whatsappWindow) {
      whatsappWindow.opener = null;
    }

    setLoading(true);

    try {
      if (
        !WEB3FORMS_ACCESS_KEY ||
        WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY"
      ) {
        setResult(
          "WhatsApp খোলা হয়েছে। মেসেজ পাঠাতে Send চাপুন। ইমেইল চালু করতে Web3Forms Access Key যোগ করুন।"
        );
        return;
      }

      const response = await fetch(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `নতুন সার্ভিস অনুরোধ - ${d.name}`,
            from_name: "Motor Service Website",
            name: d.name,
            phone: d.phone,
            whatsapp: d.whatsapp || "দেওয়া হয়নি",
            service: d.service,
            machine: d.machine || "উল্লেখ নেই",
            hp: d.hp || "উল্লেখ নেই",
            phase: d.phase,
            problem: d.problem,
            method: d.method,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.message || "ইমেইল পাঠানো যায়নি"
        );
      }

      setResult(
        "ইমেইলে অনুরোধ পাঠানো হয়েছে। WhatsApp খুললে মেসেজটি Send করুন।"
      );

      form.reset();
    } catch (error) {
      setResult(
        error instanceof Error
          ? `ইমেইল পাঠানো যায়নি: ${error.message}। WhatsApp চ্যাট খোলা থাকলে Send করতে পারবেন।`
          : "ইমেইল পাঠানো যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  }

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-sm text-destructive">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-2 sm:p-7"
    >
      <label className="block min-w-0">
        নাম *
        <input
          name="name"
          required
          className={field}
          placeholder="আপনার নাম"
        />
        {err("name")}
      </label>

      <label className="block min-w-0">
        মোবাইল নম্বর *
        <input
          name="phone"
          required
          inputMode="tel"
          className={field}
          placeholder="01XXXXXXXXX"
        />
        {err("phone")}
      </label>

      <label className="block min-w-0">
        WhatsApp নম্বর
        <input
          name="whatsapp"
          inputMode="tel"
          className={field}
          placeholder="ঐচ্ছিক"
        />
        {err("whatsapp")}
      </label>

      <label className="block min-w-0">
        সার্ভিসের ধরন *
        <select
          name="service"
          required
          className={field}
          defaultValue=""
        >
          <option value="">নির্বাচন করুন</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
          <option value="অন্যান্য">অন্যান্য</option>
        </select>
        {err("service")}
      </label>

      <label className="block min-w-0">
        মোটর/মেশিনের নাম
        <input
          name="machine"
          className={field}
          placeholder="যেমন: পানির পাম্প"
        />
        {err("machine")}
      </label>

      <label className="block min-w-0">
        মোটর ক্যাপাসিটি
        <input
          name="hp"
          className={field}
          placeholder="যেমন: ৩ HP"
        />
        {err("hp")}
      </label>

      <label className="block min-w-0">
        ফেজ
        <select name="phase" className={field}>
          <option>জানা নেই</option>
          <option>সিঙ্গেল ফেজ</option>
          <option>থ্রি ফেজ</option>
          <option>প্রযোজ্য নয়</option>
        </select>
      </label>

      <label className="block min-w-0">
        যোগাযোগের মাধ্যম
        <select name="method" className={field}>
          <option>ফোন</option>
          <option>WhatsApp</option>
        </select>
      </label>

      <label className="block min-w-0 sm:col-span-2">
        সমস্যার বিবরণ *
        <textarea
          name="problem"
          required
          rows={4}
          className={field}
          placeholder="মোটর বা মেশিনে কী সমস্যা হচ্ছে লিখুন"
        />
        {err("problem")}
      </label>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <MessageCircle className="size-5" />
          {loading ? "পাঠানো হচ্ছে..." : "অনুরোধ পাঠান"}
        </button>

        {result && (
          <p
            role="status"
            className="mt-4 flex gap-2 rounded-lg bg-secondary p-3 text-secondary-foreground"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <span>{result}</span>
          </p>
        )}
      </div>
    </form>
  );
}
