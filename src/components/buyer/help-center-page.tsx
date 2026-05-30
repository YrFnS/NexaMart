'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  RotateCcw,
  MessageCircle,
  Flag,
  LifeBuoy,
  Mail,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { APP_SUPPORT_EMAIL } from '@/lib/config';

interface FAQCategory {
  id: string;
  title: string;
  titleAr: string;
  icon: string;
  questions: {
    id: string;
    question: string;
    questionAr: string;
    answer: string;
    answerAr: string;
  }[];
}

interface Ticket {
  id: string;
  category: string;
  subject: string;
  subjectAr: string;
  description: string;
  descriptionAr: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  responseCount: number;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string; labelAr: string }> = {
  open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: AlertCircle, label: 'Open', labelAr: 'مفتوح' },
  in_progress: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Clock, label: 'In Progress', labelAr: 'قيد المعالجة' },
  resolved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', icon: CheckCircle2, label: 'Resolved', labelAr: 'تم الحل' },
  closed: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: XCircle, label: 'Closed', labelAr: 'مغلق' },
};

const TICKET_CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue', labelAr: 'مشكلة في الطلب' },
  { value: 'return_refund', label: 'Return/Refund', labelAr: 'إرجاع/استرداد' },
  { value: 'payment_problem', label: 'Payment Problem', labelAr: 'مشكلة في الدفع' },
  { value: 'account_issue', label: 'Account Issue', labelAr: 'مشكلة في الحساب' },
  { value: 'seller_dispute', label: 'Seller Dispute', labelAr: 'نزاع مع البائع' },
  { value: 'technical_problem', label: 'Technical Problem', labelAr: 'مشكلة تقنية' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', labelAr: 'منخفض', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  { value: 'medium', label: 'Medium', labelAr: 'متوسط', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  { value: 'high', label: 'High', labelAr: 'مرتفع', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'urgent', label: 'Urgent', labelAr: 'عاجل', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
];

