import { AD_FORMATS } from '../types/formats';
import { useFormat } from '../context/FormatContext';

export function FormatSelector() {
  const { format, setFormat } = useFormat();

  return (
    <select
      data-testid="format-selector"
      value={format.id}
      onChange={(event) => {
        const selected = AD_FORMATS.find((candidate) => candidate.id === event.target.value);
        if (selected) setFormat(selected);
      }}
      className="rounded-md border px-2 py-1 text-xs md:text-sm font-medium bg-white/[0.03] text-zinc-100 border-white/[0.12]"
    >
      {AD_FORMATS.map((candidate) => (
        <option key={candidate.id} value={candidate.id}>
          {candidate.label} ({candidate.width}x{candidate.height})
        </option>
      ))}
    </select>
  );
}
