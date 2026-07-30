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
    <div className="flex flex-col bg-white/50 backdrop-blur-[30px] border border-white/60 rounded-[32px] p-6 shadow-sm overflow-hidden" style={{ height: '64vh' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-4">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2.5 h-2.5 rounded-full', connected ? 'bg-success shadow-glow' : 'bg-danger animate-pulse')} />
          <span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">{connected ? 'Live Chat Connected' : 'Reconnecting...'}</span>
        </div>
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        ) : !messages.length ? (
          <EmptyState icon={<MessageCircle size={32} className="text-primary-500" />} title="No messages yet" description="Start the group conversation!" />
        ) : (
          <>
            {groupedMessages.map((msg, i) => {
              const isMe = msg.sender?._id === user?._id;
              return (
                <motion.div
                  key={msg._id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx('flex gap-2.5', isMe ? 'flex-row-reverse' : 'flex-row', !msg.showAvatar && 'ml-9')}
                >
                  {msg.showAvatar && (
                    <Avatar src={msg.sender?.photo} name={msg.sender?.fullName} size="xs" className="flex-shrink-0 mt-auto shadow-sm" />
                  )}
                  <div className={clsx('max-w-xs sm:max-w-md', !msg.showAvatar && (isMe ? 'mr-9' : 'ml-0'))}>
                    {msg.showName && !isMe && (
                      <p className="text-primary-500 text-[10px] font-bold uppercase tracking-wider mb-1 ml-1">{msg.sender?.fullName}</p>
                    )}
                    <div className={clsx(
                      'px-4 py-3 rounded-[20px] text-[13px] leading-relaxed font-medium shadow-sm transition-all',
                      isMe
                        ? 'bg-gradient-to-br from-primary-500 to-purple-500 text-white rounded-br-xs shadow-glow'
                        : 'bg-white/80 border border-white text-slate-800 rounded-bl-xs',
                      msg.isDeleted && 'opacity-50 italic'
                    )}>
                      {msg.isDeleted ? 'This message was deleted' : msg.content}
                    </div>
                    <p className={clsx('text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-wider', isMe ? 'text-right' : 'text-left')}>
                      {formatMsgTime(msg.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 ml-10 my-2">
                <div className="bg-white/80 border border-white rounded-full px-4 py-2.5 flex items-center gap-1.5 shadow-sm">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-3">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-white/70 border border-white/80 focus:border-primary-300 focus:bg-white px-5 py-3 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 rounded-full transition-all shadow-sm outline-none resize-none min-h-[44px]"
          style={{ maxHeight: '100px' }}
        />
        <motion.button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-glow flex-shrink-0 disabled:opacity-40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  );
}
