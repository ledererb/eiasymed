import React from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react/dist/ssr';
import styles from './Comment.module.css';

export interface CommentProps {
  state?: 'unfilled' | 'filled' | 'posted';
  authorName?: string;
  authorAvatar?: React.ReactNode;
  timestamp?: string;
  text?: string;
  placeholder?: string;
  className?: string;
  onSend?: () => void;
}

export const Comment: React.FC<CommentProps> = ({
  state = 'unfilled',
  authorName,
  authorAvatar,
  timestamp,
  text,
  placeholder = 'Megjegyzés',
  className,
  onSend,
}) => {
  if (state === 'unfilled') {
    return (
      <div className={[styles.comment, styles.unfilled, className].filter(Boolean).join(' ')}>
        {authorAvatar && <span className={styles.avatar}>{authorAvatar}</span>}
        <span className={styles.placeholder}>{placeholder}</span>
        <span className={styles.sendBtn} onClick={onSend}><PaperPlaneRight size={16} weight="fill" /></span>
      </div>
    );
  }

  if (state === 'filled') {
    return (
      <div className={[styles.comment, className].filter(Boolean).join(' ')}>
        {authorAvatar && <span className={styles.avatar}>{authorAvatar}</span>}
        <div className={styles.body}>
          <p className={styles.text}>{text}</p>
        </div>
        <span className={styles.sendBtn} onClick={onSend}><PaperPlaneRight size={16} weight="fill" /></span>
      </div>
    );
  }

  // posted
  return (
    <div className={[styles.comment, className].filter(Boolean).join(' ')}>
      {authorAvatar && <span className={styles.avatar}>{authorAvatar}</span>}
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.authorName}>{authorName}</span>
          {timestamp && <span className={styles.timestamp}>{timestamp}</span>}
        </div>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
};

export interface CommentBundleProps { children: React.ReactNode; moreLabel?: string; onMore?: () => void; className?: string; }

export const CommentBundle: React.FC<CommentBundleProps> = ({ children, moreLabel = 'Több megjegyzés >', onMore, className }) => (
  <div className={[styles.bundle, className].filter(Boolean).join(' ')}>
    {React.Children.map(children, (child, i) => (
      <div key={i} className={styles.bundleItem}>{child}</div>
    ))}
    {moreLabel && <div className={styles.moreLink} onClick={onMore}>{moreLabel}</div>}
  </div>
);

export default Comment;
