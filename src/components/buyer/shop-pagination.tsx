import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface ShopPaginationProps {
	locale: string;
	page: number;
	pages: number;
	onPageChange: (page: number) => void;
}

export function ShopPagination({
	locale,
	page,
	pages,
	onPageChange,
}: ShopPaginationProps) {
	const { t } = useI18n();
	const isRTL = locale === "ar";

	if (pages <= 1) return null;

	const getPageNumbers = (): (number | "ellipsis")[] => {
		const nums: (number | "ellipsis")[] = [];
		if (pages <= 7) {
			for (let i = 1; i <= pages; i++) nums.push(i);
		} else if (page <= 3) {
			for (let i = 1; i <= 4; i++) nums.push(i);
			nums.push("ellipsis");
			nums.push(pages);
		} else if (page >= pages - 2) {
			nums.push(1);
			nums.push("ellipsis");
			for (let i = pages - 3; i <= pages; i++) nums.push(i);
		} else {
			nums.push(1);
			nums.push("ellipsis");
			for (let i = page - 1; i <= page + 1; i++) nums.push(i);
			nums.push("ellipsis");
			nums.push(pages);
		}
		return nums;
	};

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
			<p className="text-sm text-muted-foreground">
				{t("pageOf", { current: page, total: pages })}
			</p>

			<div className="flex items-center gap-1.5">
				<Button
					variant="outline"
					size="sm"
					disabled={page <= 1}
					onClick={() => onPageChange(Math.max(1, page - 1))}
					className="gap-1 h-9 px-3 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 disabled:opacity-40"
				>
					{isRTL ? (
						<ChevronRight className="size-4" />
					) : (
						<ChevronLeft className="size-4" />
					)}
					<span className="hidden sm:inline">{t("back")}</span>
				</Button>

				{getPageNumbers().map((num, idx) =>
					num === "ellipsis" ? (
						<span
							key={`ellipsis-${idx}`}
							className="px-1 text-muted-foreground"
						>
							…
						</span>
					) : (
						<Button
							key={num}
							variant={page === num ? "default" : "outline"}
							size="sm"
							className={`h-9 w-9 p-0 transition-all duration-200 ${
								page === num
									? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/25 border-amber-600"
									: "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
							}`}
							onClick={() => onPageChange(num)}
						>
							{num}
						</Button>
					),
				)}

				<Button
					variant="outline"
					size="sm"
					disabled={page >= pages}
					onClick={() => onPageChange(Math.min(pages, page + 1))}
					className="gap-1 h-9 px-3 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 disabled:opacity-40"
				>
					<span className="hidden sm:inline">{t("next")}</span>
					{isRTL ? (
						<ChevronLeft className="size-4" />
					) : (
						<ChevronRight className="size-4" />
					)}
				</Button>
			</div>
		</div>
	);
}
