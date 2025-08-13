import React from 'react';
import { DiffViewer } from './DiffViewer';

// Simple test to verify the component can be imported and rendered
const testDiffContent = `diff --git a/test.js b/test.js
index 1234567..abcdefg 100644
--- a/test.js
+++ b/test.js
@@ -1,3 +1,4 @@
 console.log('hello');
-console.log('old line');
+console.log('new line');
+console.log('added line');
 console.log('world');`;

// This is just a basic import test
export const TestDiffViewer = () => {
  return (
    <DiffViewer
      diffContent={testDiffContent}
      fileName="test.js"
      filePath="/path/to/test.js"
      fileSize="1.2 KB"
    />
  );
};

export default TestDiffViewer;
