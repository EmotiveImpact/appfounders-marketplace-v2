'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare,
  Send,
  Search,
  Plus,
  MoreVertical,
  Paperclip,
  Image,
  File,
  Trash2,
  User,
  Clock,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  sender_role: string;
  message_type: string;
  attachments: any[];
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_role: string;
  other_user_id: string;
  last_message_content: string;
  last_message_at: string;
  last_message_sender_id: string;
  unread_count: number;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string;
  developer_verified: boolean;
  has_conversation: boolean;
  conversation_id: string | null;
}

export function MessagingInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/community/messages');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/community/messages?conversation_id=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchUsers) params.set('search', searchUsers);
      
      const response = await fetch(`/api/community/messages/conversations?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const sendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message_data]);
        setMessageContent('');
        loadConversations(); // Refresh to update last message
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = async () => {
    if (!selectedUser || !initialMessage.trim()) {
      toast.error('Please select a user and enter a message');
      return;
    }

    try {
      const response = await fetch('/api/community/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser,
          initial_message: initialMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Conversation started successfully');
        setShowNewMessageDialog(false);
        setSelectedUser('');
        setInitialMessage('');
        loadConversations();
        setSelectedConversation(data.conversation_id);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-purple-100 text-purple-800';
      case 'developer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Messages</CardTitle>
            <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={loadUsers}>
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Search users..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      onKeyUp={loadUsers}
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUser === user.id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{user.name}</span>
                              <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                                {user.role}
                              </Badge>
                            </div>
                            {user.has_conversation && (
                              <span className="text-xs text-muted-foreground">
                                Existing conversation
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Type your message..."
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    rows={3}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewMessageDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={startNewConversation}>
                      Start Conversation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new conversation to get started</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer transition-colors border-l-4 ${
                    selectedConversation === conversation.id
                      ? 'bg-primary/10 border-l-primary'
                      : 'hover:bg-gray-50 border-l-transparent'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.other_user_avatar} />
                      <AvatarFallback>
                        {conversation.other_user_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {conversation.other_user_name}
                          </span>
                          <Badge className={`text-xs ${getRoleColor(conversation.other_user_role)}`}>
                            {conversation.other_user_role}
                          </Badge>
                        </div>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conversation.last_message_content && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conversation.last_message_content}
                        </p>
                      )}
                      {conversation.last_message_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatMessageTime(conversation.last_message_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <>
            <CardContent className="p-4 h-[500px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === selectedConversation ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender_id === selectedConversation
                          ? 'bg-gray-100'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.sender_name}
                        </span>
                        <Badge className={`text-xs ${getRoleColor(message.sender_role)}`}>
                          {message.sender_role}
                        </Badge>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {message.read_at ? (
                          <CheckCheck className="w-3 h-3 opacity-70" />
                        ) : (
                          <Check className="w-3 h-3 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageContent.trim() || sendingMessage}
                  size="sm"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