export function HelpCenterPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [faqCategories, setFaqCategories] = useState<FAQCategory[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string>('');

  // Ticket form state
  const [ticketCategory, setTicketCategory] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/help');
        if (res.ok) {
          const data = await res.json();
          setFaqCategories(data.faqCategories || []);
          setTickets(data.tickets || []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmitTicket = async () => {
    if (!ticketCategory || !ticketSubject || !ticketDescription) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: ticketCategory,
          subject: ticketSubject,
          description: ticketDescription,
          priority: ticketPriority,
        }),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setTicketCategory('');
        setTicketSubject('');
        setTicketDescription('');
        setTicketPriority('medium');
        // Refresh tickets
        const ticketsRes = await fetch('/api/help?action=tickets');
        if (ticketsRes.ok) {
          const data = await ticketsRes.json();
          setTickets(data.tickets || []);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = searchQuery.trim()
    ? faqCategories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          q =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.questionAr.includes(searchQuery) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answerAr.includes(searchQuery)
        ),
      })).filter(cat => cat.questions.length > 0)
    : faqCategories;

  const quickActions = [
    {
      icon: Package,
      label: isRTL ? 'تتبع الطلب' : 'Track Order',
      description: isRTL ? 'تتبع حالة شحنتك' : 'Track your shipment status',
      color: 'from-emerald-500 to-teal-600',
      onClick: () => nav.setView('order-tracking'),
    },
    {
      icon: RotateCcw,
      label: isRTL ? 'إرجاع منتج' : 'Return Item',
      description: isRTL ? 'اطلب إرجاع أو استرداد' : 'Request a return or refund',
      color: 'from-amber-500 to-orange-600',
      onClick: () => nav.setView('returns'),
    },
    {
      icon: MessageCircle,
      label: isRTL ? 'تواصل مع البائع' : 'Contact Seller',
      description: isRTL ? 'أرسل رسالة للبائع' : 'Message the seller directly',
      color: 'from-cyan-500 to-blue-600',
      onClick: () => nav.setView('chat'),
    },
    {
      icon: Flag,
      label: isRTL ? 'الإبلاغ عن مشكلة' : 'Report Issue',
      description: isRTL ? 'أبلغ عن مشكلة أو انتهاك' : 'Report a problem or violation',
      color: 'from-rose-500 to-red-600',
      onClick: () => {},
    },
  ];

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      User: HelpCircle,
      Package: Package,
      RotateCcw: RotateCcw,
      CreditCard: MessageCircle,
      Store: Flag,
    };
    return icons[iconName] || HelpCircle;
  };

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
              <LifeBuoy className="size-4" />
              {isRTL ? 'مركز المساعدة' : 'Help Center'}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              {isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
            </h1>
            <p className="text-emerald-100 text-lg">
              {isRTL
                ? 'ابحث عن إجابات لأسئلتك أو تواصل مع فريق الدعم'
                : 'Find answers to your questions or contact our support team'}
            </p>
            <div className="relative max-w-lg mx-auto">
              <Search className={`absolute top-1/2 -translate-y-1/2 size-5 text-emerald-300 ${isRTL ? 'right-4' : 'left-4'}`} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحث في الأسئلة الشائعة...' : 'Search FAQ...'}
                className={`h-12 bg-white/15 backdrop-blur-sm border-white/25 text-white placeholder:text-emerald-200 text-base rounded-xl ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-12 relative z-20">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Card
                key={action.label}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-md"
                onClick={action.onClick}
              >
                <CardContent className="p-4 text-center space-y-3">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                    <ActionIcon className="size-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faq" className="mt-8">
          <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="faq" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
            </TabsTrigger>
            <TabsTrigger value="ticket" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {isRTL ? 'تقديم تذكرة' : 'Submit Ticket'}
            </TabsTrigger>
            <TabsTrigger value="my-tickets" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {isRTL ? 'تذاكري' : 'My Tickets'}
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              {isRTL ? 'تواصل معنا' : 'Contact Us'}
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 text-emerald-600 animate-spin" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="size-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? isRTL ? 'لا توجد نتائج لبحثك' : 'No results found for your search'
                      : isRTL ? 'لا توجد أسئلة شائعة' : 'No FAQ available'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredCategories.map((category) => {
                  const CatIcon = getCategoryIcon(category.icon);
                  return (
                    <Card key={category.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <CatIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          {isRTL ? category.titleAr : category.title}
                          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                            {category.questions.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion
                          type="single"
                          collapsible
                          value={expandedFaq}
                          onValueChange={setExpandedFaq}
                          className="space-y-1"
                        >
                          {category.questions.map((faq) => (
                            <AccordionItem
                              key={faq.id}
                              value={faq.id}
                              className="border rounded-lg px-4 data-[state=open]:border-emerald-300 dark:data-[state=open]:border-emerald-700 data-[state=open]:bg-emerald-50/50 dark:data-[state=open]:bg-emerald-950/20 transition-colors"
                            >
                              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3 text-start">
                                {isRTL ? faq.questionAr : faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                                {isRTL ? faq.answerAr : faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Submit Ticket Tab */}
          <TabsContent value="ticket" className="mt-6">
            <div className="max-w-2xl mx-auto">
              {submitSuccess ? (
                <Card className="text-center">
                  <CardContent className="py-12 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold">
                      {isRTL ? 'تم تقديم التذكرة بنجاح!' : 'Ticket Submitted Successfully!'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isRTL
                        ? 'سنتواصل معك خلال 24 ساعة.'
                        : 'We will get back to you within 24 hours.'}
                    </p>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setSubmitSuccess(false)}
                    >
                      {isRTL ? 'تقديم تذكرة أخرى' : 'Submit Another Ticket'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="size-5 text-emerald-600 dark:text-emerald-400" />
                      {isRTL ? 'تقديم تذكرة دعم' : 'Submit a Support Ticket'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {isRTL ? 'الفئة' : 'Category'} *
                      </Label>
                      <Select value={ticketCategory} onValueChange={setTicketCategory}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder={isRTL ? 'اختر الفئة' : 'Select category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {TICKET_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {isRTL ? cat.labelAr : cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {isRTL ? 'الموضوع' : 'Subject'} *
                      </Label>
                      <Input
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder={isRTL ? 'أدخل موضوع التذكرة' : 'Enter ticket subject'}
                        className="h-10"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {isRTL ? 'الوصف' : 'Description'} *
                      </Label>
                      <Textarea
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder={isRTL ? 'اشرح مشكلتك بالتفصيل...' : 'Describe your issue in detail...'}
                        className="min-h-[120px] resize-none"
                        maxLength={1000}
                      />
                      <p className="text-[10px] text-muted-foreground text-end">
                        {ticketDescription.length}/1000
                      </p>
                    </div>

                    {/* Attach Files (UI only) */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {isRTL ? 'إرفاق ملفات' : 'Attach Files'}
                      </Label>
                      <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors cursor-pointer">
                        <Paperclip className="size-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'اسحب الملفات هنا أو اضغط للاختيار' : 'Drag files here or click to browse'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {isRTL ? 'PNG, JPG, PDF حتى 5MB' : 'PNG, JPG, PDF up to 5MB'}
                        </p>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {isRTL ? 'الأولوية' : 'Priority'}
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRIORITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTicketPriority(opt.value)}
                            className={`p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                              ticketPriority === opt.value
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                                : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                            }`}
                          >
                            {isRTL ? opt.labelAr : opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                      onClick={handleSubmitTicket}
                      disabled={isSubmitting || !ticketCategory || !ticketSubject || !ticketDescription}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 me-2 animate-spin" />
                          {isRTL ? 'جاري الإرسال...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          <Send className="size-4 me-2" />
                          {isRTL ? 'إرسال التذكرة' : 'Submit Ticket'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* My Tickets Tab */}
          <TabsContent value="my-tickets" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="size-5 text-emerald-600 dark:text-emerald-400" />
                  {isRTL ? 'تذاكري' : 'My Tickets'}
                </h2>
                <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {tickets.length} {isRTL ? 'تذكرة' : 'tickets'}
                </Badge>
              </div>

              {tickets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="size-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {isRTL ? 'لا توجد تذاكر بعد' : 'No tickets yet'}
                    </p>
                    <Button
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {}}
                    >
                      {isRTL ? 'تقديم تذكرة جديدة' : 'Submit New Ticket'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                    const StatusIcon = statusConfig.icon;
                    const categoryLabel = TICKET_CATEGORIES.find(c => c.value === ticket.category);

                    return (
                      <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm truncate">{ticket.subject}</span>
                                <Badge className={`${statusConfig.color} text-[10px]`}>
                                  <StatusIcon className="size-3 me-1" />
                                  {isRTL ? statusConfig.labelAr : statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {ticket.description}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {new Date(ticket.createdAt).toLocaleDateString(getLocale(isRTL))}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="size-3" />
                                  {ticket.responseCount} {isRTL ? 'ردود' : 'replies'}
                                </span>
                                {categoryLabel && (
                                  <Badge className="bg-muted text-muted-foreground text-[10px]">
                                    {isRTL ? categoryLabel.labelAr : categoryLabel.label}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 text-xs">
                              {isRTL ? 'عرض' : 'View'}
                              {isRTL ? <ArrowLeft className="size-3 ms-1" /> : <ArrowRight className="size-3 ms-1" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Live Chat */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <MessageCircle className="size-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">
                    {isRTL ? 'الدردشة المباشرة' : 'Live Chat'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL
                      ? 'تحدث مع فريق الدعم مباشرة'
                      : 'Chat with our support team in real-time'}
                  </p>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <MessageCircle className="size-4 me-2" />
                    {isRTL ? 'بدء الدردشة' : 'Start Chat'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    {isRTL ? 'متاح 24/7' : 'Available 24/7'}
                  </p>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Mail className="size-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">
                    {isRTL ? 'البريد الإلكتروني' : 'Email Support'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL
                      ? 'أرسل لنا بريداً إلكترونياً وسنرد خلال 24 ساعة'
                      : 'Send us an email and we\'ll respond within 24 hours'}
                  </p>
                  <Button variant="outline" className="w-full border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                    <Mail className="size-4 me-2" />
                    {APP_SUPPORT_EMAIL}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    {isRTL ? 'الرد خلال 24 ساعة' : 'Response within 24 hours'}
                  </p>
                </CardContent>
              </Card>

              {/* Phone */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Phone className="size-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">
                    {isRTL ? 'الاتصال الهاتفي' : 'Phone Support'}
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{isRTL ? 'السعودية:' : 'KSA:'}</span>
                      <span className="font-medium" dir="ltr">+966 9200 12345</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{isRTL ? 'الإمارات:' : 'UAE:'}</span>
                      <span className="font-medium" dir="ltr">+971 800 123 456</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{isRTL ? 'مصر:' : 'Egypt:'}</span>
                      <span className="font-medium" dir="ltr">+20 2 1234 5678</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{isRTL ? 'العراق:' : 'Iraq:'}</span>
                      <span className="font-medium" dir="ltr">+964 770 123 4567</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isRTL ? 'السبت - الخميس، 9 صباحاً - 9 مساءً' : 'Sat-Thu, 9AM - 9PM'}
                  </p>
                </CardContent>
              </Card>

              {/* WhatsApp */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <MessageSquare className="size-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL
                      ? 'تواصل معنا عبر واتساب للدعم السريع'
                      : 'Reach us on WhatsApp for quick support'}
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <MessageSquare className="size-4 me-2" />
                    {isRTL ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    {isRTL ? 'متاح 24/7' : 'Available 24/7'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
