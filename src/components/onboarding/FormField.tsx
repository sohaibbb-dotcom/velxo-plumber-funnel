export function FormField({
  label,
  optional,
  ...props
}: {
  label: string;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {optional && <span className="ml-1 font-normal text-zinc-400">(optional)</span>}
      </span>
      <input
        {...props}
        className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
      />
    </label>
  );
}

export function FormTextArea({
  label,
  optional,
  ...props
}: {
  label: string;
  optional?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {optional && <span className="ml-1 font-normal text-zinc-400">(optional)</span>}
      </span>
      <textarea
        {...props}
        rows={3}
        className="resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
      />
    </label>
  );
}
