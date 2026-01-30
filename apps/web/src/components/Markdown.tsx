import ReactMarkdown from 'react-markdown';

export function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown-preview text-sm leading-relaxed text-gray-800">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

