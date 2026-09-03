"use client";

import * as React from "react";

export type AppLanguage = "en" | "ur";

const storageKey = "raahnuma_language";
const urduCopy: Record<string, string> = {
  "Dashboard": "ڈیش بورڈ", "Marketplace": "مارکیٹ پلیس", "Community": "کمیونٹی", "Settings": "ترتیبات", "Logout": "لاگ آؤٹ",
  "Features": "خصوصیات", "How it works": "کیسے کام کرتا ہے", "Stories": "کہانیاں", "Log in": "لاگ اِن", "Start Now": "اب شروع کریں",
  "Ready for the road ahead?": "آگے کے سفر کے لیے تیار ہیں؟", "Local gear network": "مقامی سامان نیٹ ورک", "Cart": "کارٹ", "Add to trip": "سفر میں شامل کریں", "Your trip cart": "آپ کے سفر کی کارٹ", "Your cart is empty. Add gear from the marketplace.": "آپ کی کارٹ خالی ہے۔ مارکیٹ پلیس سے سامان شامل کریں۔", "Estimated total": "تخمینی کل", "Proceed to checkout": "چیک آؤٹ کے لیے آگے بڑھیں", "Clear cart": "کارٹ خالی کریں",
  "Rent or buy trusted mountain gear from local operators in the Northern Areas.": "شمالی علاقوں کے مقامی آپریٹرز سے قابلِ اعتماد پہاڑی سامان کرایے پر لیں یا خریدیں۔", "No gear matches your search. Try a different category.": "آپ کی تلاش سے کوئی سامان نہیں ملا۔ کوئی اور زمرہ آزمائیں۔", "Every vendor is verified by Raahnuma.AI and reviewed by travelers.": "ہر فروخت کنندہ راہنما اے آئی سے تصدیق شدہ اور مسافروں کا جائزہ لیا ہوا ہے۔",
  "My Trips": "میرے سفر", "Plan a new trip": "نیا سفر پلان کریں", "Every trip you have planned, with its live safety advisory.": "آپ کے ہر منصوبہ بند سفر کے لیے تازہ حفاظتی مشورہ۔", "All": "تمام", "Upcoming": "آنے والے", "Completed": "مکمل شدہ", "No completed trips yet.": "ابھی کوئی مکمل شدہ سفر نہیں ہے۔",
  "Tell us where you are headed — we will generate your packing list and safety advisory.": "بتائیں آپ کہاں جا رہے ہیں — ہم آپ کی پیکنگ فہرست اور حفاظتی مشورہ تیار کریں گے۔", "Destination": "منزل", "Start date": "آغاز کی تاریخ", "End date": "اختتامی تاریخ", "Group size": "گروپ کا حجم", "Experience level": "تجربے کی سطح", "Beginner": "ابتدائی", "Intermediate": "درمیانی", "Expert": "ماہر", "Generate trip pack": "سفری پیک تیار کریں", "Generating your advisory...": "آپ کا مشورہ تیار ہو رہا ہے...", "Your end date must be on or after your start date.": "اختتامی تاریخ آغاز کی تاریخ کے برابر یا اس کے بعد ہونی چاہیے۔",
  "Welcome back,": "خوش آمدید،", "Here is what is happening with your upcoming trips.": "آپ کے آنے والے سفروں کی تازہ صورتحال یہ ہے۔", "Upcoming Trips": "آنے والے سفر", "Safety Score": "حفاظتی اسکور", "Gear Items Ready": "سامان تیار", "Community Reports": "کمیونٹی رپورٹس", "Stable": "مستحکم", "View all": "سب دیکھیں",
  "Community Trail Reports": "کمیونٹی ٹریل رپورٹس", "Real-time, crowdsourced updates — AI-moderated before publishing.": "تازہ، کمیونٹی سے حاصل شدہ اپ ڈیٹس — اشاعت سے پہلے اے آئی کی جانچ۔", "Report trail condition": "ٹریل کی حالت رپورٹ کریں", "Report submitted": "رپورٹ جمع ہو گئی", "Pending AI moderation before it goes public.": "عوامی ہونے سے پہلے اے آئی جانچ کا انتظار ہے۔", "Route": "راستہ", "Condition": "حالت", "Clear": "صاف", "Use caution": "احتیاط کریں", "Closed": "بند", "Description": "تفصیل", "Submit report": "رپورٹ جمع کریں", "What did you see on the trail?": "آپ نے ٹریل پر کیا دیکھا؟", "Helpful": "مددگار", "AI-verified": "اے آئی سے تصدیق شدہ", "Just now": "ابھی", 
  "Security": "سیکیورٹی", "Update your password and manage account security.": "اپنا پاس ورڈ تبدیل کریں اور اکاؤنٹ کی سیکیورٹی منظم کریں۔", "Change password": "پاس ورڈ تبدیل کریں", "Current password": "موجودہ پاس ورڈ", "New password": "نیا پاس ورڈ", "Confirm new password": "نئے پاس ورڈ کی تصدیق", "Passwords do not match": "پاس ورڈ ایک جیسے نہیں ہیں", "Update password": "پاس ورڈ اپ ڈیٹ کریں", "Updating...": "اپ ڈیٹ ہو رہا ہے...",
  "Emergency SOS": "ہنگامی مدد", "One tap shares your live location and trip itinerary with your emergency contact and local guide network.": "ایک ٹیپ سے آپ کی موجودہ جگہ اور سفری منصوبہ ہنگامی رابطے اور مقامی گائیڈ نیٹ ورک سے شیئر ہو جاتا ہے۔", "What will be shared": "کیا شیئر کیا جائے گا", "Live GPS location": "موجودہ جی پی ایس جگہ", "Active itinerary": "فعال سفری منصوبہ", "Emergency contact": "ہنگامی رابطہ", "SEND SOS": "SOS بھیجیں", "Sending...": "بھیجا جا رہا ہے...", "Sent": "بھیج دیا گیا", "Reset": "ری سیٹ", "For life-threatening emergencies, always call local emergency services (1122) directly in addition to using this feature.": "جان لیوا ہنگامی صورتحال میں اس فیچر کے ساتھ ساتھ ہمیشہ براہِ راست مقامی ایمرجنسی سروس (1122) پر کال کریں۔",
  "Forgot your password?": "پاس ورڈ بھول گئے؟", "Email address": "ای میل ایڈریس", "Send verification code": "تصدیقی کوڈ بھیجیں", "Check your email": "اپنا ای میل دیکھیں", "Verify code": "کوڈ کی تصدیق کریں", "Resend code": "کوڈ دوبارہ بھیجیں", "Set a new password": "نیا پاس ورڈ مقرر کریں", "Password updated": "پاس ورڈ اپ ڈیٹ ہو گیا", "Back to login": "لاگ اِن پر واپس", "Create account": "اکاؤنٹ بنائیں", "Creating account...": "اکاؤنٹ بنایا جا رہا ہے...", "Full name": "پورا نام", "Phone number": "فون نمبر", "Emergency contact name": "ہنگامی رابطے کا نام", "Emergency contact phone": "ہنگامی رابطے کا فون",
  "Built for Pakistan Northern Areas": "پاکستان کے شمالی علاقوں کے لیے", "Every mountain has a story.": "ہر پہاڑ کی ایک کہانی ہے۔", "Do not let it end in an emergency.": "اسے ہنگامی صورتحال میں ختم نہ ہونے دیں۔", "Read Docs": "مزید جانیں", "Everything you need before the road gets steep": "راستہ دشوار ہونے سے پہلے ہر ضروری چیز", "From an idea to a safe trip": "خیال سے محفوظ سفر تک", "Real trips, real conditions": "حقیقی سفر، حقیقی حالات", "Privacy": "رازداری", "Terms": "شرائط", "Contact": "رابطہ"
  ,"Raahnuma.AI turns uncertain weather, unfamiliar routes, and guesswork packing into a clear, personalized plan — so your trip to Hunza, Naran, or Skardu stays a memory, not a headline.": "راہنما اے آئی غیر یقینی موسم، نامانوس راستوں اور اندازے کی پیکنگ کو واضح، ذاتی منصوبے میں بدلتا ہے تاکہ ہنزہ، ناران یا اسکردو کا سفر ایک یاد رہے، خبر نہیں۔"
  ,"Trusted by trekkers, families, and student expeditions across Gilgit-Baltistan.": "گلگت بلتستان بھر کے ٹریکرز، خاندانوں اور طلبہ کے سفر اس پر بھروسا کرتے ہیں۔"
  ,"No more piecing together forecasts, forum posts, and guesswork. One assistant, built for the terrain.": "پیش گوئیوں، فورم پوسٹس اور اندازوں کو جوڑنے کی ضرورت نہیں۔ ایک معاون، اسی خطے کے لیے بنایا گیا۔"
  ,"Four steps between the idea of a Hunza trip and actually being ready.": "ہنزہ کے سفر کے خیال اور واقعی تیار ہونے کے درمیان چار قدم۔"
  ,"The mountains are not going anywhere. Your readiness should get there first.": "پہاڑ کہیں نہیں جا رہے۔ آپ کی تیاری کو پہلے وہاں پہنچنا چاہیے۔"
  ,"Plan your next trip with a system that actually knows the terrain.": "اپنے اگلے سفر کا منصوبہ ایسے نظام کے ساتھ بنائیں جو واقعی اس خطے کو جانتا ہے۔"
};
const englishCopy = Object.fromEntries(Object.entries(urduCopy).map(([english, urdu]) => [urdu, english]));
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function localizePage(language: AppLanguage) {
  const translate = (text: string) => language === "ur" ? (urduCopy[text] ?? text) : (englishCopy[text] ?? text);
  const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = textNodes.nextNode())) {
    const textNode = node as Text;
    if (textNode.parentElement?.closest("[data-localization-skip]")) continue;
    const source = originalText.get(textNode) ?? textNode.nodeValue ?? "";
    if (!originalText.has(textNode)) originalText.set(textNode, source);
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    const core = source.trim();
    const localized = core ? `${leading}${translate(core)}${trailing}` : source;
    if (textNode.nodeValue !== localized) textNode.nodeValue = localized;
  }
  document.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]").forEach((element) => {
    if (element.closest("[data-localization-skip]")) return;
    const saved = originalAttributes.get(element) ?? new Map<string, string>();
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current === null) return;
      const source = saved.get(attribute) ?? current;
      saved.set(attribute, source);
      const localized = translate(source);
      if (current !== localized) element.setAttribute(attribute, localized);
    });
    originalAttributes.set(element, saved);
  });
}
const translations = {
  en: { dashboard: "Dashboard", trips: "My Trips", marketplace: "Marketplace", community: "Community", sos: "Emergency SOS", settings: "Settings", logout: "Logout", search: "Search trips, gear, guides...", notifications: "Notifications", quickSos: "Quick SOS", openMenu: "Open navigation menu", closeMenu: "Close navigation menu" },
  ur: { dashboard: "ڈیش بورڈ", trips: "میرے سفر", marketplace: "مارکیٹ پلیس", community: "کمیونٹی", sos: "ہنگامی مدد", settings: "ترتیبات", logout: "لاگ آؤٹ", search: "سفر، سامان اور گائیڈز تلاش کریں...", notifications: "اطلاعات", quickSos: "فوری SOS", openMenu: "نیویگیشن مینو کھولیں", closeMenu: "نیویگیشن مینو بند کریں" }
} as const;

type TranslationKey = keyof (typeof translations)["en"];
type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; t: (key: TranslationKey) => string };
const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<AppLanguage>("en");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "en" || stored === "ur") setLanguageState(stored);
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    localizePage(language);
  }, [language]);

  React.useEffect(() => {
    if (language !== "ur") return;
    const observer = new MutationObserver(() => localizePage("ur"));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const setLanguage = React.useCallback((nextLanguage: AppLanguage) => {
    window.localStorage.setItem(storageKey, nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  const value = React.useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => translations[language][key] }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
