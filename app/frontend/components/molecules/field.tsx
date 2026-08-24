import { useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/input";

/**
 * Field — a labelled input with optional hint and error. Used across the auth
 * and account forms.
 */
export function Field({
	label,
	hint,
	error,
	className,
	id,
	...props
}: React.ComponentProps<"input"> & {
	label: string;
	hint?: string;
	error?: string;
}) {
	const autoId = useId();
	const fieldId = id ?? autoId;
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<label htmlFor={fieldId} className="text-sm font-medium text-ink">
				{label}
			</label>
			<Input
				id={fieldId}
				aria-invalid={error ? true : undefined}
				className={
					error ? "border-bad focus-visible:border-bad focus-visible:ring-bad/25" : undefined
				}
				{...props}
			/>
			{error ? (
				<p className="text-xs text-bad" role="alert">
					{error}
				</p>
			) : hint ? (
				<p className="text-xs text-muted">{hint}</p>
			) : null}
		</div>
	);
}
