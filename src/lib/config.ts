/**
 * Brand + business details. Rename the pharmacy here and it updates everywhere.
 * CareRx is an online-only, delivery-only pharmacy — there is no walk-in shop.
 * Items marked PLACEHOLDER should be replaced with the pharmacy's real details.
 */
export const site = {
  name: "CareRx Pharmacy",
  shortName: "CareRx",
  tagline: "A licensed pharmacy that comes to you.",
  description:
    "Send a prescription or a list of what you need. A licensed pharmacist checks it, confirms the price and sends it to your door — you pay when it arrives.",
  serviceArea: "Delivering across Lagos", // PLACEHOLDER
  hours: "Pharmacists online daily, 8am–9pm", // PLACEHOLDER
  hoursShort: "8am–9pm daily", // PLACEHOLDER
  phone: "+234 800 000 0000", // PLACEHOLDER
  whatsapp: "+234 800 000 0000", // PLACEHOLDER
  email: "hello@carerx.ng", // PLACEHOLDER
  // Registered (licensed) premises — shown for legitimacy only, not as a place to visit.
  registeredAddress: "12 Admiralty Way, Lekki Phase 1, Lagos", // PLACEHOLDER
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
