import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '@/common/hooks/useSession';
import { FiSend, FiX, FiRefreshCw, FiImage, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectionStatus } from '@/common/types';
import { useLocation } from 'react-router-dom';
import './MessageInput.css';
import { ChatCompletionContentPart } from '@tarko/agent-interface';
import { ImagePreview } from './ImagePreview';
import { ContextualSelector, ContextualItem } from './ContextualSelector';
import { ContextualTags } from './ContextualTags';

interface MessageInputProps {
  isDisabled?: boolean;
  onReconnect?: () => void;
  connectionStatus?: ConnectionStatus;
  initialQuery?: string;
}

/**
 * MessageInput Component - Core message input functionality with contextual file selector
 *
 * Handles text input, image uploads, multimodal message composition, and contextual file selection.
 * Context expansion is handled on the server side for better security and performance.
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  isDisabled = false,
  onReconnect,
  connectionStatus,
}) => {
  const [input, setInput] = useState('');
  const [isAborting, setIsAborting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<ChatCompletionContentPart[]>([]);
  const [contextualItems, setContextualItems] = useState<ContextualItem[]>([]);
  
  // Contextual selector state
  const [showSelector, setShowSelector] = useState(false);
  const [selectorQuery, setSelectorQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { sendMessage, isProcessing, abortQuery, activeSessionId, checkSessionStatus } =
    useSession();

  // Check if contextual selector is enabled
  const isContextualSelectorEnabled = window.AGENT_WEB_UI_CONFIG?.enableContextualSelector ?? false;

  // Auto-submit query from URL parameters for direct navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');

    if (query && !isProcessing && activeSessionId) {
      setInput(query);

      const submitQuery = async () => {
        try {
          await sendMessage(query);
          setInput('');
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      };

      submitQuery();
    }
  }, [location.search, activeSessionId, isProcessing, sendMessage]);

  // Enhanced session status monitoring during active connections
  useEffect(() => {
    if (activeSessionId && connectionStatus?.connected) {
      checkSessionStatus(activeSessionId);

      const intervalId = setInterval(() => {
        checkSessionStatus(activeSessionId);
      }, 2000);

      return () => clearInterval(intervalId);
    }
  }, [activeSessionId, connectionStatus?.connected, checkSessionStatus]);

  // Enhanced @ symbol detection for contextual selector
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    const newValue = target.value;
    const newCursorPosition = target.selectionStart;
    
    setInput(newValue);
    setCursorPosition(newCursorPosition);

    // Dynamic height adjustment
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;

    if (!isContextualSelectorEnabled) return;

    // Check for @ symbol at cursor position
    const textBeforeCursor = newValue.slice(0, newCursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start of line or preceded by whitespace
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const isValidAtPosition = /\s/.test(charBeforeAt) || lastAtIndex === 0;
      
      if (isValidAtPosition) {
        const queryAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        
        // Only show selector if there's no space after @
        if (!queryAfterAt.includes(' ')) {
          setSelectorQuery(queryAfterAt);
          setShowSelector(true);
          return;
        }
      }
    }
    
    // Hide selector if conditions are not met
    if (showSelector) {
      setShowSelector(false);
      setSelectorQuery('');
    }
  };

  const handleContextualSelect = (item: ContextualItem) => {
    setShowSelector(false);
    setSelectorQuery('');
    
    // Add to contextual items if not already present
    const isDuplicate = contextualItems.some(existingItem => existingItem.id === item.id);
    if (!isDuplicate) {
      setContextualItems(prev => [...prev, item]);
    }
    
    // Remove the @query part from input and replace with tag reference
    const textBeforeCursor = input.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textBefore = input.slice(0, lastAtIndex);
      const textAfter = input.slice(cursorPosition);
      
      let tagText: string;
      if (item.type === 'workspace') {
        tagText = '@workspace';
      } else {
        tagText = `${item.type === 'directory' ? '@dir:' : '@file:'}${item.relativePath}`;
      }
      
      const newInput = textBefore + tagText + ' ' + textAfter;
      setInput(newInput);
      
      // Focus back to input
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = lastAtIndex + tagText.length + 1;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleRemoveContextualItem = (id: string) => {
    setContextualItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!input.trim() && uploadedImages.length === 0) || isDisabled) return;

    // Hide contextual selector if open
    setShowSelector(false);
    setSelectorQuery('');

    // Prepare message content - server will handle contextual expansion
    const messageToSend = input.trim();
    
    // Clear input and contextual items
    setInput('');
    setContextualItems([]);

    // Compose multimodal content when images are present
    const messageContent =
      uploadedImages.length > 0
        ? [
            ...uploadedImages,
            ...(messageToSend
              ? [{ type: 'text', text: messageToSend } as ChatCompletionContentPart]
              : []),
          ]
        : messageToSend;

    setUploadedImages([]);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      await sendMessage(messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle selector close
  const handleSelectorClose = () => {
    setShowSelector(false);
    setSelectorQuery('');
  };

  // Ctrl+Enter shortcut for power users, Enter alone doesn't send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape' && showSelector) {
      e.preventDefault();
      handleSelectorClose();
    }
  };

  const handleAbort = async () => {
    if (!isProcessing) return;

    setIsAborting(true);
    try {
      await abortQuery();
    } catch (error) {
      console.error('Failed to abort:', error);
    } finally {
      setIsAborting(false);
    }
  };

  useEffect(() => {
    if (!isDisabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDisabled]);

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImage: ChatCompletionContentPart = {
            type: 'image_url',
            image_url: {
              url: event.target.result as string,
              detail: 'auto',
            },
          };
          setUploadedImages((prev) => [...prev, newImage]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (isDisabled || isProcessing) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    let hasProcessedImage = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.indexOf('image') !== -1) {
        hasProcessedImage = true;

        const blob = item.getAsFile();
        if (!blob) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const newImage: ChatCompletionContentPart = {
              type: 'image_url',
              image_url: {
                url: event.target.result as string,
                detail: 'auto',
              },
            };
            setUploadedImages((prev) => [...prev, newImage]);
          }
        };
        reader.readAsDataURL(blob);
      }
    }

    if (hasProcessedImage) {
      console.log('Processed pasted image(s)');
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Contextual tags */}
      <ContextualTags items={contextualItems} onRemove={handleRemoveContextualItem} />
      
      {/* Contextual selector - positioned above input */}
      {isContextualSelectorEnabled && showSelector && (
        <div className="absolute left-0 right-0 bottom-full mb-2 z-50">
          <ContextualSelector
            isOpen={showSelector}
            query={selectorQuery}
            onSelect={handleContextualSelect}
            onClose={handleSelectorClose}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {uploadedImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedImages.map((image, index) => (
              <ImagePreview key={index} image={image} onRemove={() => handleRemoveImage(index)} />
            ))}
          </div>
        )}

        <div
          className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${
            isFocused ? 'shadow-md' : ''
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-r ${
              isFocused || input.trim() || uploadedImages.length > 0 || contextualItems.length > 0
                ? 'from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-border-flow'
                : 'from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700'
            } bg-[length:200%_200%] ${isFocused ? 'opacity-100' : 'opacity-70'}`}
          ></div>

          <div
            className={`relative m-[2px] rounded-[1.4rem] bg-white dark:bg-gray-800 backdrop-blur-sm ${
              isDisabled ? 'opacity-90' : ''
            }`}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={handlePaste}
              placeholder={
                connectionStatus && !connectionStatus.connected
                  ? 'Server disconnected...'
                  : isProcessing
                    ? 'Agent TARS is running...'
                    : isContextualSelectorEnabled
                      ? 'Ask Agent TARS something... (Use @ to reference files/folders, Ctrl+Enter to send)'
                      : 'Ask Agent TARS something... (Ctrl+Enter to send)'
              }
              disabled={isDisabled}
              className="w-full px-5 pt-4 pb-10 focus:outline-none resize-none min-h-[90px] max-h-[200px] bg-transparent text-sm leading-relaxed rounded-[1.4rem]"
              rows={2}
            />

            <div className="absolute left-3 bottom-2 flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleFileUpload}
                disabled={isDisabled || isProcessing}
                className={`p-2 rounded-full transition-colors ${
                  isDisabled || isProcessing
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-accent-500 hover:bg-gray-50 dark:hover:bg-gray-700/30 dark:text-gray-400'
                }`}
                title="Attach image (or paste directly)"
              >
                <FiImage size={18} />
              </motion.button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
                disabled={isDisabled || isProcessing}
              />
            </div>

            <AnimatePresence mode="wait">
              {connectionStatus && !connectionStatus.connected ? (
                <motion.button
                  key="reconnect"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  type="button"
                  onClick={onReconnect}
                  className="absolute right-3 bottom-2 p-2 rounded-full text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/30 dark:text-gray-400 transition-all duration-200"
                  title="Try to reconnect"
                >
                  <FiRefreshCw
                    size={20}
                    className={connectionStatus.reconnecting ? 'animate-spin' : ''}
                  />
                </motion.button>
              ) : isProcessing ? (
                <motion.button
                  key="abort"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  type="button"
                  onClick={handleAbort}
                  disabled={isAborting}
                  className={`absolute right-3 bottom-2 p-2 rounded-full ${
                    isAborting
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/30 dark:text-gray-400'
                  } transition-all duration-200`}
                  title="Abort current operation"
                >
                  {isAborting ? <FiLoader className="animate-spin" size={20} /> : <FiX size={20} />}
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  type="submit"
                  disabled={(!input.trim() && uploadedImages.length === 0) || isDisabled}
                  className={`absolute right-3 bottom-2 p-3 rounded-full ${
                    (!input.trim() && uploadedImages.length === 0) || isDisabled
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 text-white dark:text-gray-900 shadow-sm'
                  } transition-all duration-200`}
                >
                  <FiSend size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>

      <div className="flex justify-center mt-2 text-xs">
        {connectionStatus && !connectionStatus.connected ? (
          <motion.span
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="text-red-500 dark:text-red-400 flex items-center font-medium"
          >
            {connectionStatus.reconnecting
              ? 'Attempting to reconnect...'
              : 'Server disconnected. Click the button to reconnect.'}
          </motion.span>
        ) : isProcessing ? (
          <motion.span
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
            className="text-accent-500 dark:text-accent-400 flex items-center"
          >
            <span className="typing-indicator mr-2">
              <span></span>
              <span></span>
              <span></span>
            </span>
            Agent is processing your request...
          </motion.span>
        ) : (
          <motion.span
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
            className="text-gray-500 dark:text-gray-400 transition-opacity"
          >
            {isContextualSelectorEnabled ? (
              <>Use @ to reference files/folders • Ctrl+Enter to send • You can also paste images directly</>
            ) : (
              <>Use Ctrl+Enter to quickly send • You can also paste images directly</>
            )}
          </motion.span>
        )}
      </div>
    </div>
  );
};
