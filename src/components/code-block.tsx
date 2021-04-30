// From https://mdxjs.com/guides/syntax-highlighting

import React, { ReactNode } from 'react';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';

interface CodeBlockProps {
  className: string;
  children: ReactNode;
}

function CodeBlock({ className, children }: CodeBlockProps) {
  const language = className.replace(/language-/, '') as Language;

  return (
    <Highlight {...defaultProps} code={children as string} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: '20px' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

export default CodeBlock;
