import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Sparkles,
  Activity,
  AlertTriangle,
  Database,
  Server,
  Clock,
  Zap,
  ChevronRight,
  Loader2,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Streamdown } from 'streamdown';

// Chat message types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: QuickAction[];
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  query: string;
}

// Suggested queries for quick actions
const suggestedQueries: QuickAction[] = [
  { label: 'System Health', icon: <Activity className="h-3 w-3" />, query: 'What is the current system health status?' },
  { label: 'Error Analysis', icon: <AlertTriangle className="h-3 w-3" />, query: 'Show me recent errors and their root causes' },
  { label: 'Database Status', icon: <Database className="h-3 w-3" />, query: 'How are the databases performing?' },
  { label: 'Service Issues', icon: <Server className="h-3 w-3" />, query: 'Are there any service degradations?' },
  { label: 'Latency Report', icon: <Clock className="h-3 w-3" />, query: 'Why did latency spike recently?' },
  { label: 'Create Alert', icon: <Zap className="h-3 w-3" />, query: 'Create an alert for CPU > 80%' },
];

// Mock AI response generator based on query context
function generateAIResponse(query: string): { content: string; actions?: QuickAction[] } {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('health') || lowerQuery.includes('status')) {
    return {
      content: `📊 **System Health Overview**

Current infrastructure status across all GCP services:

| Component | Status | Uptime |
|-----------|--------|--------|
| Compute Engine | ✅ Healthy | 99.97% |
| Cloud SQL | ✅ Healthy | 99.95% |
| Cloud Run | ⚠️ Degraded | 98.2% |
| Load Balancer | ✅ Healthy | 99.99% |

**Key Observations:**
- Cloud Run experiencing elevated latency in us-east1 region
- 3 instances auto-scaled in last hour to handle increased traffic
- No critical alerts in the past 24 hours

*Last updated: ${new Date().toLocaleTimeString()}*`,
      actions: [
        { label: 'View Metrics', icon: <Activity className="h-3 w-3" />, query: 'Show me detailed metrics for Cloud Run' },
        { label: 'Check Alerts', icon: <AlertTriangle className="h-3 w-3" />, query: 'Show active alerts' },
      ]
    };
  }
  
  if (lowerQuery.includes('error') || lowerQuery.includes('issue')) {
    return {
      content: `🔍 **Error Analysis Summary**

Analyzed 1,247 log entries from the last hour:

**Top Error Patterns:**
1. \`ConnectionTimeoutException\` - 47 occurrences
   - Primary source: auth-service
   - Root cause: Connection pool exhaustion

2. \`DatabaseQueryTimeout\` - 23 occurrences
   - Primary source: api-gateway
   - Root cause: Missing index on users.last_login

3. \`RateLimitExceeded\` - 12 occurrences
   - Primary source: external API calls
   - Root cause: Traffic spike from marketing campaign

**Recommended Actions:**
- 🔧 Increase connection pool size (High Priority)
- 📊 Add database index (Medium Priority)
- ⏱️ Implement request queuing (Low Priority)`,
      actions: [
        { label: 'View Logs', icon: <History className="h-3 w-3" />, query: 'Show me the error logs' },
        { label: 'Root Cause', icon: <Sparkles className="h-3 w-3" />, query: 'Explain the connection pool issue' },
      ]
    };
  }
  
  if (lowerQuery.includes('database') || lowerQuery.includes('sql') || lowerQuery.includes('db')) {
    return {
      content: `🗄️ **Database Performance Report**

**Cloud SQL Instances:**

| Instance | CPU | Memory | Connections | QPS |
|----------|-----|--------|-------------|-----|
| prod-primary | 45% | 72% | 89/100 | 1.2k |
| prod-replica | 23% | 58% | 34/100 | 890 |
| staging | 12% | 34% | 8/50 | 45 |

**Slow Queries Detected (>100ms):**
- \`SELECT * FROM users WHERE last_login > ?\` - avg 340ms
- \`JOIN orders ON users.id = orders.user_id\` - avg 180ms

**Recommendations:**
1. Add composite index on (user_id, last_login)
2. Consider connection pooling with PgBouncer
3. Enable query caching for read replicas`,
      actions: [
        { label: 'Optimize', icon: <Zap className="h-3 w-3" />, query: 'How do I optimize the slow queries?' },
      ]
    };
  }
  
  if (lowerQuery.includes('latency') || lowerQuery.includes('slow') || lowerQuery.includes('spike')) {
    return {
      content: `📈 **Latency Analysis**

Detected latency spike at **14:00-14:30 UTC** today.

**Contributing Factors:**
1. **Database Query Time** (+180ms)
   - 3 slow queries identified
   - Missing index on frequently accessed table

2. **Increased Traffic** (+45%)
   - Marketing campaign launched at 13:55
   - 2,400 additional requests/min

3. **GC Pressure** (+50ms)
   - Java heap at 85% capacity
   - Frequent minor GC cycles

**Impact:**
- P95 latency increased from 120ms to 450ms
- 2.3% of requests exceeded SLA threshold

**Mitigation Applied:**
- Auto-scaling triggered at 14:15
- 2 additional instances deployed`,
      actions: [
        { label: 'View Timeline', icon: <Clock className="h-3 w-3" />, query: 'Show me the incident timeline' },
      ]
    };
  }
  
  if (lowerQuery.includes('alert') || lowerQuery.includes('create')) {
    return {
      content: `✅ **Alert Configuration**

I've prepared an alert rule based on your request:

\`\`\`yaml
name: High CPU Usage Alert
metric: compute.googleapis.com/instance/cpu/utilization
threshold: 0.80
comparison: GREATER_THAN
duration: 5m
severity: WARNING
notification_channels:
  - email: ops-team@company.com
  - slack: #alerts-infra
\`\`\`

**This alert will trigger when:**
- CPU usage exceeds 80%
- For more than 5 consecutive minutes
- On any Compute Engine instance

Would you like me to create this alert?`,
      actions: [
        { label: 'Create Alert', icon: <Zap className="h-3 w-3" />, query: 'Yes, create this alert' },
        { label: 'Modify', icon: <Server className="h-3 w-3" />, query: 'Change threshold to 90%' },
      ]
    };
  }

  // Default response
  return {
    content: `I understand you're asking about: "${query}"

I can help you with:
- 📊 **System Health** - Check status of all GCP services
- 🔍 **Error Analysis** - Find and diagnose issues
- 🗄️ **Database Performance** - Monitor SQL instances
- 📈 **Latency Analysis** - Investigate slow responses
- ⚡ **Alert Management** - Create and manage alerts

Try asking something like:
- "What is the current system health?"
- "Show me recent errors"
- "Why is the API slow?"`,
  };
}

