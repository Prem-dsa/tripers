import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Image, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { io } from 'socket.io-client';
import { clsx } from 'clsx';
import { chatApi } from '../../api';
import { Avatar, EmptyState, Spinner } from '../ui/index';
import { useAuthStore } from '../../store/authStore';

let socketInstance = null;

export default function ChatTab({ tripId }) {
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState({});
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef();
  const typingTimer = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ['chat', tripId],
    queryFn: () => chatApi.getMessages(tripId).then(r => r.data),
  });

  useEffect(() => {
    if (data?.messages) setMessages(data.messages);
  }, [data]);

  useEffect(() => {
    // Connect socket
    if (!socketInstance) {
      const socketUrl = import.meta.env.VITE_API_URL || '/';
      socketInstance = io(socketUrl, { auth: { token: accessToken }, transports: ['websocket'] });
    }

    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));
    socketInstance.emit('trip:join', tripId);

    socketInstance.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketInstance.on('chat:typing', ({ userId: typingUserId, isTyping }) => {
      setTyping(prev => ({ ...prev, [typingUserId]: isTyping }));
    });

    return () => {
      socketInstance?.emit('trip:leave', tripId);
      socketInstance?.off('chat:message');
      socketInstance?.off('chat:typing');
    };
  }, [tripId, accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketInstance?.emit('chat:send', { tripId, content: input, type: 'text' });
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socketInstance?.emit('chat:typing', { tripId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketInstance?.emit('chat:typing', { tripId, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatMsgTime = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d, h:mm a');
  };

  const typingUsers = Object.entries(typing).filter(([uid, isTyping]) => isTyping && uid !== user?._id);

  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameUser = prev?.sender?._id === msg.sender?._id;
    const sameGroup = sameUser && (new Date(msg.createdAt) - new Date(prev.createdAt)) < 120000;
    if (!sameGroup) acc.push({ ...msg, showAvatar: true, showName: true });
    else acc.push({ ...msg, showAvatar: false, showName: false });
    return acc;
  }, []);

  return (
    <div className="flex flex-col" style={{ height: '60vh' }}>
      {/* Status bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className={clsx('w-2 h-2 rounded-full', connected ? 'bg-green-400' : 'bg-red-400')} />
        <span className="text-dark-400 text-xs">{connected ? 'Connected' : 'Reconnecting...'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {isLoading ? (
          <div className="flex-center py-8"><Spinner /></div>
        ) : !messages.length ? (
          <EmptyState icon={<MessageCircle size={32} className="text-dark-600" />} title="No messages yet" description="Start the conversation!" />
        ) : (
          <>
            {groupedMessages.map((msg, i) => {
              const isMe = msg.sender?._id === user?._id;
              return (
                <motion.div
                  key={msg._id || i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx('flex gap-2', isMe ? 'flex-row-reverse' : 'flex-row', !msg.showAvatar && 'ml-8')}
                >
                  {msg.showAvatar && (
                    <Avatar src={msg.sender?.photo} name={msg.sender?.fullName} size="sm" className="flex-shrink-0 mt-auto" />
                  )}
                  <div className={clsx('max-w-xs sm:max-w-sm', !msg.showAvatar && (isMe ? 'mr-8' : 'ml-0'))}>
                    {msg.showName && !isMe && (
                      <p className="text-primary-400 text-xs font-semibold mb-1 ml-1">{msg.sender?.fullName}</p>
                    )}
                    <div className={clsx(
                      'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isMe
                        ? 'bg-gradient-to-br from-primary-400 to-purple-500 text-white rounded-br-sm'
                        : 'bg-white/8 text-dark-100 rounded-bl-sm',
                      msg.isDeleted && 'opacity-50 italic'
                    )}>
                      {msg.isDeleted ? 'This message was deleted' : msg.content}
                    </div>
                    <p className={clsx('text-dark-500 text-xs mt-0.5', isMe ? 'text-right' : 'text-left')}>
                      {formatMsgTime(msg.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 ml-10">
                <div className="bg-white/8 rounded-full px-3 py-2 flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          rows={1}
          className="input flex-1 resize-none text-sm py-2.5 min-h-10"
          style={{ maxHeight: '100px' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="btn-primary btn p-2.5 flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
