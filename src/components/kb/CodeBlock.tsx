import { Check, Copy } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

interface ReactElementWithChildren {
  props: {
    children?: React.ReactNode;
  };
}

export const CodeBlock = ({ className, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const languageMatch = className?.match(/language-(\w+)/);
  const isBlockCode = !!languageMatch;

  if (!isBlockCode) {
    return <code className={className}>{children}</code>;
  }

  const language = languageMatch[1] || "text";

  const handleCopy = () => {
    let text = "";

    const extractText = (node: React.ReactNode): string => {
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(extractText).join("");
      if (React.isValidElement(node)) {
        const element = node as ReactElementWithChildren;
        return extractText(element.props.children);
      }
      return "";
    };

    text = extractText(children);

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("代码已复制");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-4 rounded-lg border border-border bg-muted/30 dark:bg-[#2d2d2d] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 dark:bg-black/20">
        <span className="text-xs font-mono uppercase text-muted-foreground">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="复制代码"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-600 dark:text-green-500" />
              <span className="text-green-600 dark:text-green-500">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>
      <pre className="m-0 p-4 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};
