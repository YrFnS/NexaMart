'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, MapPin, DollarSign, Clock, Star, Heart,
  Search, SlidersHorizontal, ChevronDown, Building2,
  ShieldCheck, Users, Plus, Zap, Upload, Tag, Globe,
  Monitor, TrendingUp, Stethoscope, GraduationCap, Palette,
  Phone, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { JOB_TYPES, JOB_CATEGORY_ICONS, EXPERIENCE_LEVELS } from '@/lib/reference-data';

// Matches the actual API response from /api/jobs
interface JobListing {
  id: string;
  title: string;
  titleAr: string | null;
  company: string;
  companyAr: string; // empty string from API
  location: string;
  locationAr: string; // empty string from API
  salaryMin: number;
  salaryMax: number;
  currency: string;
  type: string; // full-time, part-time, contract, freelance, remote, hybrid
  category: string;
  categoryAr: string; // empty string from API
  postedDays: number;
  verified: boolean; // maps to isFeatured from API
  description: string;
  descriptionAr: string | null;
  skills: string[]; // JSON array from API, English only
  experienceLevel: string; // entry, mid, senior, executive
}

// Maps job type values to i18n keys
const JOBS_TYPE_KEYS: Record<string, string> = {
  'full-time': 'jobs_type_full_time',
  'part-time': 'jobs_type_part_time',
  'remote': 'jobs_type_remote',
  'contract': 'jobs_type_contract',
  'freelance': 'jobs_type_freelance',
  'hybrid': 'jobs_type_hybrid',
};

const JOBS_EXP_KEYS: Record<string, string> = {
  'entry': 'jobs_exp_entry',
  'mid': 'jobs_exp_mid',
  'senior': 'jobs_exp_senior',
  'executive': 'jobs_exp_executive',
};

const jobTypeConfig: Record<string, { color: string }> = Object.fromEntries(
  JOB_TYPES.map(jt => [jt.value, { color: jt.color }])
);

const lucideIconMap: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="size-3.5" />,
  TrendingUp: <TrendingUp className="size-3.5" />,
  DollarSign: <DollarSign className="size-3.5" />,
  Building2: <Building2 className="size-3.5" />,
  Stethoscope: <Stethoscope className="size-3.5" />,
  GraduationCap: <GraduationCap className="size-3.5" />,
  Palette: <Palette className="size-3.5" />,
  Phone: <Phone className="size-3.5" />,
};

const categoryIcons: Record<string, React.ReactNode> = Object.fromEntries(
  Object.entries(JOB_CATEGORY_ICONS).map(([k, v]) => [k, lucideIconMap[v] || null])
);

const experienceLevelConfig: Record<string, { color: string }> = Object.fromEntries(
  EXPERIENCE_LEVELS.map(el => [el.value, { color: el.color }])
);

