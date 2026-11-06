/**
 * Brand + business details. Rename the pharmacy here and it updates everywhere.
 * Items marked PLACEHOLDER should be replaced with the pharmacy's real details.
 */
export const site = {
  name: "CareRx Pharmacy",
  shortName: "CareRx",
  tagline: "Your neighbourhood pharmacist, now on your phone.",
  description:
    "Send a prescription or a list of what you need. A licensed pharmacist checks it, confirms the price and gets it to you — you pay when it arrives.",
  branch: "Lekki Phase 1, Lagos", // PLACEHOLDER
  phone: "+234 800 000 0000", // PLACEHOLDER
  whatsapp: "+234 800 000 0000", // PLACEHOLDER
  email: "hello@carerx.ng", // PLACEHOLDER
  address: "12 Admiralty Way, Lekki Phase 1, Lagos", // PLACEHOLDER
  storeHours: "Mon–Sat 8am–9pm · Sun 12pm–6pm", // PLACEHOLDER
  openingShort: "Open daily · 8am–9pm", // PLACEHOLDER
  pcnNotice: "Licensed by the Pharmacy Council of Nigeria (PCN).",
  premisesLicence: "PCN premises licence no. 000000", // PLACEHOLDER
  superintendent: {
    // PLACEHOLDER — the pharmacist in charge (legally required to be named in Nigeria)
    name: "Pharm. Adaeze Okafor",
    title: "Superintendent Pharmacist",
    registration: "PCN reg. no. 00000",
    quote: "I’d rather spend five minutes explaining a dose than have you guess at home.",
  },
  currency: "NGN",
  locale: "en-NG",
  timezone: "Africa/Lagos",
} as const;