// Main ChatAssistant component
export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    }
  }, [messages, isTyping]);

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateAIResponse(content);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-primary to-chart-4 hover:opacity-90",
          "transition-all duration-300 hover:scale-105",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>

      {/* Notification Badge */}
      {!isOpen && messages.length === 0 && (
        <div className="fixed bottom-[5.5rem] right-6 z-50 animate-bounce">
          <Badge className="bg-chart-4 text-white shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Ask me anything!
          </Badge>
        </div>
      )}

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="p-4 pb-3 border-b bg-gradient-to-r from-primary/10 to-chart-4/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-chart-4 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-lg">Infrastructure AI</SheetTitle>
                  <SheetDescription className="text-xs">
                    Ask questions about your GCP infrastructure
                  </SheetDescription>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Messages Area - overflow-hidden needed for ScrollArea to work properly */}
          <div ref={scrollRef} className="flex-1 overflow-hidden">
            <ScrollArea className="h-full [&_[data-radix-scroll-area-viewport]]:!block">
              <div className="p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">How can I help?</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
                      I can analyze logs, explain metrics, diagnose issues, and help manage your infrastructure.
                    </p>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
                      {suggestedQueries.map((query, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(query.query)}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent text-left text-sm transition-colors"
                        >
                          <span className="text-primary">{query.icon}</span>
                          <span className="text-xs">{query.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <TooltipProvider>
                      {messages.map((message) => (
                        <div key={message.id} className="space-y-2">
                          <div
                            className={cn(
                              "flex gap-3 group",
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {message.role === 'assistant' && (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "rounded-lg px-4 py-3 max-w-[85%] relative",
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              {/* Copy Button for Assistant Messages */}
                              {message.role === 'assistant' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopyMessage(message.id, message.content)}
                                      className={cn(
                                        "absolute top-2 right-2 p-1.5 rounded-md transition-all",
                                        "opacity-0 group-hover:opacity-100",
                                        "hover:bg-background/80 text-muted-foreground hover:text-foreground",
                                        copiedId === message.id && "opacity-100 text-green-500"
                                      )}
                                    >
                                      {copiedId === message.id ? (
                                        <Check className="h-3.5 w-3.5" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs">
                                    {copiedId === message.id ? 'Copied!' : 'Copy message'}
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {message.role === 'assistant' ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none pr-6 text-sm [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-background/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_pre]:bg-background/80 [&_pre]:border [&_pre]:border-border [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:before:content-none [&_code]:after:content-none [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_p]:my-2 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground">
                                  <Streamdown>{message.content}</Streamdown>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap text-sm">
                                  {message.content}
                                </p>
                              )}
                            </div>
                            {message.role === 'user' && (
                              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                                <User className="h-4 w-4 text-secondary-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Quick Actions from response */}
                          {message.role === 'assistant' && message.actions && (
                            <div className="flex gap-2 ml-11 flex-wrap">
                              {message.actions.map((action, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSendMessage(action.query)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card hover:bg-accent text-xs transition-colors"
                                >
                                  <span className="text-primary">{action.icon}</span>
                                  {action.label}
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </TooltipProvider>

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your infrastructure..."
                disabled={isTyping}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default ChatAssistant;

