import React, { useState } from 'react';
import { Feature1Analyze } from './Feature1Analyze';
import { Feature2Metadata } from './Feature2Metadata';

interface StudioWorkspaceProps {
  customApiKey: string;
  targetLanguage: string;
  onOpenCodeModal?: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  customApiKey,
  targetLanguage,
}) => {
  const [scriptToSync, setScriptToSync] = useState<string>('');

  const handleSendScriptToMetadata = (script: string) => {
    setScriptToSync(script);
  };

  return (
    <div className="w-full">
      {/* Side-by-Side Studio Layout: Left column smaller (4 cols), Right column larger (8 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Section 1: Media Analysis (Step 1) - Smaller column */}
        <div className="xl:col-span-4 space-y-6">
          <Feature1Analyze
            customApiKey={customApiKey}
            targetLanguage={targetLanguage}
            onSendScriptToMetadata={handleSendScriptToMetadata}
          />
        </div>

        {/* Section 2: Metadata Engine (Step 2) - Larger column */}
        <div className="xl:col-span-8 space-y-6">
          <Feature2Metadata
            customApiKey={customApiKey}
            targetLanguage={targetLanguage}
            incomingScript={scriptToSync}
          />
        </div>
      </div>
    </div>
  );
};

