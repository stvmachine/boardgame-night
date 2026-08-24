import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Eyebrow, Card, StatusPill, Avatar, Badge, Meter } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";

describe("Eyebrow", () => {
	it("renders children text", () => {
		render(<Eyebrow>Section Label</Eyebrow>);
		expect(screen.getByText("Section Label")).toBeInTheDocument();
	});

	it("accepts and applies className", () => {
		const { container } = render(<Eyebrow className="custom-class">Label</Eyebrow>);
		const el = container.firstChild as HTMLElement;
		expect(el.className).toContain("custom-class");
	});
});

describe("Card", () => {
	it("renders children", () => {
		render(
			<Card>
				<p>Hello</p>
			</Card>,
		);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("accepts and applies className", () => {
		const { container } = render(
			<Card className="custom-card">
				<p>Content</p>
			</Card>,
		);
		expect(container.firstChild).toHaveClass("custom-card");
	});
});

describe("StatusPill", () => {
	const cases: Array<[string, string]> = [
		["DRAFT", "DRAFT"],
		["INVITED", "INVITED"],
		["PICKING", "PICKING"],
		["IN_PROGRESS", "IN PROGRESS"],
		["COMPLETED", "COMPLETED"],
		["CANCELLED", "CANCELLED"],
	];

	it.each(cases)('renders "%s" as "%s"', (state, expectedLabel) => {
		render(<StatusPill state={state as any} />);
		expect(screen.getByText(expectedLabel)).toBeInTheDocument();
	});

	it("accepts and applies className", () => {
		const { container } = render(<StatusPill state="DRAFT" className="badge-custom" />);
		const el = container.firstChild as HTMLElement;
		expect(el.className).toContain("badge-custom");
	});
});

describe("Avatar", () => {
	it("renders initials from a full name", () => {
		render(<Avatar name="Alex Rivera" />);
		expect(screen.getByText("AR")).toBeInTheDocument();
	});

	it("renders a single-word name initial", () => {
		render(<Avatar name="Jordan" />);
		expect(screen.getByText("J")).toBeInTheDocument();
	});

	it("exposes the full name through the title attribute", () => {
		render(<Avatar name="Sam Okafor" />);
		expect(screen.getByTitle("Sam Okafor")).toBeInTheDocument();
	});

	it("picks a deterministic tone from a stable seed", () => {
		const { container: a } = render(<Avatar name="Alex Rivera" seed="alex" />);
		const { container: b } = render(<Avatar name="Different Person" seed="alex" />);
		const classA = (a.firstChild as HTMLElement).className;
		const classB = (b.firstChild as HTMLElement).className;
		// Same seed => same tone class, regardless of name.
		const tone = /bg-(primary|accent|info|bad|ink)/;
		expect(classA.match(tone)?.[0]).toBe(classB.match(tone)?.[0]);
	});
});

describe("Badge", () => {
	it("renders children text", () => {
		render(<Badge>Strategy</Badge>);
		expect(screen.getByText("Strategy")).toBeInTheDocument();
	});

	it("applies a tone variant", () => {
		const { container } = render(<Badge tone="good">Owned</Badge>);
		expect((container.firstChild as HTMLElement).className).toContain("text-good");
	});
});

describe("EmptyState", () => {
	it("renders title and description", () => {
		render(
			<EmptyState
				visual={<span>🔍</span>}
				title="No games found"
				description="Try adjusting your filters"
			/>,
		);
		expect(screen.getByText("No games found")).toBeInTheDocument();
		expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
	});

	it("renders optional actions when provided", () => {
		render(
			<EmptyState title="Empty" description="Nothing here" actions={<button>Add Game</button>} />,
		);
		expect(screen.getByRole("button", { name: "Add Game" })).toBeInTheDocument();
	});

	it("does not render actions when not provided", () => {
		render(<EmptyState title="Empty" description="Nothing here" />);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});

describe("Meter", () => {
	it("renders a fill width class matching the value", () => {
		const { container } = render(<Meter value={65} />);
		const bar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
		expect(bar.className).toContain("w-[65%]");
	});

	it("clamps the fill to a 0% minimum", () => {
		const { container } = render(<Meter value={-10} />);
		const bar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
		expect(bar.className).toContain("w-[0%]");
	});

	it("clamps the fill to a 100% maximum", () => {
		const { container } = render(<Meter value={150} />);
		const bar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
		expect(bar.className).toContain("w-[100%]");
	});

	it("has an accessible progressbar role and aria attributes", () => {
		render(<Meter value={42} label="Loading" />);
		const bar = screen.getByRole("progressbar");
		expect(bar).toHaveAttribute("aria-valuenow", "42");
		expect(bar).toHaveAttribute("aria-valuemin", "0");
		expect(bar).toHaveAttribute("aria-valuemax", "100");
		expect(bar).toHaveAttribute("aria-label", "Loading");
	});
});
