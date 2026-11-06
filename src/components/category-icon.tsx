import {
  Activity,
  Droplets01,
  HeartHand,
  MedicalCross,
  Shield01,
  Sun,
  Thermometer01,
  Virus,
  Wind01,
  HeartRounded,
} from "@untitledui/icons";
import type { FC } from "react";

const map: Record<string, FC<{ className?: string }>> = {
  "pain-fever": Thermometer01,
  malaria: Virus,
  antibiotics: Shield01,
  "cough-cold-allergy": Wind01,
  "digestive-health": Droplets01,
  "heart-bp": HeartRounded,
  "diabetes-care": Activity,
  vitamins: Sun,
  "mother-baby": HeartHand,
  "first-aid-devices": MedicalCross,
};

export function categoryIcon(slug: string) {
  return map[slug] ?? MedicalCross;
}
