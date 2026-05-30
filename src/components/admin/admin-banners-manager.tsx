'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { adminFetch } from '@/lib/admin-api';
import { toast } from 'sonner';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  ShoppingBag,
  Star,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BannerData {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  image: string | null;
  link: string | null;
  ctaText: string | null;
  ctaTextAr: string | null;
  ctaLink: string | null;
  gradient: string | null;
  icon: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface BannerFormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  link: string;
  ctaText: string;
  ctaTextAr: string;
  ctaLink: string;
  gradient: string;
  icon: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GRADIENT_PRESETS = [
  { key: 'emerald-teal-cyan', value: 'from-emerald-600 via-teal-600 to-cyan-600', i18nKey: 'adminBannerGradientEmeraldTealCyan' },
  { key: 'teal-emerald-green', value: 'from-teal-600 via-emerald-600 to-green-600', i18nKey: 'adminBannerGradientTealEmeraldGreen' },
  { key: 'cyan-teal-emerald', value: 'from-cyan-600 via-teal-600 to-emerald-600', i18nKey: 'adminBannerGradientCyanTealEmerald' },
  { key: 'amber-orange-red', value: 'from-amber-500 via-orange-500 to-red-500', i18nKey: 'adminBannerGradientAmberOrangeRed' },
  { key: 'violet-purple-pink', value: 'from-violet-600 via-purple-600 to-pink-600', i18nKey: 'adminBannerGradientVioletPurplePink' },
  { key: 'rose-pink-purple', value: 'from-rose-500 via-pink-500 to-purple-500', i18nKey: 'adminBannerGradientRosePinkPurple' },
];

const ICON_OPTIONS = [
  { key: 'Sparkles', i18nKey: 'adminBannerIconSparkles' },
  { key: 'Zap', i18nKey: 'adminBannerIconZap' },
  { key: 'TrendingUp', i18nKey: 'adminBannerIconTrendingUp' },
  { key: 'Flame', i18nKey: 'adminBannerIconFlame' },
  { key: 'ShoppingBag', i18nKey: 'adminBannerIconShoppingBag' },
  { key: 'Star', i18nKey: 'adminBannerIconStar' },
];

const POSITION_OPTIONS = ['hero', 'sidebar', 'footer'];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  ShoppingBag,
  Star,
};

