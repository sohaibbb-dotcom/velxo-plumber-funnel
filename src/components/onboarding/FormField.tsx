export function FormField({
  label,
  optional,
  required,
  ...props
}: {
  label: string;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-white/75">
        {label}
        {required && <span className="ml-1 text-violet-400">*</span>}
        {optional && <span className="ml-1 font-normal text-white/35">(optional)</span>}
      </span>
      <input
        required={required}
        {...props}
        className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-400/20"
      />
    </label>
  );
}

export function FormTextArea({
  label,
  optional,
  required,
  ...props
}: {
  label: string;
  optional?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-sm font-medium text-white/75">
        {label}
        {required && <span className="ml-1 text-violet-400">*</span>}
        {optional && <span className="ml-1 font-normal text-white/35">(optional)</span>}
      </span>
      <textarea
        required={required}
        {...props}
        rows={3}
        className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-400/20"
      />
    </label>
  );
}
