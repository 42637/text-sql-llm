import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { SettingsPanel } from './components/SettingsPanel';
import { AboutModelModal } from './components/AboutModelModal';
import type {
  ModelHealth,
  ChatItem,
  SampleSchema,
  UserSettings,
} from './types';
import {
  checkHealth,
  generateSQL,
  fetchSampleSchemas,
} from './services/api';

const DEFAULT_SETTINGS: UserSettings = {
  darkMode: false,
  maxTokens: 256,
  temperature: 0.0,
  autoFormat: true,
  enableSandbox: true,
};

const STORAGE_KEYS = {
  SETTINGS: 'textsql_gpt_settings_v1',
  HISTORY: 'textsql_gpt_history_v1',
};

export const App: React.FC = () => {
  // Application State
  const [health, setHealth] = useState<ModelHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [sampleSchemas, setSampleSchemas] = useState<SampleSchema[]>([]);
  const [activeSample, setActiveSample] = useState<SampleSchema | null>(null);

  // Workspace Inputs
  const [question, setQuestion] = useState<string>('');
  const [schema, setSchema] = useState<string>('');
  const [sampleData, setSampleData] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Layout & Modals
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Chat History
  const [chatHistory, setChatHistory] = useState<ChatItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync settings & dark mode class
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }

    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(chatHistory));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [chatHistory]);

  // Fetch health check and sample schemas on mount
  const refreshHealth = useCallback(async () => {
    try {
      const h = await checkHealth();
      setHealth(h);
    } catch (err: any) {
      setHealth({
        backend_status: 'error',
        model_loaded: false,
        model_name: 'TextSQL-GPT-v1',
        architecture: 'decoder_only_transformer',
        device: 'unknown',
        parameter_count: 0,
        vocab_size: 16000,
        context_length: 2048,
        error: err.message || 'Cannot connect to backend',
      });
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    // Poll health periodically every 20s
    const interval = setInterval(refreshHealth, 20000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  useEffect(() => {
    fetchSampleSchemas()
      .then((samples) => {
        setSampleSchemas(samples);
        // Pre-select HR & Employees schema as an illustrative starting point
        if (samples.length > 0 && !schema) {
          const defaultSample = samples[0];
          setActiveSample(defaultSample);
          setSchema(defaultSample.schema);
          setSampleData(defaultSample.sample_data);
        }
      })
      .catch((err) => console.warn('Could not load sample schemas:', err));
  }, []);

  // Handle selecting a sample preset
  const handleSelectSample = (sample: SampleSchema) => {
    setActiveSample(sample);
    setSchema(sample.schema);
    setSampleData(sample.sample_data);
    if (sample.questions && sample.questions.length > 0) {
      setQuestion(sample.questions[0]);
    }
  };

  // Handle New Chat
  const handleNewChat = () => {
    setCurrentChatId(null);
    setQuestion('');
    setError(null);
  };

  // Handle selecting an existing chat
  const handleSelectChat = (id: string) => {
    const item = chatHistory.find((c) => c.id === id);
    if (item) {
      setCurrentChatId(item.id);
      setQuestion(item.question);
      setSchema(item.schema);
      setSampleData(item.sampleData);
      setError(null);
    }
  };

  // Handle deleting a chat
  const handleDeleteChat = (id: string) => {
    setChatHistory((prev) => prev.filter((c) => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  };

  // Handle clear all history
  const handleClearAllHistory = () => {
    setChatHistory([]);
    setCurrentChatId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch {}
  };

  // Toggle starred status
  const handleToggleStar = (id: string) => {
    setChatHistory((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isStarred: !c.isStarred } : c))
    );
  };

  // Generate SQL
  const handleGenerate = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await generateSQL(
        question,
        schema,
        settings.maxTokens,
        settings.temperature
      );

      if (res.status === 'error' || res.error) {
        setError(res.error || 'Failed to generate SQL');
        setIsGenerating(false);
        return;
      }

      const newItem: ChatItem = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        question: question.trim(),
        schema: schema.trim(),
        sampleData: sampleData,
        generatedSql: res.generated_sql,
        formattedSql: res.formatted_sql,
        sqlValid: res.sql_valid,
        validationError: res.validation_error,
        generationTime: res.generation_time,
        promptTokens: res.prompt_tokens,
        generatedTokens: res.generated_tokens,
        isStarred: false,
      };

      setChatHistory((prev) => [newItem, ...prev]);
      setCurrentChatId(newItem.id);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to TextSQL-GPT backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate query
  const handleRegenerate = async (item: ChatItem) => {
    setQuestion(item.question);
    setSchema(item.schema);
    setSampleData(item.sampleData);
    handleGenerate();
  };

  const currentItem = chatHistory.find((c) => c.id === currentChatId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#131314] text-[#202123] dark:text-[#E3E3E3] font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onClearAllHistory={handleClearAllHistory}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* Main Workspace Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Header */}
        <Header
          health={health}
          loading={loadingHealth}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          darkMode={settings.darkMode}
          onToggleDarkMode={() =>
            setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))
          }
          onNewChat={handleNewChat}
          onOpenAbout={() => setAboutOpen(true)}
        />

        {/* Workspace Body */}
        <ChatWorkspace
          question={question}
          setQuestion={setQuestion}
          schema={schema}
          setSchema={setSchema}
          sampleSchemas={sampleSchemas}
          onSelectSample={handleSelectSample}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          currentItem={currentItem}
          onRegenerate={handleRegenerate}
          onToggleStar={handleToggleStar}
          error={error}
          suggestedQuestions={activeSample?.questions}
          activeSample={activeSample}
        />
      </div>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onClearHistory={handleClearAllHistory}
      />

      {/* About Model Modal */}
      <AboutModelModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        health={health}
      />
    </div>
  );
};

export default App;
