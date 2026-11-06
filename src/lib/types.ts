import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type Profile = Tables["profiles"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Drug = Tables["drugs"]["Row"];
export type DrugRequest = Tables["drug_requests"]["Row"];
export type DrugRequestItem = Tables["drug_request_items"]["Row"];
export type RequestEvent = Tables["request_events"]["Row"];
export type Consultation = Tables["consultations"]["Row"];
export type ConsultationMessage = Tables["consultation_messages"]["Row"];
export type ConsultationHours = Tables["consultation_hours"]["Row"];
export type PharmacySettings = Tables["pharmacy_settings"]["Row"];

export type AppRole = Enums["app_role"];
export type RequestStatus = Enums["request_status"];
export type ConsultStatus = Enums["consult_status"];
export type Fulfilment = Enums["fulfilment_type"];

export type ActionResult<T = undefined> =
  | ({ ok: true; message?: string } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
