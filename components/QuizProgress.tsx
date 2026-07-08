export default function QuizProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
        <span>
          Step {Math.min(step, total)} of {total}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#151515] transition-all"
          style={{ width: `${Math.min(100, (step / total) * 100)}%` }}
        />
      </div>
    </div>
  );
}
