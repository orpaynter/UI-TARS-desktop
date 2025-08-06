import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatCompletionContentPart } from '@tarko/agent-interface';
import { ImagePreview } from '../ImagePreview';
import { ContextualTags } from '../ContextualTags';
import { ContextualItem } from '../ContextualSelector';

interface MessageAttachmentsProps {
  images: ChatCompletionContentPart[];
  contextualItems: ContextualItem[];
  onRemoveImage: (index: number) => void;
  onRemoveContextualItem: (id: string) => void;
}

/**
 * MessageAttachments - Displays image previews and contextual tags
 *
 * Manages the display of all attachments (images and contextual file references)
 */
export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  images,
  contextualItems,
  onRemoveImage,
  onRemoveContextualItem,
}) => {
  // Check if contextual selector is enabled
  const isContextualSelectorEnabled = window.AGENT_WEB_UI_CONFIG?.enableContextualSelector ?? false;

  const hasAttachments = images.length > 0 || (isContextualSelectorEnabled && contextualItems.length > 0);

  if (!hasAttachments) {
    return null;
  }

  return (
    <>
      {/* Contextual tags */}
      {isContextualSelectorEnabled && contextualItems.length > 0 && (
        <ContextualTags items={contextualItems} onRemove={onRemoveContextualItem} />
      )}
      
      {/* Image previews */}
      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <AnimatePresence>
            {images.map((image, index) => (
              <ImagePreview
                key={index}
                image={image}
                onRemove={() => onRemoveImage(index)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};
