'use client';

import React, { useState } from 'react';
import {
  ThumbsUp,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userNameAr: string;
  avatar: string;
  text: string;
  textAr: string;
  timestamp: string;
  upvotes: number;
  replies: Reply[];
}

interface Reply {
  id: string;
  userId: string;
  userName: string;
  userNameAr: string;
  avatar: string;
  text: string;
  textAr: string;
  timestamp: string;
  upvotes: number;
}

const initialComments: Comment[] = [];

export function ListingComments() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [upvotedComments, setUpvotedComments] = useState<Set<string>>(new Set());
  const [upvotedReplies, setUpvotedReplies] = useState<Set<string>>(new Set());
  const [questionSubmitted, setQuestionSubmitted] = useState(false);

  const handleAskQuestion = () => {
    if (!newQuestion.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      userNameAr: 'أنت',
      avatar: 'YO',
      text: newQuestion,
      textAr: newQuestion,
      timestamp: isRTL ? 'الآن' : 'Just now',
      upvotes: 0,
      replies: [],
    };

    setComments((prev) => [newComment, ...prev]);
    setNewQuestion('');
    setQuestionSubmitted(true);
    setTimeout(() => setQuestionSubmitted(false), 2000);
  };

  const handleReply = (commentId: string) => {
    if (!replyText.trim()) return;

    const newReply: Reply = {
      id: `r-${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      userNameAr: 'أنت',
      avatar: 'YO',
      text: replyText,
      textAr: replyText,
      timestamp: isRTL ? 'الآن' : 'Just now',
      upvotes: 0,
    };

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
      )
    );
    setReplyText('');
    setReplyingTo(null);
    setExpandedReplies((prev) => new Set([...prev, commentId]));
  };

  const toggleUpvoteComment = (commentId: string) => {
    setUpvotedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
        setComments((cs) =>
          cs.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes - 1 } : c))
        );
      } else {
        next.add(commentId);
        setComments((cs) =>
          cs.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c))
        );
      }
      return next;
    });
  };

  const toggleUpvoteReply = (replyId: string) => {
    setUpvotedReplies((prev) => {
      const next = new Set(prev);
      const isUpvoted = next.has(replyId);
      if (isUpvoted) {
        next.delete(replyId);
      } else {
        next.add(replyId);
      }
      setComments((cs) =>
        cs.map((c) => ({
          ...c,
          replies: c.replies.map((r) =>
            r.id === replyId
              ? { ...r, upvotes: r.upvotes + (isUpvoted ? -1 : 1) }
              : r
          ),
        }))
      );
      return next;
    });
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Ask Question Input */}
      <div className="flex gap-2">
        <Input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder={t('writeYourQuestion')}
          className="flex-1 input-emerald"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAskQuestion();
          }}
        />
        <Button
          onClick={handleAskQuestion}
          disabled={!newQuestion.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1"
        >
          <Send className="size-4" />
          {questionSubmitted ? (
            <Check className="size-4" />
          ) : (
            <span className="hidden sm:inline">{t('askQuestion')}</span>
          )}
        </Button>
      </div>

      {/* Success message */}
      {questionSubmitted && (
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 text-center">
          {t('questionAsked')}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin pr-1">
        {comments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="size-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'لا توجد تعليقات بعد' : 'No comments yet'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isRTL ? 'كن أول من يسأل عن هذا المنتج' : 'Be the first to ask about this listing'}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
            {/* Comment */}
            <div className="flex gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs">
                  {comment.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">
                    {isRTL ? comment.userNameAr : comment.userName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-foreground/90">{isRTL ? comment.textAr : comment.text}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => toggleUpvoteComment(comment.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      upvotedComments.has(comment.id)
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <ThumbsUp className={`size-3 ${upvotedComments.has(comment.id) ? 'fill-emerald-500' : ''}`} />
                    {comment.upvotes > 0 && comment.upvotes}
                  </button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <MessageCircle className="size-3" />
                    {t('replyToComment')}
                  </button>
                  {comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {expandedReplies.has(comment.id) ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        {comment.replies.length} {t('answers')}
                      </Badge>
                    </button>
                  )}
                </div>

                {/* Reply Input */}
                {replyingTo === comment.id && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t('writeYourReply')}
                      className="flex-1 text-xs h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReply(comment.id);
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-3"
                    >
                      <Send className="size-3" />
                    </Button>
                  </div>
                )}

                {/* Replies */}
                {expandedReplies.has(comment.id) && comment.replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-s-2 border-emerald-200 dark:border-emerald-800 ps-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-[10px]">
                            {reply.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium">
                              {isRTL ? reply.userNameAr : reply.userName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{reply.timestamp}</span>
                          </div>
                          <p className="text-xs text-foreground/90">{isRTL ? reply.textAr : reply.text}</p>
                          <button
                            onClick={() => toggleUpvoteReply(reply.id)}
                            className={`flex items-center gap-1 text-[10px] mt-1 transition-colors ${
                              upvotedReplies.has(reply.id)
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground hover:text-emerald-600'
                            }`}
                          >
                            <ThumbsUp className={`size-2.5 ${upvotedReplies.has(reply.id) ? 'fill-emerald-500' : ''}`} />
                            {t('helpfulAnswer')} {reply.upvotes > 0 && `(${reply.upvotes})`}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
