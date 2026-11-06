const messages: Record<string, string> = {
  AUTH_REQUIRED: "Please log in to continue.",
  EMPTY_REQUEST: "Add at least one medicine to your request.",
  TOO_MANY_ITEMS: "A request can have up to 50 items. Split it into two requests.",
  PHONE_REQUIRED: "Enter a phone number we can reach you on.",
  ADDRESS_REQUIRED: "Enter your full delivery address.",
  INVALID_PRESCRIPTION_PATH: "Please re-upload your prescription.",
  INVALID_QUANTITY: "Quantities must be between 1 and 99.",
  DRUG_NOT_FOUND: "One of the medicines is no longer available. Remove it and try again.",
  ITEM_NAME_REQUIRED: "Every item needs a name.",
  PRESCRIPTION_REQUIRED: "Some items need a prescription. Please upload a photo or PDF of it.",
  DELIVERY_ONLY: "We deliver every order — please add a delivery address.",
  TOPIC_REQUIRED: "Tell us what you’d like to discuss.",
  SLOT_UNAVAILABLE: "That time isn’t available any more. Please pick another slot.",
  SLOT_TAKEN: "Someone just booked that slot. Please pick another time.",
  TOO_MANY_BOOKINGS: "You already have 3 upcoming consultations. Cancel one to book another.",
};

/** Map a Postgres `raise exception 'CODE'` into a friendly message. */
export function friendlyError(error: { message?: string } | null | undefined, fallback = "Something went wrong. Please try again.") {
  if (!error?.message) return fallback;
  const code = Object.keys(messages).find((k) => error.message!.includes(k));
  return code ? messages[code]! : error.message.length < 140 ? error.message : fallback;
}
