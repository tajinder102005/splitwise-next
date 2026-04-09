import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useProfileById } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
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
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Fetch messages
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages((data || []) as DirectMessage[]);
    };
    fetch();
  }, [conversationId]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const msg = payload.new as DirectMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Typing indicator via presence channel
  useEffect(() => {
    const channel = supabase.channel(`typing-${conversationId}`);
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const others = Object.values(state).flat().filter((p: any) => p.user_id !== user?.id && p.typing);
      setTyping(others.length > 0);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user?.id, typing: false });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user?.id]);

  // Mark as read
  useEffect(() => {
    if (!user) return;
    const unread = messages.filter(m => m.sender_id !== user.id && !m.read_at);
    if (unread.length > 0) {
      supabase.from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unread.map(m => m.id))
        .then(() => {});
    }
  }, [messages, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleTyping = () => {
    const channel = supabase.channel(`typing-${conversationId}`);
    channel.track({ user_id: user?.id, typing: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      channel.track({ user_id: user?.id, typing: false });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await supabase.from('direct_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
    setSending(false);
  };

  const initials = (name: string | null) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const statusColor = (s: string) => {
    if (s === 'online') return 'bg-green-500';
    if (s === 'busy') return 'bg-yellow-500';
    return 'bg-muted-foreground/40';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-2">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`max-w-[75%] border-0 px-3.5 py-2 shadow-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
                      <span className={`text-[10px] ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </span>
                      {isOwn && (
                        msg.read_at
                          ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                          : <Check className="h-3 w-3 text-primary-foreground/40" />
                      )}
                    </div>
                  </Card>
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

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <form onSubmit={handleSend} className="mx-auto flex max-w-3xl items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            placeholder="Type a message..."
            className="h-11 flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
