import { faqJsonLd } from "@/lib/seo";

export default function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <section className="mt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(items)) }}
      />
      <h2 className="text-lg font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.question}>
            <p className="font-semibold text-gray-800 text-sm">{item.question}</p>
            <p className="text-sm text-gray-600 mt-1">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
