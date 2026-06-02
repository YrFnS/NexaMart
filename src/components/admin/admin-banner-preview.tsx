import React from "react";
import {
	GRADIENT_PRESETS,
	ICON_MAP,
} from "@/components/admin/admin-banner-constants";
import type { BannerData } from "@/components/admin/admin-banner-constants";

export function getGradientClasses(gradientKey: string | null): string {
	const preset = GRADIENT_PRESETS.find((p) => p.key === gradientKey);
	return preset
		? `bg-gradient-to-r ${preset.value}`
		: "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600";
}

export function BannerIcon({
	iconKey,
	className = "h-5 w-5",
}: {
	iconKey: string | null;
	className?: string;
}) {
	if (!iconKey) return null;
	const IconComp = ICON_MAP[iconKey];
	return IconComp ? <IconComp className={className} /> : null;
}

export function BannerPreviewCard({ banner }: { banner: BannerData }) {
	const gradientClasses = getGradientClasses(banner.gradient);

	return (
		<div
			className={`rounded-xl p-6 text-white ${gradientClasses} min-h-[120px] flex flex-col justify-center relative overflow-hidden`}
		>
			<BannerIcon
				iconKey={banner.icon}
				className="h-16 w-16 absolute top-4 right-4 opacity-30"
			/>
			<h3 className="text-xl font-bold mb-1 drop-shadow-sm">{banner.title}</h3>
			{banner.description && (
				<p className="text-sm text-white/80 mb-3 line-clamp-2">
					{banner.description}
				</p>
			)}
			{banner.ctaText && (
				<div>
					<span className="inline-block bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-colors">
						{banner.ctaText}
					</span>
				</div>
			)}
		</div>
	);
}

export function BannerMiniPreview({ banner }: { banner: BannerData }) {
	const gradientClasses = getGradientClasses(banner.gradient);

	return (
		<div
			className={`rounded-md px-3 py-2 text-white ${gradientClasses} flex items-center gap-2 min-w-[140px]`}
		>
			<BannerIcon iconKey={banner.icon} className="h-4 w-4 shrink-0" />
			<span className="text-xs font-medium truncate">{banner.title}</span>
		</div>
	);
}
