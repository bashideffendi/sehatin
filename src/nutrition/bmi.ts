/**
 * BMI calculator with Asia-Pacific cutoffs.
 *
 * Standard WHO cutoffs underestimate health risk untuk populasi Asia karena
 * body fat distribution beda (visceral fat lebih tinggi di BMI lebih rendah).
 * WHO Asia-Pacific guidelines (2000) pakai threshold lebih rendah, more relevant
 * untuk Indonesia.
 *
 * Reference:
 *   - WHO Expert Consultation (2004) "Appropriate body-mass index for Asian
 *     populations and its implications for policy and intervention strategies"
 *   - Kementerian Kesehatan RI mengikuti panduan Asia-Pacific.
 */

export type BmiCategory =
  | "underweight_severe"
  | "underweight"
  | "normal"
  | "overweight"
  | "obese_1"
  | "obese_2";

export type HealthRisk = "low" | "moderate" | "high" | "very_high";

export interface BmiResult {
  bmi: number;
  category_who: BmiCategory; // WHO global cutoffs
  category_asia: BmiCategory; // WHO Asia-Pacific (RI default)
  health_risk_asia: HealthRisk;
  ideal_weight_range_kg: { min: number; max: number }; // Asia-Pacific normal range × tinggi²
  weight_delta_kg: { to_min: number; to_max: number }; // selisih dari current ke ideal
  notes: string[];
  bmi_label_id: string; // label Indonesia ("Berat badan normal", dll)
}

// WHO global cutoffs (untuk reference, Western populations)
function categorizeWHO(bmi: number): BmiCategory {
  if (bmi < 16) return "underweight_severe";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  if (bmi < 35) return "obese_1";
  return "obese_2";
}

// WHO Asia-Pacific cutoffs (dipake Kemenkes RI)
function categorizeAsiaPacific(bmi: number): BmiCategory {
  if (bmi < 16) return "underweight_severe";
  if (bmi < 18.5) return "underweight";
  if (bmi < 23) return "normal";
  if (bmi < 25) return "overweight";
  if (bmi < 30) return "obese_1";
  return "obese_2";
}

const LABEL_ID: Record<BmiCategory, string> = {
  underweight_severe: "Sangat kurus",
  underweight: "Kurus",
  normal: "Normal",
  overweight: "Gemuk / Berat berlebih",
  obese_1: "Obesitas tingkat 1",
  obese_2: "Obesitas tingkat 2",
};

function riskFromAsiaCategory(cat: BmiCategory): HealthRisk {
  switch (cat) {
    case "underweight_severe":
      return "very_high";
    case "underweight":
      return "moderate";
    case "normal":
      return "low";
    case "overweight":
      return "moderate";
    case "obese_1":
      return "high";
    case "obese_2":
      return "very_high";
  }
}

export interface BmiInput {
  weight_kg: number;
  height_cm: number;
  waist_cm?: number; // optional, untuk waist circumference risk
  sex?: "m" | "f"; // dipake bareng waist
}

export function calculateBMI(input: BmiInput): BmiResult {
  const { weight_kg, height_cm, waist_cm, sex } = input;
  const h_m = height_cm / 100;
  const bmi = Math.round((weight_kg / (h_m * h_m)) * 10) / 10;

  const category_who = categorizeWHO(bmi);
  const category_asia = categorizeAsiaPacific(bmi);
  let health_risk_asia = riskFromAsiaCategory(category_asia);

  // Ideal weight range = normal BMI 18.5-22.9 (Asia-Pacific) × tinggi²
  const idealMin = Math.round(18.5 * h_m * h_m * 10) / 10;
  const idealMax = Math.round(22.9 * h_m * h_m * 10) / 10;

  const notes: string[] = [];

  // Waist circumference risk modifier (Asia-Pacific)
  // Pria > 90 cm atau wanita > 80 cm = central obesity (risk multiplier)
  if (typeof waist_cm === "number" && sex) {
    const waistRiskThreshold = sex === "m" ? 90 : 80;
    if (waist_cm > waistRiskThreshold) {
      notes.push(
        `Lingkar pinggang ${waist_cm} cm > ${waistRiskThreshold} cm (cut-off ${sex === "m" ? "pria" : "wanita"} Asia-Pacific) — indikasi obesitas sentral. Risk metabolik naik 1 tier.`,
      );
      // Bump risk one level
      if (health_risk_asia === "low") health_risk_asia = "moderate";
      else if (health_risk_asia === "moderate") health_risk_asia = "high";
      else if (health_risk_asia === "high") health_risk_asia = "very_high";
    }
  } else if (typeof waist_cm === "number" && !sex) {
    notes.push(
      `Lingkar pinggang diberikan tapi sex tidak — risk penilaian central obesity di-skip.`,
    );
  }

  // BMI-specific notes
  if (category_who !== category_asia) {
    notes.push(
      `Cut-off Asia-Pacific (${LABEL_ID[category_asia]}) lebih ketat dari WHO global (${LABEL_ID[category_who]}). Risk dihitung pakai Asia-Pacific.`,
    );
  }

  if (category_asia === "underweight" || category_asia === "underweight_severe") {
    notes.push(
      "Berat di bawah normal — fokus surplus kalori bertahap + protein cukup, bukan defisit.",
    );
  } else if (category_asia === "overweight") {
    notes.push(
      "Overweight Asia-Pacific. Defisit moderat 15-20% TDEE plus latihan resistensi efektif.",
    );
  } else if (category_asia === "obese_1" || category_asia === "obese_2") {
    notes.push(
      "Obesitas — pertimbangkan konsultasi medis sebelum program defisit agresif, terutama jika ada komorbid (DM/hipertensi).",
    );
  }

  return {
    bmi,
    category_who,
    category_asia,
    health_risk_asia,
    ideal_weight_range_kg: { min: idealMin, max: idealMax },
    weight_delta_kg: {
      to_min: Math.round((idealMin - weight_kg) * 10) / 10,
      to_max: Math.round((idealMax - weight_kg) * 10) / 10,
    },
    notes,
    bmi_label_id: LABEL_ID[category_asia],
  };
}

export function formatBmi(r: BmiResult): string {
  const lines: string[] = [];
  lines.push(`BMI:           ${r.bmi}`);
  lines.push(`Kategori:      ${r.bmi_label_id} (Asia-Pacific)`);
  if (r.category_who !== r.category_asia) {
    lines.push(`  WHO global:  ${LABEL_ID[r.category_who]}`);
  }
  lines.push(`Risk metabolik: ${r.health_risk_asia.toUpperCase()}`);
  lines.push("");
  lines.push(
    `Ideal weight range: ${r.ideal_weight_range_kg.min} - ${r.ideal_weight_range_kg.max} kg (Asia-Pacific normal BMI)`,
  );
  if (r.weight_delta_kg.to_min < 0 && r.weight_delta_kg.to_max < 0) {
    // user over ideal max
    lines.push(
      `Selisih: ${Math.abs(r.weight_delta_kg.to_max)} kg di atas batas atas ideal`,
    );
  } else if (r.weight_delta_kg.to_min > 0 && r.weight_delta_kg.to_max > 0) {
    // user below ideal min
    lines.push(
      `Selisih: ${r.weight_delta_kg.to_min} kg di bawah batas bawah ideal`,
    );
  } else {
    lines.push(`Dalam range ideal ✓`);
  }
  if (r.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");
    for (const n of r.notes) lines.push(`  - ${n}`);
  }
  return lines.join("\n");
}
