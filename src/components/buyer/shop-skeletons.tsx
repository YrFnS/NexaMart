import React from "react";
import { Card } from "@/components/ui/card";

export function ShopSkeletonCard() {
	return (
		<div className="bg-card rounded-xl border border-border overflow-hidden">
			<div className="aspect-square skeleton-emerald relative overflow-hidden">
				<div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent" />
				<div className="absolute top-2 start-2 h-5 w-14 skeleton-emerald rounded-full" />
				<div className="absolute top-2 end-2 h-5 w-10 skeleton-emerald rounded-full" />
			</div>
			<div className="p-3 space-y-2">
				<div className="h-3 w-1/3 skeleton-emerald rounded" />
				<div className="h-4 w-3/4 skeleton-emerald rounded" />
				<div className="flex items-center gap-0.5">
					{Array.from({ length: 5 }, (_, j) => (
						<div key={j} className="size-3 skeleton-emerald rounded-sm" />
					))}
					<div className="h-3 w-12 skeleton-emerald rounded ms-1" />
				</div>
				<div className="flex items-baseline gap-2">
					<div className="h-5 w-16 skeleton-emerald rounded" />
					<div className="h-3 w-12 skeleton-emerald rounded" />
				</div>
				<div className="h-8 w-full skeleton-emerald rounded-lg mt-1" />
			</div>
		</div>
	);
}

export function ShopSkeletonListItem() {
	return (
		<Card className="overflow-hidden">
			<div className="flex gap-4 p-4">
				<div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-lg skeleton-emerald" />
				<div className="flex-1 space-y-2">
					<div className="h-4 w-3/4 skeleton-emerald rounded" />
					<div className="h-3 w-1/4 skeleton-emerald rounded" />
					<div className="flex items-center gap-0.5">
						{Array.from({ length: 5 }, (_, j) => (
							<div key={j} className="size-3 skeleton-emerald rounded-sm" />
						))}
					</div>
					<div className="flex items-baseline gap-2">
						<div className="h-5 w-20 skeleton-emerald rounded" />
						<div className="h-3 w-16 skeleton-emerald rounded" />
					</div>
					<div className="h-8 w-28 skeleton-emerald rounded-lg" />
				</div>
			</div>
		</Card>
	);
}