export function JobsPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [salaryFilter, setSalaryFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [remoteFilter, setRemoteFilter] = useState<string>('all');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Helper for data-driven text (titles/descriptions from API)
  const localize = (en: string, ar: string | null | undefined) => (ar && isRTL) ? ar : en;

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          setJobs(Array.isArray(data) ? data : data.jobs || []);
        } else {
          setJobs([]);
        }
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Derive unique categories and locations from fetched data
  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(jobs.map(j => j.category).filter(Boolean))];
    return [
      { value: 'all', label: t('jobs_allCategories') },
      ...cats.map(c => ({ value: c, label: c })),
    ];
  }, [jobs, isRTL]);

  const uniqueLocations = useMemo(() => {
    const locs = [...new Set(jobs.map(j => j.location).filter(Boolean))];
    return [
      { value: 'all', label: t('jobs_allLocations') },
      ...locs.map(l => ({ value: l, label: l })),
    ];
  }, [jobs, isRTL]);

  const jobTypes = [
    { value: 'all', label: t('jobs_allTypes') },
    { value: 'full-time', label: t('fullTime') },
    { value: 'part-time', label: t('partTime') },
    { value: 'contract', label: t('contract') },
    { value: 'freelance', label: t('freelance') },
    { value: 'remote', label: t('remote') },
    { value: 'hybrid', label: t('hybrid') },
  ];

  const salaryRanges = [
    { value: 'all', label: t('jobs_allSalaries') },
    { value: '0-2000', label: t('jobs_under2k') },
    { value: '2000-4000', label: t('jobs_2kTo4k') },
    { value: '4000-8000', label: t('jobs_4kTo8k') },
    { value: '8000-99999', label: t('jobs_8kPlus') },
  ];

  const experienceLevels = [
    { value: 'all', label: t('jobs_allLevels') },
    { value: 'entry', label: t('entryLevel') },
    { value: 'mid', label: t('midLevel') },
    { value: 'senior', label: t('seniorLevel') },
    { value: 'executive', label: t('executive') },
  ];

  const remoteOptions = [
    { value: 'all', label: t('jobs_all') },
    { value: 'yes', label: t('jobs_yes') },
    { value: 'no', label: t('jobs_no') },
    { value: 'hybrid', label: t('hybrid') },
  ];

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) => j.title.toLowerCase().includes(q) || (j.titleAr && j.titleAr.includes(q)) || j.company.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== 'all') filtered = filtered.filter((j) => j.category === categoryFilter);
    if (locationFilter !== 'all') filtered = filtered.filter((j) => j.location.includes(locationFilter));
    if (typeFilter !== 'all') filtered = filtered.filter((j) => j.type === typeFilter);
    if (salaryFilter !== 'all') {
      const [min, max] = salaryFilter.split('-').map(Number);
      filtered = filtered.filter((j) => j.salaryMin >= min && (max ? j.salaryMin <= max : true));
    }
    if (experienceFilter !== 'all') filtered = filtered.filter((j) => j.experienceLevel === experienceFilter);
    if (remoteFilter === 'yes') filtered = filtered.filter((j) => j.type === 'remote');
    else if (remoteFilter === 'no') filtered = filtered.filter((j) => j.type !== 'remote' && j.type !== 'hybrid');
    else if (remoteFilter === 'hybrid') filtered = filtered.filter((j) => j.type === 'hybrid' || j.type === 'remote');
    return filtered;
  }, [jobs, searchQuery, categoryFilter, locationFilter, typeFilter, salaryFilter, experienceFilter, remoteFilter]);

  const toggleSaveJob = (id: string) => {
    setSavedJobs((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Briefcase className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">{t('noJobs') || 'No jobs found'}</p>
          <p className="text-sm">{t('jobs_noJobsAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 end-10 size-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-10 start-10 size-48 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <Badge className="bg-white/20 text-white border-0 text-xs">
              <Briefcase className="size-3 me-1" />
              {t('jobs_badge')}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold">
              {t('jobsAndServices')}
            </h1>
            <p className="text-emerald-100 text-lg">
              {t('jobsAndServicesDesc')}
            </p>
            <div className="flex items-center max-w-xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-1.5 gap-1.5">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-white/60 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  placeholder={t('jobs_searchJobs')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pr-9' : 'pl-9'} bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 rounded-lg`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* CV Upload Section */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                <Upload className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{t('uploadCV')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('jobs_uploadCVDesc')}
                </p>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 text-xs">
                <Upload className="size-3.5 me-1.5" />
                {t('jobs_uploadCVButton')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-emerald-600" />
                {t('jobs_filterJobs')}
                <Badge variant="secondary" className="text-[10px]">{filteredJobs.length}</Badge>
              </h3>
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? (t('jobs_hide')) : (t('jobs_more'))}
                <ChevronDown className={`size-3 ms-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={t('jobs_category')} />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="text-xs">
                  <MapPin className="size-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueLocations.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-xs">
                  <Clock className="size-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((jt) => (
                    <SelectItem key={jt.value} value={jt.value}>{jt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={salaryFilter} onValueChange={setSalaryFilter}>
                <SelectTrigger className="text-xs">
                  <DollarSign className="size-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder={t('salary')} />
                </SelectTrigger>
                <SelectContent>
                  {salaryRanges.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showFilters && (
              <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-3 gap-3">
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder={t('jobs_experienceLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={remoteFilter} onValueChange={setRemoteFilter}>
                  <SelectTrigger className="text-xs">
                    <Globe className="size-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t('remote')} />
                  </SelectTrigger>
                  <SelectContent>
                    {remoteOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Briefcase className="size-16 mx-auto text-muted-foreground/20" />
            <p className="text-lg font-medium text-muted-foreground">{t('noJobs')}</p>
            <p className="text-sm text-muted-foreground/60">{t('noJobsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const typeConf = jobTypeConfig[job.type] || { color: 'bg-gray-100 text-gray-700' };
              const expConf = experienceLevelConfig[job.experienceLevel] || { color: 'bg-gray-100 text-gray-700' };
              const catIcon = categoryIcons[job.category];
              return (
                <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-all hover:border-emerald-200 dark:hover:border-emerald-800 flex flex-col h-full">
                  <CardContent className="p-4 md:p-5 flex-1 flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                      {/* Company Avatar */}
                      <div className="shrink-0">
                        <Avatar className="size-12 rounded-xl">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                            {job.company.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm md:text-base">{localize(job.title, job.titleAr)}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Building2 className="size-3" />
                              {job.company}
                              {job.verified && <ShieldCheck className="size-3 text-emerald-500" />}
                            </p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Badge className={`${typeConf.color} text-[10px]`}>
                              {t(JOBS_TYPE_KEYS[job.type] || job.type)}
                            </Badge>
                            <Badge className={`${expConf.color} text-[10px] hidden sm:inline-flex`}>
                              {t(JOBS_EXP_KEYS[job.experienceLevel] || job.experienceLevel)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
                          {(job.salaryMin > 0 || job.salaryMax > 0) && (
                            <span className="flex items-center gap-1 font-medium text-emerald-600">
                              <DollarSign className="size-3" />{job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()} {job.currency}
                            </span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="size-3" />{job.postedDays} {t('jobs_daysAgo')}</span>
                        </div>
                        {(job.description || job.descriptionAr) && (
                          <p className="text-xs text-muted-foreground line-clamp-3">{localize(job.description, job.descriptionAr)}</p>
                        )}
                        {/* Skills Tags */}
                        {job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {job.skills.slice(0, 4).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0">
                                <Tag className="size-2.5 me-0.5" />
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 4 && (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0 text-emerald-600 dark:text-emerald-400">
                                +{job.skills.length - 4} {t('jobs_moreSkills')}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col items-center gap-2 shrink-0">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 text-xs">
                          <Zap className="size-3 me-1" />
                          {t('applyNow')}
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full px-3 text-xs" onClick={() => toggleSaveJob(job.id)}>
                          <Heart className={`size-3 me-1 ${savedJobs.includes(job.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          {t('jobs_save')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Post a Job CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
              <Briefcase className="size-7" />
            </div>
            <div className="flex-1 text-center md:text-start">
              <h3 className="font-bold text-lg">{t('postAJob')}</h3>
              <p className="text-sm text-muted-foreground">{t('postAJobDesc')}</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
              <Plus className="size-4 me-2" />
              {t('jobs_postJob')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
