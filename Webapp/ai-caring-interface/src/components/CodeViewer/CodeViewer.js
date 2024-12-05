import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeViewer = ({ code, language }) => {
  const codeToDisplay = typeof code === 'string' ? code : '';

  return (
    <div style={styles.container}>
      <SyntaxHighlighter language={language} style={solarizedlight}>
        {codeToDisplay}
      </SyntaxHighlighter>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    margin: '20px 0',
  },
};

export default CodeViewer;
