interface RatingOption {
  value: number;
  emoji: string;
  label: string;
}

interface RatingScaleProps {
  options: RatingOption[];
  value: number | null;
  onChange: (value: number) => void;
}

export default function RatingScale({ options, value, onChange }: RatingScaleProps) {
  return (
    <div className="flex justify-center gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rating-option flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              isSelected
                ? 'selected bg-gray-700 ring-2 ring-green-400'
                : 'hover:bg-gray-800'
            }`}
          >
            <span className={`text-3xl ${isSelected ? '' : 'grayscale opacity-50'}`}>
              {opt.emoji}
            </span>
            <span className={`text-xs ${isSelected ? 'text-green-400 font-medium' : 'text-gray-500'}`}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
