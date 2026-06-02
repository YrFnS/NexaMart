import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { BannerData } from "@/components/admin/admin-banner-constants";
import { BannerMiniPreview } from "@/components/admin/admin-banner-preview";

interface AdminBannerTableProps {
  banners: BannerData[];
  loading: boolean;
  onToggleActive: (banner: BannerData) => void;
  onMove: (banner: BannerData, direction: "up" | "down") => void;
  onPreview: (banner: BannerData) => void;
  onEdit: (banner: BannerData) => void;
  onDelete: (banner: BannerData) => void;
  onCreateNew: () => void;
}

function getPositionBadge(position: string, t: (key: string) => string) {
  const map: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
    hero: { variant: "default", label: t("adminBannerPositionHero") },
    sidebar: { variant: "secondary", label: t("adminBannerPositionSidebar") },
    footer: { variant: "outline", label: t("adminBannerPositionFooter") },
  };
  const config = map[position] || { variant: "outline" as const, label: position };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function AdminBannerTable({
  banners,
  loading,
  onToggleActive,
  onMove,
  onPreview,
  onEdit,
  onDelete,
  onCreateNew,
}: AdminBannerTableProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        <span className="ms-3 text-muted-foreground">{t("loading")}</span>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t("adminBannerNoBanners")}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t("adminBannerNoBannersDesc")}</p>
          <Button onClick={onCreateNew} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
            <Plus className="h-4 w-4 me-2" />
            {t("adminBannerCreateNew")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">{t("adminBannerPreview")}</TableHead>
              <TableHead>{t("adminBannerTitle")}</TableHead>
              <TableHead>{t("adminBannerPosition")}</TableHead>
              <TableHead>{t("adminBannerSortOrder")}</TableHead>
              <TableHead>{t("adminStatus")}</TableHead>
              <TableHead>{t("adminActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => (
              <TableRow key={banner.id} className={!banner.isActive ? "opacity-60" : ""}>
                <TableCell>
                  <BannerMiniPreview banner={banner} />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{banner.title}</p>
                    {banner.titleAr && (
                      <p className="text-sm text-muted-foreground" dir="rtl">
                        {banner.titleAr}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getPositionBadge(banner.position, t)}</TableCell>
                <TableCell>
                  <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                    {banner.sortOrder}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={() => onToggleActive(banner)}
                      aria-label={t("adminBannerToggleActive")}
                    />
                    <Badge
                      variant={banner.isActive ? "default" : "secondary"}
                      className={
                        banner.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : ""
                      }
                    >
                      {banner.isActive ? t("adminActive") : t("adminInactive")}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMove(banner, "up")}
                      title={t("adminBannerMoveUp")}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMove(banner, "down")}
                      title={t("adminBannerMoveDown")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPreview(banner)}
                      title={t("adminBannerPreview")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(banner)}
                      title={t("edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(banner)}
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
