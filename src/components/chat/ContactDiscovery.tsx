import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConnections } from '@/hooks/useConnections';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, UserPlus, Check, X, MessageCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { Profile } from '@/hooks/useProfile';

interface Props {
  onBack: () => void;
  onStartChat: (conversationId: string, otherUserId: string) => void;
}

export default function ContactDiscovery({ onBack, onStartChat }: Props) {
  const { user } = useAuth();
  const { acceptedContacts, pendingIncoming, pendingOutgoing, sendRequest, acceptRequest, blockConnection, removeConnection } = useConnections();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id)
      .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      .limit(20);
    setSearchResults((data || []) as Profile[]);
    setSearching(false);
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    const [u1, u2] = [user.id, otherUserId].sort();

    // Check existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .single();

    if (existing) {
      onStartChat(existing.id, otherUserId);
      return;
    }

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ user1_id: u1, user2_id: u2 })
      .select('id')
      .single();

    if (error) { toast.error('Failed to start conversation'); return; }
    onStartChat(newConv.id, otherUserId);
  };

  const getOtherUserId = (conn: any) => conn.requester_id === user?.id ? conn.addressee_id : conn.requester_id;

  const initials = (name: string | null) => name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const ContactCard = ({ userId, name, avatarUrl, actions }: { userId: string; name: string; avatarUrl?: string | null; actions: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="flex items-center gap-3 p-3 border-0 bg-accent/30">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl || ''} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
        </div>
        <div className="flex items-center gap-1">{actions}</div>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Contacts</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} size="sm" className="h-10">
              {searching ? '...' : 'Search'}
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Search Results</h3>
              {searchResults.map(p => (
                <ContactCard
                  key={p.user_id}
                  userId={p.user_id}
                  name={p.display_name || p.email}
                  avatarUrl={p.avatar_url}
                  actions={
                    <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => sendRequest(p.user_id)}>
                      <UserPlus className="h-3.5 w-3.5" /> Connect
                    </Button>
                  }
                />
              ))}
            </div>
          )}

          <Tabs defaultValue="contacts">
            <TabsList className="w-full">
              <TabsTrigger value="contacts" className="flex-1">
                Contacts {acceptedContacts.length > 0 && <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{acceptedContacts.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">
                Pending {pendingIncoming.length > 0 && <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{pendingIncoming.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-2 mt-3">
              {acceptedContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No contacts yet. Search for people above!</p>
              ) : (
                acceptedContacts.map(conn => (
                  <ConnectedContact
                    key={conn.id}
                    connectionId={conn.id}
                    otherUserId={getOtherUserId(conn)}
                    onMessage={startConversation}
                    onRemove={removeConnection}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-3">
              {pendingIncoming.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Incoming Requests</h4>
                  {pendingIncoming.map(conn => (
                    <PendingContact
                      key={conn.id}
                      connectionId={conn.id}
                      otherUserId={conn.requester_id}
                      onAccept={acceptRequest}
                      onBlock={blockConnection}
                    />
                  ))}
                </div>
              )}
              {pendingOutgoing.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Sent Requests</h4>
                  {pendingOutgoing.map(conn => (
                    <SentRequest key={conn.id} connectionId={conn.id} otherUserId={conn.addressee_id} onCancel={removeConnection} />
                  ))}
                </div>
              )}
              {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ConnectedContact({ connectionId, otherUserId, onMessage, onRemove }: { connectionId: string; otherUserId: string; onMessage: (id: string) => void; onRemove: (id: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  useState(() => {
    supabase.from('profiles').select('*').eq('user_id', otherUserId).single().then(({ data }) => setProfile(data));
  });
  if (!profile) return null;
  return (
    <Card className="flex items-center gap-3 p-3 border-0 bg-accent/30">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile.avatar_url || ''} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {profile.display_name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.display_name || profile.email}</p>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onMessage(otherUserId)}>
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onRemove(connectionId)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function PendingContact({ connectionId, otherUserId, onAccept, onBlock }: { connectionId: string; otherUserId: string; onAccept: (id: string) => void; onBlock: (id: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  useState(() => {
    supabase.from('profiles').select('*').eq('user_id', otherUserId).single().then(({ data }) => setProfile(data));
  });
  if (!profile) return null;
  return (
    <Card className="flex items-center gap-3 p-3 border-0 bg-accent/30">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile.avatar_url || ''} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{profile.display_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.display_name || profile.email}</p>
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => onAccept(connectionId)}>
          <Check className="h-3.5 w-3.5" /> Accept
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => onBlock(connectionId)}>
          <Ban className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function SentRequest({ connectionId, otherUserId, onCancel }: { connectionId: string; otherUserId: string; onCancel: (id: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  useState(() => {
    supabase.from('profiles').select('*').eq('user_id', otherUserId).single().then(({ data }) => setProfile(data));
  });
  if (!profile) return null;
  return (
    <Card className="flex items-center gap-3 p-3 border-0 bg-accent/30">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile.avatar_url || ''} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{profile.display_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.display_name || profile.email}</p>
        <Badge variant="secondary" className="text-[10px]">Pending</Badge>
      </div>
      <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => onCancel(connectionId)}>
        Cancel
      </Button>
    </Card>
  );
}
