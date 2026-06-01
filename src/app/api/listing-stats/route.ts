// @ts-nocheck
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		// Get aggregated stats from Product model
		const products = await db.product.findMany({
			where: { status: "active" },
			select: {
				id: true,
				name: true,
				nameAr: true,
				views: true,
				soldCount: true,
				rating: true,
			},
			take: 20,
			orderBy: { views: "desc" },
		});

		const totalViews = products.reduce((sum, p) => sum + p.views, 0);
		const totalContacts = products.reduce((sum, p) => sum + p.soldCount, 0);
		const totalReach = totalViews * 3; // Estimate reach as 3x views

		const listings = products.map((p) => ({
			productId: p.id,
			productNameEn: p.name,
			productNameAr: p.nameAr,
			views: p.views,
			contacts: p.soldCount,
			reach: p.views * 3,
			clickThroughRate:
				p.views > 0
					? parseFloat(((p.soldCount / p.views) * 100).toFixed(1))
					: 0,
			viewsData: [],
			similarAvgViews: 0,
			boostCost: 5.99,
		}));

		const avgCTR =
			listings.length > 0
				? parseFloat(
						(
							listings.reduce((sum, l) => sum + l.clickThroughRate, 0) /
							listings.length
						).toFixed(1),
					)
				: 0;

		return NextResponse.json({
			summary: {
				totalViews,
				totalContacts,
				totalReach,
				avgCTR,
				viewsChange: 0,
				contactsChange: 0,
				reachChange: 0,
				ctrChange: 0,
			},
			listings,
		});
	} catch (error) {
		console.error("Listing Stats API error:", error);
		return NextResponse.json({
			summary: {
				totalViews: 0,
				totalContacts: 0,
				totalReach: 0,
				avgCTR: 0,
				viewsChange: 0,
				contactsChange: 0,
				reachChange: 0,
				ctrChange: 0,
			},
			listings: [],
		});
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { productId, action } = body;

		if (!productId) {
			return NextResponse.json(
				{ error: "Product ID is required" },
				{ status: 400 },
			);
		}

		// Verify the product exists
		const product = await db.product.findUnique({ where: { id: productId } });
		if (!product) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		if (action === "boost") {
			const updatedProduct = await db.product.update({
				where: { id: productId },
				data: { isFeatured: true },
			});

			return NextResponse.json({
				boosted: true,
				productId,
				cost: 5.99,
				estimatedReachIncrease: "+45%",
				duration: "7 days",
				product: {
					id: updatedProduct.id,
					name: updatedProduct.name,
					nameAr: updatedProduct.nameAr,
					isFeatured: updatedProduct.isFeatured,
					isSale: updatedProduct.isSale,
				},
			});
		}

		if (action === "sale") {
			const updatedProduct = await db.product.update({
				where: { id: productId },
				data: { isSale: true },
			});

			return NextResponse.json({
				saleEnabled: true,
				productId,
				product: {
					id: updatedProduct.id,
					name: updatedProduct.name,
					nameAr: updatedProduct.nameAr,
					isFeatured: updatedProduct.isFeatured,
					isSale: updatedProduct.isSale,
				},
			});
		}

		return NextResponse.json(
			{ error: "Unknown action. Supported actions: boost, sale" },
			{ status: 400 },
		);
	} catch (error) {
		console.error("Listing Stats POST error:", error);
		return NextResponse.json(
			{ error: "Failed to update product" },
			{ status: 500 },
		);
	}
}
