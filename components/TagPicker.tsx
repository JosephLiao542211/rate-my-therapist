"use client";

export const REVIEW_TAGS = [
  "Empathetic",
  "Evidence-Based",
  "LGBTQ+ Affirming",
  "Trauma-Informed",
  "Great Listener",
  "On Time",
  "Flexible Scheduling",
  "Accepts Insurance",
  "Challenging but Worth It",
  "Not a Good Fit",
];

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function TagPicker({ selected, onChange }: Props) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else if (selected.length < 5) {
      onChange([...selected, tag]);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">
        Tags <span className="text-gray-400 font-normal">(pick up to 5)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {REVIEW_TAGS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`text-xs font-semibold uppercase tracking-wide border rounded-full px-3 py-1 transition ${
                active
                  ? "bg-teal-600 border-teal-600 text-white"
                  : "border-gray-300 text-gray-600 hover:border-teal-400 hover:text-teal-600"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
