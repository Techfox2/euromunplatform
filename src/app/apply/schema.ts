import { z } from "zod";

// Shared between the client form (for types) and the Server Action (validation).

const trimmed = (max: number) => z.string().trim().max(max);

export const delegateSchema = z.object({
  full_name: trimmed(120).min(2, "Enter the delegate's full name"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  grade: trimmed(40),
  mun_experience: z.coerce.number().int().min(0).max(100),
  committee_preferences: z.array(z.uuid()).max(3),
  country_preferences: z.array(trimmed(80)).max(3),
  notes: trimmed(1000),
});

export const applicationSchema = z
  .object({
    kind: z.enum(["school", "individual"]),
    contact_name: trimmed(120).min(2, "Enter your full name"),
    contact_phone: trimmed(40),
    school_name: trimmed(160),
    school_city: trimmed(120),
    school_country: trimmed(120),
    motivation: trimmed(2000),
    delegates: z.array(delegateSchema).min(1, "Add at least one delegate"),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "school" && v.school_name.length < 2) {
      ctx.addIssue({ code: "custom", path: ["school_name"], message: "Enter the school's name" });
    }
    if (v.kind === "individual" && v.delegates.length !== 1) {
      ctx.addIssue({ code: "custom", path: ["delegates"], message: "An individual application has one delegate" });
    }
  });

export type ApplicationInput = z.input<typeof applicationSchema>;
export type DelegateInput = z.input<typeof delegateSchema>;

export type ApplyState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Flatten zod issues to { "delegates.0.email": "message" }. */
export function issuesToFieldErrors(issues: z.core.$ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
