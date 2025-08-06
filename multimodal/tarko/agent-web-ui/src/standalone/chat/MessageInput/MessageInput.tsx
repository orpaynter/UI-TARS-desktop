import React, { useState, useEffect } from 'react';
import { useSession } from '@/common/hooks/useSession';
import { ConnectionStatus } from '@/common/types';
import { useLocation } from 'react-router-dom';
import { ChatCompletionContentPart } from '@tarko/agent-interface';
import { MessageInputField } from './MessageInputField';
import { MessageAttachments } from './MessageAttachments';
import { ContextualItem } from '../ContextualSelector';

interface MessageInputProps {
  isDisabled?: boolean;
  onReconnect?: () => void;
  connectionStatus?: ConnectionStatus;
  initialQuery?: string;
}

/**
 * MessageInput Component - Main container for message composition
 *
 * Handles overall state coordination and message sending logic
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  isDisabled = false,
  onReconnect,
  connectionStatus,
}) => {
  const [input, setInput] = useState('');
  const [uploadedImages, setUploadedImages] = useState<ChatCompletionContentPart[]>([]);
  const [contextualItems, setContextualItems] = useState<ContextualItem[]>([]);
  
  const location = useLocation();
  const { sendMessage, isProcessing, activeSessionId, checkSessionStatus } = useSession();

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

  const handleSubmit = async () => {
    if ((!input.trim() && uploadedImages.length === 0) || isDisabled) return;

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

    try {
      await sendMessage(messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveContextualItem = (id: string) => {
    // Find the item to remove
    const itemToRemove = contextualItems.find(item => item.id === id);
    if (!itemToRemove) return;
    
    // Generate the tag text that should be removed from input
    let tagText: string;
    if (itemToRemove.type === 'workspace') {
      tagText = '@workspace';
    } else {
      tagText = `${itemToRemove.type === 'directory' ? '@dir:' : '@file:'}${itemToRemove.relativePath}`;
    }
    
    // Remove the tag from input text
    let newInput = input;
    
    // Try to find and remove the exact tag (with potential trailing space)
    const tagWithSpace = tagText + ' ';
    const tagIndex = newInput.indexOf(tagWithSpace);
    
    if (tagIndex !== -1) {
      // Remove tag with trailing space
      newInput = newInput.slice(0, tagIndex) + newInput.slice(tagIndex + tagWithSpace.length);
    } else {
      // Try to remove tag without trailing space
      const tagOnlyIndex = newInput.indexOf(tagText);
      if (tagOnlyIndex !== -1) {
        newInput = newInput.slice(0, tagOnlyIndex) + newInput.slice(tagOnlyIndex + tagText.length);
      }
    }
    
    setInput(newInput);
    
    // Update contextual items state
    setContextualItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="relative">
      <MessageAttachments 
        images={uploadedImages}
        contextualItems={contextualItems}
        onRemoveImage={handleRemoveImage}
        onRemoveContextualItem={handleRemoveContextualItem}
      />
      
      <MessageInputField
        input={input}
        setInput={setInput}
        contextualItems={contextualItems}
        setContextualItems={setContextualItems}
        uploadedImages={uploadedImages}
        setUploadedImages={setUploadedImages}
        isDisabled={isDisabled}
        isProcessing={isProcessing}
        connectionStatus={connectionStatus}
        onSubmit={handleSubmit}
        onReconnect={onReconnect}
      />
    </div>
  );
};