const EMPTY_FORM: BannerFormData = {
  title: '',
  titleAr: '',
  description: '',
  descriptionAr: '',
  image: '',
  link: '',
  ctaText: '',
  ctaTextAr: '',
  ctaLink: '',
  gradient: 'emerald-teal-cyan',
  icon: 'Sparkles',
  position: 'hero',
  sortOrder: 0,
  isActive: true,
  startDate: '',
  endDate: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminBannersManager() {
  const { t } = useI18n();

  // State
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [form, setForm] = useState<BannerFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BannerData | null>(null);

  // Preview
  const [previewBanner, setPreviewBanner] = useState<BannerData | null>(null);

  // ─── Fetch banners ─────────────────────────────────────────────────────────

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/banners');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err) {
      console.error('Fetch banners error:', err);
      toast.error(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // ─── Filtered banners ──────────────────────────────────────────────────────

  const filteredBanners = banners.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.titleAr && b.titleAr.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPosition = positionFilter === 'all' || b.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  // Sort by sortOrder ascending
  const sortedBanners = [...filteredBanners].sort((a, b) => a.sortOrder - b.sortOrder);

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const totalBanners = banners.length;
  const activeBanners = banners.filter((b) => b.isActive).length;

  // ─── Form handlers ─────────────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingBanner(null);
    setForm({ ...EMPTY_FORM, sortOrder: banners.length });
    setFormOpen(true);
  };

  const openEditForm = (banner: BannerData) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      titleAr: banner.titleAr || '',
      description: banner.description || '',
      descriptionAr: banner.descriptionAr || '',
      image: banner.image || '',
      link: banner.link || '',
      ctaText: banner.ctaText || '',
      ctaTextAr: banner.ctaTextAr || '',
      ctaLink: banner.ctaLink || '',
      gradient: banner.gradient || 'emerald-teal-cyan',
      icon: banner.icon || 'Sparkles',
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(t('adminBannerTitle'));
      return;
    }
    setSaving(true);
    try {
      if (editingBanner) {
        // Update
        const res = await adminFetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bannerId: editingBanner.id,
            ...form,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update');
        }
        toast.success(t('adminBannerUpdated'));
      } else {
        // Create
        const res = await adminFetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create');
        }
        toast.success(t('adminBannerCreated'));
      }
      setFormOpen(false);
      fetchBanners();
    } catch (err) {
      console.error('Save banner error:', err);
      toast.error(t('somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle active ─────────────────────────────────────────────────────────

  const handleToggleActive = async (banner: BannerData) => {
    try {
      const res = await adminFetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bannerId: banner.id,
          isActive: !banner.isActive,
        }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b)),
      );
    } catch (err) {
      console.error('Toggle active error:', err);
      toast.error(t('somethingWentWrong'));
    }
  };

  // ─── Move up/down ──────────────────────────────────────────────────────────

  const handleMove = async (banner: BannerData, direction: 'up' | 'down') => {
    const samePositionBanners = banners
      .filter((b) => b.position === banner.position)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = samePositionBanners.findIndex((b) => b.id === banner.id);
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === samePositionBanners.length - 1)
    ) {
      return;
    }
    const swapWith = samePositionBanners[direction === 'up' ? idx - 1 : idx + 1];

    // Optimistic update
    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === banner.id) return { ...b, sortOrder: swapWith.sortOrder };
        if (b.id === swapWith.id) return { ...b, sortOrder: banner.sortOrder };
        return b;
      }),
    );

    try {
      await Promise.all([
        adminFetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bannerId: banner.id, sortOrder: swapWith.sortOrder }),
        }),
        adminFetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bannerId: swapWith.id, sortOrder: banner.sortOrder }),
        }),
      ]);
    } catch (err) {
      console.error('Reorder error:', err);
      fetchBanners();
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminFetch(`/api/admin/banners?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(t('adminBannerDeletedSuccess'));
      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(t('somethingWentWrong'));
    } finally {
      setDeleteTarget(null);
    }
  };

  // ─── Gradient swatch ───────────────────────────────────────────────────────

  const getGradientClasses = (gradientKey: string | null) => {
    const preset = GRADIENT_PRESETS.find((p) => p.key === gradientKey);
    return preset ? `bg-gradient-to-r ${preset.value}` : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600';
  };

  // ─── Render icon ───────────────────────────────────────────────────────────

  const renderIcon = (iconKey: string | null, className = 'h-5 w-5') => {
    if (!iconKey) return null;
    const IconComp = ICON_MAP[iconKey];
    return IconComp ? <IconComp className={className} /> : null;
  };

  // ─── Preview card ──────────────────────────────────────────────────────────

  const renderPreview = (banner: BannerData) => {
    const gradientClasses = getGradientClasses(banner.gradient);
    const IconComp = banner.icon ? ICON_MAP[banner.icon] : null;

    return (
      <div
        className={`rounded-xl p-6 text-white ${gradientClasses} min-h-[120px] flex flex-col justify-center relative overflow-hidden`}
      >
        {IconComp && (
          <div className="absolute top-4 right-4 opacity-30">
            <IconComp className="h-16 w-16" />
          </div>
        )}
        <h3 className="text-xl font-bold mb-1 drop-shadow-sm">{banner.title}</h3>
        {banner.description && (
          <p className="text-sm text-white/80 mb-3 line-clamp-2">{banner.description}</p>
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
  };

  // ─── Mini preview for table ────────────────────────────────────────────────

  const renderMiniPreview = (banner: BannerData) => {
    const gradientClasses = getGradientClasses(banner.gradient);
    const IconComp = banner.icon ? ICON_MAP[banner.icon] : null;

    return (
      <div
        className={`rounded-md px-3 py-2 text-white ${gradientClasses} flex items-center gap-2 min-w-[140px]`}
      >
        {IconComp && <IconComp className="h-4 w-4 shrink-0" />}
        <span className="text-xs font-medium truncate">{banner.title}</span>
      </div>
    );
  };

  // ─── Position badge color ──────────────────────────────────────────────────

  const getPositionBadge = (position: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      hero: { variant: 'default', label: t('adminBannerPositionHero') },
      sidebar: { variant: 'secondary', label: t('adminBannerPositionSidebar') },
      footer: { variant: 'outline', label: t('adminBannerPositionFooter') },
    };
    const config = map[position] || { variant: 'outline' as const, label: position };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('adminBannerTotalBanners')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{totalBanners}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('adminBannerActiveBanners')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-teal-600">{activeBanners}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('adminSearchBanners')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Position filter */}
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('adminBannerFilterPosition')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('adminBannerAllPositions')}</SelectItem>
              {POSITION_OPTIONS.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {t(`adminBannerPosition${pos.charAt(0).toUpperCase() + pos.slice(1)}` as string)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateForm} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
          <Plus className="h-4 w-4 me-2" />
          {t('adminBannerCreateNew')}
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          <span className="ms-3 text-muted-foreground">{t('loading')}</span>
        </div>
      ) : sortedBanners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t('adminBannerNoBanners')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('adminBannerNoBannersDesc')}</p>
            <Button onClick={openCreateForm} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Plus className="h-4 w-4 me-2" />
              {t('adminBannerCreateNew')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">{t('adminBannerPreview')}</TableHead>
                  <TableHead>{t('adminBannerTitle')}</TableHead>
                  <TableHead>{t('adminBannerPosition')}</TableHead>
                  <TableHead>{t('adminBannerSortOrder')}</TableHead>
                  <TableHead>{t('adminStatus')}</TableHead>
                  <TableHead>{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBanners.map((banner) => (
                  <TableRow key={banner.id} className={!banner.isActive ? 'opacity-60' : ''}>
                    <TableCell>{renderMiniPreview(banner)}</TableCell>
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
                    <TableCell>{getPositionBadge(banner.position)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                        {banner.sortOrder}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.isActive}
                          onCheckedChange={() => handleToggleActive(banner)}
                          aria-label={t('adminBannerToggleActive')}
                        />
                        <Badge
                          variant={banner.isActive ? 'default' : 'secondary'}
                          className={
                            banner.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                              : ''
                          }
                        >
                          {banner.isActive ? t('adminActive') : t('adminInactive')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMove(banner, 'up')}
                          title={t('adminBannerMoveUp')}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMove(banner, 'down')}
                          title={t('adminBannerMoveDown')}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewBanner(banner)}
                          title={t('adminBannerPreview')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditForm(banner)}
                          title={t('edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(banner)}
                          title={t('delete')}
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
      )}

      {/* ─── Create / Edit Dialog ─────────────────────────────────────────────── */}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? t('adminBannerEditExisting') : t('adminBannerCreateNew')}
            </DialogTitle>
            <DialogDescription>
              {editingBanner ? t('adminEditBannerDesc') : t('adminAddBannerDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('adminBannerTitle')} *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={t('adminBannerTitle')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleAr">{t('adminBannerTitleAr')}</Label>
                <Input
                  id="titleAr"
                  value={form.titleAr}
                  onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
                  placeholder={t('adminBannerTitleAr')}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">{t('adminBannerDescription')}</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t('adminBannerDescription')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{t('adminBannerDescriptionAr')}</Label>
                <Textarea
                  id="descriptionAr"
                  value={form.descriptionAr}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
                  placeholder={t('adminBannerDescriptionAr')}
                  dir="rtl"
                  rows={3}
                />
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctaText">{t('adminBannerCTAText')}</Label>
                <Input
                  id="ctaText"
                  value={form.ctaText}
                  onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                  placeholder={t('adminBannerCTAText')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaTextAr">{t('adminBannerCTATextAr')}</Label>
                <Input
                  id="ctaTextAr"
                  value={form.ctaTextAr}
                  onChange={(e) => setForm((f) => ({ ...f, ctaTextAr: e.target.value }))}
                  placeholder={t('adminBannerCTATextAr')}
                  dir="rtl"
                />
              </div>
            </div>

            {/* CTA Link */}
            <div className="space-y-2">
              <Label htmlFor="ctaLink">{t('adminBannerCTALink')}</Label>
              <Input
                id="ctaLink"
                value={form.ctaLink}
                onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
                placeholder="/shop, /deals, https://..."
              />
            </div>

            <Separator />

            {/* Gradient */}
            <div className="space-y-2">
              <Label>{t('adminBannerGradient')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gradient: preset.key }))}
                    className={`rounded-lg p-3 text-white text-xs font-medium transition-all border-2 ${
                      form.gradient === preset.key
                        ? 'border-white ring-2 ring-emerald-500 scale-105'
                        : 'border-transparent hover:border-white/30'
                    } bg-gradient-to-r ${preset.value}`}
                  >
                    {t(preset.i18nKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>{t('adminBannerIcon')}</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = ICON_MAP[opt.key];
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon: opt.key }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        form.icon === opt.key
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-border hover:border-emerald-300'
                      }`}
                    >
                      {IconComp && <IconComp className="h-4 w-4" />}
                      <span>{t(opt.i18nKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Position & Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminBannerPosition')}</Label>
                <Select
                  value={form.position}
                  onValueChange={(val) => setForm((f) => ({ ...f, position: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {t(`adminBannerPosition${pos.charAt(0).toUpperCase() + pos.slice(1)}` as string)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t('adminBannerSortOrder')}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
              <Label htmlFor="isActive">{t('adminBannerActive')}</Label>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('adminBannerStartDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t('adminBannerEndDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Image & Link (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image">{t('adminBannerImage')}</Label>
                <Input
                  id="image"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">{t('adminBannerLink')}</Label>
                <Input
                  id="link"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-2">
              <Label>{t('adminBannerPreview')}</Label>
              {renderPreview({
                id: 'preview',
                title: form.title || 'Banner Title',
                titleAr: form.titleAr || null,
                description: form.description || null,
                descriptionAr: form.descriptionAr || null,
                image: form.image || null,
                link: form.link || null,
                ctaText: form.ctaText || null,
                ctaTextAr: form.ctaTextAr || null,
                ctaLink: form.ctaLink || null,
                gradient: form.gradient || null,
                icon: form.icon || null,
                position: form.position,
                sortOrder: form.sortOrder,
                isActive: form.isActive,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                createdAt: new Date().toISOString(),
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? t('processing') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminDeleteBanner')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminDeleteBannerConfirm')} &ldquo;{deleteTarget?.title}&rdquo;
              <br />
              <span className="text-destructive font-medium">{t('adminDeleteBannerWarning')}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Preview Dialog ──────────────────────────────────────────────────── */}

      <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('adminBannerPreview')}</DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <div className="space-y-4">
              {renderPreview(previewBanner)}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('adminBannerPosition')}:</span>{' '}
                  {getPositionBadge(previewBanner.position)}
                </div>
                <div>
                  <span className="text-muted-foreground">{t('adminBannerSortOrder')}:</span>{' '}
                  {previewBanner.sortOrder}
                </div>
                <div>
                  <span className="text-muted-foreground">{t('adminStatus')}:</span>{' '}
                  <Badge
                    variant={previewBanner.isActive ? 'default' : 'secondary'}
                    className={
                      previewBanner.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                        : ''
                    }
                  >
                    {previewBanner.isActive ? t('adminActive') : t('adminInactive')}
                  </Badge>
                </div>
                {previewBanner.startDate && (
                  <div>
                    <span className="text-muted-foreground">{t('adminStartDate')}:</span>{' '}
                    {previewBanner.startDate.split('T')[0]}
                  </div>
                )}
                {previewBanner.endDate && (
                  <div>
                    <span className="text-muted-foreground">{t('adminEndDate')}:</span>{' '}
                    {previewBanner.endDate.split('T')[0]}
                  </div>
                )}
              </div>
              {previewBanner.titleAr && (
                <div className="text-sm" dir="rtl">
                  <span className="text-muted-foreground">{t('adminBannerTitleAr')}:</span>{' '}
                  {previewBanner.titleAr}
                </div>
              )}
              {previewBanner.descriptionAr && (
                <div className="text-sm" dir="rtl">
                  <span className="text-muted-foreground">{t('adminBannerDescriptionAr')}:</span>{' '}
                  {previewBanner.descriptionAr}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
