import React from "react";

type RowBg = "white" | "blue";

type RowRounded = "header" | "dataRow";

const bgClass: Record<RowBg, string> = {
  white: "bg-myApp-white",
  blue: "bg-myApp-blue",
};

const roundedClass: Record<RowRounded, string> = {
	header: "rounded-3xl",
	dataRow: "rounded-xl",
  };

type TrProps = React.HTMLAttributes<HTMLTableRowElement> & {
	bg?: RowBg;
	row?: RowRounded;
};

export function Table({ className = "", ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full table-fixed border-separate border-spacing-y-2 ${className}`} {...props} />;
}

export function THead({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-myApp-blue text-myApp-cream text-button font-semibold ${className}`} {...props} />;
}

export function TBody({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody className={`text-myApp-blueDark text-body-changed font-medium ${className}`} {...props} />;
}

export function Tr({ bg = "white", row = "dataRow", className = "", ...props }: TrProps) {
	return (
	  <tr
		className={`${bgClass[bg]} ${roundedClass[row]} shadow-sm ${className}`}
		{...props}
	  />
	);
}

export function Th({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
	<th
	  className={`font-semibold py-4 text-center relative
				first:rounded-l-3xl last:rounded-r-3xl
				not-first:before:content-['']
				not-first:before:absolute
				not-first:before:left-0
				not-first:before:top-1/2
				not-first:before:-translate-y-1/2
				not-first:before:h-8
				not-first:before:w-0.75
				not-first:before:rounded-full
				not-first:before:bg-myApp-blueLight
				${className}`}
	  {...props}
	/>
  );
}

export function Td({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 bg-inherit first:rounded-l-xl last:rounded-r-xl ${className}`} {...props} />;
}