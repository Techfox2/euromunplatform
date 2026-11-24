import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "FAQ" };

// Questions about how registration on the platform works.
// Conference-specific details (fees, venue, dress code…) belong in the
// edition description, which the secretariat edits in the admin area.
const FAQ: { q: string; a: string }[] = [
  {
    q: "Who can apply?",
    a: "Schools can register a delegation through a faculty advisor, and students can also apply individually without a school.",
  },
  {
    q: "How do I apply as a school?",
    a: "The faculty advisor signs in with their email, chooses “School delegation” on the application page, and adds each student with their committee and country preferences. One application covers the whole delegation.",
  },
  {
    q: "Do I need a password?",
    a: "No. You sign in with a link we email to you. Open it on the same device and browser where you requested it.",
  },
  {
    q: "Can I change my application after submitting it?",
    a: "Yes, until the secretariat has reviewed it and while registration is open. You can withdraw your application at any time from your dashboard.",
  },
  {
    q: "How are countries and committees assigned?",
    a: "The secretariat assigns countries and committees by hand, using the preferences you give as a guide. Preferences are not guaranteed.",
  },
  {
    q: "When will I hear back?",
    a: "The decision appears on your dashboard as soon as the secretariat has reviewed your application, together with any message from them.",
  },
  {
    q: "Which rules of procedure are used?",
    a: "All committees follow BERMUN rules of procedure.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <PageHeader title="Frequently asked questions" />
      <dl className="flex flex-col divide-y divide-border">
        {FAQ.map(({ q, a }) => (
          <div key={q} className="py-5">
            <dt className="font-medium">{q}</dt>
            <dd className="mt-2 text-sm text-muted">{a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
