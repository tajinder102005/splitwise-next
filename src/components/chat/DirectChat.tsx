import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useProfileById } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Check, CheckCheck, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MessageInput from '@/components/chat/MessageInput';
import AttachmentPreview from '@/components/chat/AttachmentPreview';
import type { UploadedFile } from '@/hooks/useFileUpload';

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachments?: Attachment[];
}

interface Props {
  conversationId: string;
  otherUserId: string;
  onBack: () => void;
}

export default function DirectChat({ conversationId, otherUserId, onBack }: Props) {
  const { user } = useAuth();
  const otherProfile = useProfileById(otherUserId);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const typingChannel = useRef<any>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!data) return;

    const withAttachments = await Promise.all(
      (data as DirectMessage[]).map(async (msg) => {
        const { data: atts } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('message_id', msg.id);
        return { ...msg, attachments: atts || [] };
      })
    );
    setMessages(withAttachments);
  }, [conversationId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => { fetchMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    const ch = supabase.channel(`typing-${conversationId}`);
    typingChannel.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const others = Object.values(state).flat().filter((p: any) => p.user_id !== user?.id && p.typing);
      setTyping(others.length > 0);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ user_id: user?.id, typing: false });
      }
    });
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (!user) return;
    const unread = messages.filter(m => m.sender_id !== user.id && !m.read_at && !m.deleted_at);
    if (unread.length > 0) {
      supabase.from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unread.map(m => m.id))
        .then(() => {});
    }
  }, [messages, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleTyping = () => {
    if (!typingChannel.current) return;
    typingChannel.current.track({ user_id: user?.id, typing: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      typingChannel.current?.track({ user_id: user?.id, typing: false });
    }, 2000);
  };

  const handleSend = async (content: string, attachment?: UploadedFile) => {
    if (!user) return;
    const { data: msg, error } = await supabase.from('direct_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || '',
    }).select().single();

    if (error || !msg) { toast.error('Failed to send'); return; }

    if (attachment) {
      await supabase.from('message_attachments').insert({
        message_id: msg.id,
        file_url: attachment.url,
        file_name: attachment.name,
        file_type: attachment.type,
        file_size: attachment.size,
      });
    }
    fetchMessages();
  };

  const handleEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    await supabase.from('direct_messages')
      .update({ content: editText.trim(), edited_at: new Date().toISOString() })
      .eq('id', msgId);
    setEditingId(null);
    setEditText('');
    fetchMessages();
  };

  const handleDelete = async (msgId: string) => {
    await supabase.from('direct_messages')
      .update({ deleted_at: new Date().toISOString(), content: '' })
      .eq('id', msgId);
    fetchMessages();
  };

  const initials = (name: string | null) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const statusColor = (s: string) => {
    if (s === 'online') return 'bg-green-500';
    if (s === 'busy') return 'bg-yellow-500';
    return 'bg-muted-foreground/40';
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherProfile?.avatar_url || ''} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials(otherProfile?.display_name || null)}
            </AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${statusColor(otherProfile?.status || 'offline')}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{otherProfile?.display_name || 'Loading...'}</p>
          <p className="text-[11px] text-muted-foreground">
            {typing ? 'typing...' : otherProfile?.status === 'online' ? 'Online' : otherProfile?.last_seen ? `Last seen ${format(new Date(otherProfile.last_seen), 'h:mm a')}` : 'Offline'}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-2">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const isDeleted = !!msg.deleted_at;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex group ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-1 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {isOwn && !isDeleted && editingId !== msg.id && (
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingId(msg.id); setEditText(msg.content); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(msg.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <Card className={`border-0 px-3.5 py-2 shadow-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'} ${isDeleted ? 'opacity-50' : ''}`}>
                      {isDeleted ? (
                        <p className={`text-sm italic ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          This message was deleted
                        </p>
                      ) : editingId === msg.id ? (
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <Input
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleEdit(msg.id); if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                            className="h-7 text-sm bg-transparent border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/40"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleEdit(msg.id)}>
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setEditingId(null); setEditText(''); }}>
                            <X className="h-3.5 w-3.5 text-primary-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-1">
                              {msg.attachments.map(att => (
                                <AttachmentPreview key={att.id} attachment={att} isOwn={isOwn} />
                              ))}
                            </div>
                          )}
                          {msg.content && (
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          )}
                        </>
                      )}
                      {!isDeleted && editingId !== msg.id && (
                        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
                          <span className={`text-[10px] ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                            {msg.edited_at && ' (edited)'}
                          </span>
                          {isOwn && (
                            msg.read_at
                              ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                              : <Check className="h-3 w-3 text-primary-foreground/40" />
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {typing && (
            <div className="flex justify-start">
              <div className="bg-card rounded-lg px-4 py-2 text-sm text-muted-foreground animate-pulse">
                typing...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
